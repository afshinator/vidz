"use client";

import { useState } from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoGrid } from "@/components/video/video-grid";
import { useSound } from "@/hooks/use-sound";
import { notificationPopSound } from "@/lib/notification-pop";
import { bookCloseSound } from "@/lib/book-close";
import { getSoundsEnabled, setSoundsEnabled } from "@/lib/utils/sound-prefs";
import { ResizableAccordionContent } from "./resizable-accordion-content";
import type { TagGroup } from "@/lib/utils/video-grouping";
import type { Tag } from "@/lib/db/schema";

interface DashboardAccordionProps {
	tagGroups: TagGroup[];
	notedVideoIds: string[];
	totalUnwatched: number;
	allTags: Tag[];
}

function SoundToggle({
	enabled,
	onToggle,
}: {
	enabled: boolean;
	onToggle: () => void;
}) {
	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={onToggle}
			className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
			aria-label={enabled ? "Mute sounds" : "Unmute sounds"}
		>
			{enabled ? (
				<Volume2 className="h-3.5 w-3.5" />
			) : (
				<VolumeX className="h-3.5 w-3.5" />
			)}
		</Button>
	);
}

export function DashboardAccordion({
	tagGroups,
	notedVideoIds,
	totalUnwatched,
	allTags,
}: DashboardAccordionProps) {
	const notedIds = new Set(notedVideoIds);

	const [openSections, setOpenSections] = useState<string[]>(
		tagGroups[0] ? [tagGroups[0].id] : [],
	);

	const [soundsEnabled, setSoundsEnabledState] = useState(() => {
		if (typeof window === "undefined") return true;
		return getSoundsEnabled(localStorage);
	});

	const prefersReducedMotion =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const canPlay = soundsEnabled && !prefersReducedMotion;

	const [playExpand] = useSound(notificationPopSound, {
		volume: 0.35,
		interrupt: true,
		soundEnabled: canPlay,
	});
	const [playCollapse] = useSound(bookCloseSound, {
		volume: 0.3,
		interrupt: true,
		soundEnabled: canPlay,
	});

	const handleValueChange = (newValue: string[]) => {
		const opened = newValue.filter((v) => !openSections.includes(v));
		const closed = openSections.filter((v) => !newValue.includes(v));
		if (opened.length > 0) playExpand();
		if (closed.length > 0) playCollapse();
		setOpenSections(newValue);
	};

	const toggleSounds = () => {
		const next = !soundsEnabled;
		setSoundsEnabledState(next);
		if (typeof window !== "undefined") {
			setSoundsEnabled(localStorage, next);
		}
	};

	return (
		<section>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold">
					Unwatched{" "}
					<span className="text-muted-foreground font-normal text-base">
						({totalUnwatched})
					</span>
				</h2>
				<div className="flex items-center gap-2">
					<SoundToggle enabled={soundsEnabled} onToggle={toggleSounds} />
					<Button variant="outline" size="sm" asChild>
						<Link href="/unwatched">
							View All <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
						</Link>
					</Button>
				</div>
			</div>

			<Accordion
				type="multiple"
				value={openSections}
				onValueChange={handleValueChange}
				className="space-y-2"
			>
				{tagGroups.map((group) => (
					<AccordionItem
						key={group.id}
						value={group.id}
						className="border rounded-lg px-4"
					>
						<AccordionTrigger className="hover:no-underline py-4">
							<div className="flex items-center gap-3">
								<span
									className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
									style={{ backgroundColor: group.color }}
								/>
								<span className="text-base font-semibold">{group.name}</span>
								<Badge variant="secondary">{group.videos.length}</Badge>
							</div>
						</AccordionTrigger>
						<AccordionPrimitive.Content className="overflow-hidden data-open:animate-accordion-down data-closed:animate-accordion-up">
							<ResizableAccordionContent
								id={group.id}
								color={group.color}
								soundsEnabled={soundsEnabled}
							>
								<VideoGrid
									videos={group.videos.map((v) => ({
										...v,
										isWatched: false,
										hasNote: notedIds.has(v.id),
									}))}
									allTags={allTags}
								/>
							</ResizableAccordionContent>
						</AccordionPrimitive.Content>
					</AccordionItem>
				))}
			</Accordion>
		</section>
	);
}
