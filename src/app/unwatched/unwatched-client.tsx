"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryAccordionList } from "@/components/unwatched/category-accordion-list";
import type { CategoryGroup } from "@/components/unwatched/category-accordion-list";
import { ChannelsCloud } from "@/components/unwatched/channels-cloud";
import type { ChannelCount } from "@/components/unwatched/channels-cloud";
import { getCategoryById } from "@/lib/topics/categorizer";
import { groupByTag as sharedGroupByTag } from "@/lib/utils/video-grouping";
import type { UnwatchedVideoWithTags } from "@/lib/db/queries";

type GroupMode = "category" | "tag";

function pluralize(count: number, singular: string, plural: string): string {
	return count === 1 ? singular : plural;
}

function groupByYTCategory(videos: UnwatchedVideoWithTags[]): CategoryGroup[] {
	const map = new Map<string, CategoryGroup>();

	for (const video of videos) {
		let name = "Uncategorized";
		if (video.categoryId) {
			const cat = getCategoryById(video.categoryId);
			if (cat) name = cat.name;
		}
		const slug = name.toLowerCase().replace(/\s+/g, "-");
		if (!map.has(name)) map.set(name, { name, slug, videos: [] });
		map.get(name)!.videos.push(video);
	}

	const groups = Array.from(map.values()).sort((a, b) => {
		if (a.name === "Uncategorized") return 1;
		if (b.name === "Uncategorized") return -1;
		return a.name.localeCompare(b.name);
	});
	for (const g of groups)
		g.videos.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
	return groups;
}

function groupByTag(videos: UnwatchedVideoWithTags[]): CategoryGroup[] {
	return sharedGroupByTag(videos).map((g) => ({
		name: g.name,
		slug: g.name.toLowerCase().replace(/\s+/g, "-"),
		color: g.color,
		videos: g.videos,
	}));
}

function countByChannel(videos: UnwatchedVideoWithTags[]): ChannelCount[] {
	const map = new Map<string, ChannelCount>();
	for (const video of videos) {
		if (!video.channelId) continue;
		const entry = map.get(video.channelId);
		if (entry) entry.count++;
		else
			map.set(video.channelId, {
				id: video.channelId,
				title: video.channelTitle,
				count: 1,
			});
	}
	return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function StatsHeader({
	totalCount,
	groupCount,
	mode,
	onModeChange,
}: {
	totalCount: number;
	groupCount: number;
	mode: GroupMode;
	onModeChange: (mode: GroupMode) => void;
}) {
	const groupLabel =
		mode === "tag"
			? pluralize(groupCount, "tag", "tags")
			: pluralize(groupCount, "category", "categories");

	return (
		<div className="flex items-center justify-between gap-4 flex-wrap">
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<span className="text-2xl font-bold font-heading">{totalCount}</span>
					<span className="text-sm text-muted-foreground">
						unwatched {pluralize(totalCount, "video", "videos")}
					</span>
				</div>
				<div className="h-6 w-px bg-border" />
				<div className="flex items-center gap-2">
					<span className="text-2xl font-bold font-heading">{groupCount}</span>
					<span className="text-sm text-muted-foreground">{groupLabel}</span>
				</div>
			</div>

			<div className="flex items-center border rounded-lg p-0.5">
				<Button
					variant={mode === "category" ? "secondary" : "ghost"}
					size="sm"
					className="text-xs"
					onClick={() => onModeChange("category")}
				>
					YouTube Categories
				</Button>
				<Button
					variant={mode === "tag" ? "secondary" : "ghost"}
					size="sm"
					className="text-xs"
					onClick={() => onModeChange("tag")}
				>
					Tags
				</Button>
			</div>
		</div>
	);
}

function CategoryBadges({ groups }: { groups: CategoryGroup[] }) {
	return (
		<div className="flex flex-wrap gap-1.5">
			{groups.map((group) => (
				<a key={group.slug} href={`#${group.slug}`}>
					<Badge
						variant="secondary"
						className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
					>
						{group.color && (
							<span
								className="inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
								style={{ backgroundColor: group.color }}
							/>
						)}
						{group.name}
						<span className="ml-1.5 font-semibold tabular-nums">
							{group.videos.length}
						</span>
					</Badge>
				</a>
			))}
		</div>
	);
}

export function UnwatchedClient({
	videos,
	notedVideoIds,
}: {
	videos: UnwatchedVideoWithTags[];
	notedVideoIds: string[];
}) {
	const [mode, setMode] = useState<GroupMode>("tag");

	const notedSet = new Set(notedVideoIds);
	const groups =
		mode === "tag" ? groupByTag(videos) : groupByYTCategory(videos);
	for (const g of groups) {
		g.videos = g.videos.map((v) => ({ ...v, hasNote: notedSet.has(v.id) }));
	}
	const channelCounts = countByChannel(videos);

	return (
		<div className="mt-6 space-y-6">
			<Card>
				<CardContent className="py-4 space-y-3">
					<StatsHeader
						totalCount={videos.length}
						groupCount={groups.length}
						mode={mode}
						onModeChange={setMode}
					/>
					<CategoryBadges groups={groups} />
					<ChannelsCloud channels={channelCounts} />
				</CardContent>
			</Card>

			<CategoryAccordionList groups={groups} />
		</div>
	);
}
