"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext, decodeAudioData } from "@/lib/sound-engine";
import type {
	SoundAsset,
	UseSoundOptions,
	UseSoundReturn,
} from "@/lib/sound-types";

/** Stop and null a source ref, swallowing errors from already-stopped nodes. */
function disposeSourceRef(
	ref: React.MutableRefObject<AudioBufferSourceNode | null>,
) {
	if (ref.current) {
		try {
			ref.current.stop();
		} catch {
			// Already stopped
		}
		ref.current = null;
	}
}

/** Wire up a buffer → gain → destination chain, start playback, and store refs. */
function startAudioGraph(
	ctx: AudioContext,
	buffer: AudioBuffer,
	gainValue: number,
	playbackRate: number,
	onEnded: () => void,
	sourceRef: React.MutableRefObject<AudioBufferSourceNode | null>,
	gainRef: React.MutableRefObject<GainNode | null>,
) {
	const source = ctx.createBufferSource();
	const gain = ctx.createGain();

	source.buffer = buffer;
	source.playbackRate.value = playbackRate;
	gain.gain.value = gainValue;

	source.connect(gain);
	gain.connect(ctx.destination);

	source.onended = onEnded;
	source.start(0);

	sourceRef.current = source;
	gainRef.current = gain;
}

export function useSound(
	sound: SoundAsset,
	options: UseSoundOptions = {},
): UseSoundReturn {
	const {
		volume = 1,
		playbackRate = 1,
		interrupt = false,
		soundEnabled = true,
		onPlay,
		onEnd,
		onPause,
		onStop,
	} = options;

	const [isPlaying, setIsPlaying] = useState(false);
	const [duration, setDuration] = useState<number | null>(
		sound.duration ?? null,
	);
	const sourceRef = useRef<AudioBufferSourceNode | null>(null);
	const gainRef = useRef<GainNode | null>(null);
	const bufferRef = useRef<AudioBuffer | null>(null);

	useEffect(() => {
		let cancelled = false;
		decodeAudioData(sound.dataUri).then((buffer) => {
			if (!cancelled) {
				bufferRef.current = buffer;
				setDuration(buffer.duration);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [sound.dataUri]);

	const stop = useCallback(() => {
		disposeSourceRef(sourceRef);
		setIsPlaying(false);
		onStop?.();
	}, [onStop]);

	const play = useCallback(
		(overrides?: { volume?: number; playbackRate?: number }) => {
			if (!soundEnabled || !bufferRef.current) return;

			const ctx = getAudioContext();
			if (ctx.state === "suspended") ctx.resume();
			if (interrupt && sourceRef.current) {
				setIsPlaying(false);
				onStop?.();
				disposeSourceRef(sourceRef);
			}

			startAudioGraph(
				ctx,
				bufferRef.current,
				overrides?.volume ?? volume,
				overrides?.playbackRate ?? playbackRate,
				() => {
					setIsPlaying(false);
					onEnd?.();
				},
				sourceRef,
				gainRef,
			);

			setIsPlaying(true);
			onPlay?.();
		},
		[soundEnabled, playbackRate, volume, interrupt, onStop, onPlay, onEnd],
	);

	const pause = useCallback(() => {
		stop();
		onPause?.();
	}, [stop, onPause]);

	useEffect(() => {
		if (gainRef.current) {
			gainRef.current.gain.value = volume;
		}
	}, [volume]);

	useEffect(() => {
		return () => disposeSourceRef(sourceRef);
	}, []);

	return [play, { stop, pause, isPlaying, duration, sound }] as const;
}
