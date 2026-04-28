import type { UnwatchedVideoWithTags } from "@/lib/db/queries";

export interface TagGroup {
	id: string;
	name: string;
	color: string;
	videos: UnwatchedVideoWithTags[];
}

export function groupByTag(videos: UnwatchedVideoWithTags[]): TagGroup[] {
	const map = new Map<string, TagGroup>();
	const uncategorized: UnwatchedVideoWithTags[] = [];

	for (const video of videos) {
		if (video.tags.length === 0) {
			uncategorized.push(video);
		} else {
			for (const tag of video.tags) {
				if (!map.has(tag.id)) {
					map.set(tag.id, {
						id: tag.id,
						name: tag.name,
						color: tag.color,
						videos: [],
					});
				}
				const group = map.get(tag.id);
				if (!group) continue;
				group.videos.push(video);
			}
		}
	}

	const groups = Array.from(map.values())
		.filter((g) => g.videos.length > 0)
		.sort((a, b) => a.name.localeCompare(b.name));

	if (uncategorized.length > 0) {
		groups.push({
			id: "uncategorized",
			name: "Uncategorized",
			color: "#6b7280",
			videos: uncategorized,
		});
	}

	return groups;
}
