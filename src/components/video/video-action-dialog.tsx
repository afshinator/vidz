"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	ExternalLink,
	BookmarkPlus,
	Loader2,
	CheckCircle2,
	Check,
	ListPlus,
	Tv,
} from "lucide-react";
import { addNoteAction } from "@/actions/notes";
import { markAsWatchedAction, addToWatchlistAction } from "@/actions/videos";

interface VideoActionDialogProps {
	video: {
		id: string;
		title: string;
		thumbnail?: string | null;
		channelId?: string | null;
	};
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type ActionState = "menu" | "notes" | "success" | "watched" | "watchlisted";

/** Auto-dismiss after `ms`, then call `onDone`. */
function dismissAfter(ms: number, onDone: () => void) {
	setTimeout(onDone, ms);
}

function SuccessMessage({
	icon: Icon,
	text,
}: {
	icon: React.ComponentType<{ className?: string }>;
	text: string;
}) {
	return (
		<div className="flex flex-col items-center gap-2 py-6 text-green-500">
			<Icon className="h-8 w-8" />
			<p className="text-sm font-medium">{text}</p>
		</div>
	);
}

function MenuActions({
	onOpenYouTube,
	onShowNotes,
	onOpenChannel,
	onMarkWatched,
	onAddToWatchlist,
	isPending,
	showOpenChannel,
}: {
	onOpenYouTube: () => void;
	onShowNotes: () => void;
	onOpenChannel: () => void;
	onMarkWatched: () => void;
	onAddToWatchlist: () => void;
	isPending: boolean;
	showOpenChannel: boolean;
}) {
	return (
		<div className="flex flex-col gap-3 pt-2">
			<Button
				variant="default"
				className="w-full justify-start gap-2"
				onClick={onOpenYouTube}
			>
				<ExternalLink className="h-4 w-4" />
				Open in YouTube
			</Button>
			{showOpenChannel && (
				<Button
					variant="outline"
					className="w-full justify-start gap-2"
					onClick={onOpenChannel}
				>
					<Tv className="h-4 w-4" />
					Open Channel
				</Button>
			)}
			<Button
				variant="outline"
				className="w-full justify-start gap-2"
				onClick={onShowNotes}
			>
				<BookmarkPlus className="h-4 w-4" />
				Save to Notes
			</Button>
			<Button
				variant="outline"
				className="w-full justify-start gap-2"
				onClick={onMarkWatched}
				disabled={isPending}
			>
				<Check className="h-4 w-4" />
				Mark as Watched
			</Button>
			<Button
				variant="outline"
				className="w-full justify-start gap-2"
				onClick={onAddToWatchlist}
				disabled={isPending}
			>
				<ListPlus className="h-4 w-4" />
				Add to Watchlist
			</Button>
		</div>
	);
}

function NotesForm({
	notesText,
	onNotesChange,
	onSave,
	onSkip,
	isPending,
}: {
	notesText: string;
	onNotesChange: (text: string) => void;
	onSave: () => void;
	onSkip: () => void;
	isPending: boolean;
}) {
	return (
		<div className="space-y-3 pt-2">
			<textarea
				className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
				placeholder="Add a note... (optional)"
				value={notesText}
				onChange={(e) => onNotesChange(e.target.value)}
				autoFocus
			/>
			<div className="flex gap-2 justify-end">
				<Button
					variant="outline"
					size="sm"
					disabled={isPending}
					onClick={onSkip}
				>
					Skip
				</Button>
				<Button size="sm" disabled={isPending} onClick={onSave}>
					{isPending ? (
						<>
							<Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
							Saving…
						</>
					) : (
						"Save"
					)}
				</Button>
			</div>
		</div>
	);
}

export function VideoActionDialog({
	video,
	open,
	onOpenChange,
}: VideoActionDialogProps) {
	const [showNotes, setShowNotes] = useState(false);
	const [notesText, setNotesText] = useState("");
	const [actionState, setActionState] = useState<ActionState>("menu");
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	function resetAndClose() {
		setActionState("menu");
		setShowNotes(false);
		setNotesText("");
		onOpenChange(false);
	}

	function handleOpenYouTube() {
		window.open(`https://www.youtube.com/watch?v=${video.id}`, "_blank");
		onOpenChange(false);
	}

	function handleOpenChannel() {
		onOpenChange(false);
		router.push(`/channels/${video.channelId}`);
	}

	function handleSave(skipNotes?: boolean) {
		startTransition(async () => {
			await addNoteAction(
				video.id,
				skipNotes ? undefined : notesText.trim() || undefined,
			);
			setActionState("success");
			dismissAfter(1000, resetAndClose);
		});
	}

	function handleMarkWatched() {
		startTransition(async () => {
			await markAsWatchedAction(video.id);
			setActionState("watched");
			dismissAfter(1000, () => {
				setActionState("menu");
				onOpenChange(false);
			});
		});
	}

	function handleAddToWatchlist() {
		startTransition(async () => {
			await addToWatchlistAction(video.id);
			setActionState("watchlisted");
			dismissAfter(1000, () => {
				setActionState("menu");
				onOpenChange(false);
			});
		});
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) resetAndClose();
		else onOpenChange(nextOpen);
	}

	function renderState() {
		switch (actionState) {
			case "success":
				return <SuccessMessage icon={CheckCircle2} text="Saved to Notes" />;
			case "watched":
				return <SuccessMessage icon={Check} text="Marked as Watched" />;
			case "watchlisted":
				return <SuccessMessage icon={CheckCircle2} text="Added to Watchlist" />;
			case "notes":
				return (
					<NotesForm
						notesText={notesText}
						onNotesChange={setNotesText}
						onSave={() => handleSave(false)}
						onSkip={() => handleSave(true)}
						isPending={isPending}
					/>
				);
			default:
				return (
					<MenuActions
						onOpenYouTube={handleOpenYouTube}
						onShowNotes={() => {
							setShowNotes(true);
							setActionState("notes");
						}}
						onOpenChannel={handleOpenChannel}
						onMarkWatched={handleMarkWatched}
						onAddToWatchlist={handleAddToWatchlist}
						isPending={isPending}
						showOpenChannel={!!video.channelId}
					/>
				);
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="line-clamp-2 text-base leading-snug pr-6">
						{video.title}
					</DialogTitle>
				</DialogHeader>
				{renderState()}
			</DialogContent>
		</Dialog>
	);
}
