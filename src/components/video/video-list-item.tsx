"use client";

import { useState } from "react";
import { formatDuration } from "@/lib/youtube/transformers";
import Image from "next/image";
import { Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleWatched } from "@/actions/videos";
import { VideoActionDialog } from "./video-action-dialog";
import { VideoMeta } from "./video-meta";
import { TagAssignPopover } from "@/components/topic/tag-assign-popover";
import type { Tag as TagType } from "@/lib/db/schema";

interface VideoListItemProps {
	video: {
		id: string;
		title: string;
		thumbnail?: string | null;
		publishedAt: Date;
		duration?: string | null;
		viewCount?: number | null;
		channelId?: string | null;
		tags?: { id: string; name: string; color: string }[];
	};
	channelTitle?: string;
	isWatched: boolean;
	hasNote?: boolean;
	allTags?: TagType[];
}

export function VideoListItem({
	video,
	channelTitle,
	isWatched,
	hasNote,
	allTags,
}: VideoListItemProps) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const assignedTagIds = (video.tags ?? []).map((t) => t.id);

	const handleToggle = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		await toggleWatched(video.id, isWatched);
	};

	const handleClick = () => {
		setDialogOpen(true);
	};

	return (
		<>
			<div
				className={cn(
					"group/item flex gap-3 rounded-xl border bg-card p-2.5 cursor-pointer",
					"transition-all duration-150 hover:shadow-sm",
					isWatched && "opacity-55",
					hasNote
						? "border-l-[3px] border-l-amber-400 border-border/60 hover:border-border/80 shadow-sm shadow-amber-400/10"
						: "border-border/60 hover:border-border",
				)}
				onClick={handleClick}
			>
				{/* Thumbnail */}
				<div
					className="relative shrink-0 overflow-hidden rounded-lg bg-muted"
					style={{ width: 128, aspectRatio: "16/9" }}
				>
					{video.thumbnail && (
						<Image
							src={video.thumbnail}
							alt={video.title}
							fill
							className="object-cover"
							sizes="128px"
						/>
					)}
					<div className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-px text-[10px] font-medium text-white tabular-nums">
						{video.duration ? formatDuration(video.duration) : "0:00"}
					</div>
					<Button
						variant="ghost"
						size="icon"
						className={cn(
							"absolute top-1 left-1 h-6 w-6 rounded-full backdrop-blur-sm",
							"opacity-0 group-hover/item:opacity-100 transition-opacity duration-150",
							isWatched
								? "bg-green-500/80 hover:bg-green-500"
								: "bg-black/50 hover:bg-black/70",
						)}
						onClick={handleToggle}
					>
						{isWatched ? (
							<CheckCircle2 className="h-3 w-3 text-white" />
						) : (
							<Check className="h-3 w-3 text-white/70" />
						)}
					</Button>

					{/* Tag channel button — only when allTags provided */}
					{video.channelId && allTags && (
						<div
							className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<TagAssignPopover
								channelId={video.channelId}
								allTags={allTags}
								assignedTagIds={assignedTagIds}
							/>
						</div>
					)}
				</div>

				{/* Metadata */}
				<VideoMeta
					title={video.title}
					channelTitle={channelTitle}
					publishedAt={video.publishedAt}
					viewCount={video.viewCount}
					hasNote={hasNote}
					className="flex-1 min-w-0 py-0.5"
				/>
			</div>

			<VideoActionDialog
				video={{
					id: video.id,
					title: video.title,
					thumbnail: video.thumbnail,
					channelId: video.channelId,
				}}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
			/>
		</>
	);
}
