import { useMemo, useState } from "react";
import type { ChannelWithTags } from "@/lib/db/queries";
import type { Tag } from "@/lib/db/schema";

interface TagGroup {
	tag: Tag;
	channels: ChannelWithTags[];
}

export type { TagGroup };

interface TopicVisibility {
	visibleGroups: TagGroup[];
	showUntagged: boolean;
	allSectionIds: string[];
}

/** Pure logic: given tag groups, untagged channels, and active filter, compute visibility. */
export function computeTopicVisibility(
	tagGroups: TagGroup[],
	untagged: ChannelWithTags[],
	activeFilter: string | null,
): TopicVisibility {
	if (activeFilter === null) {
		const visibleGroups = tagGroups.filter((g) => g.channels.length > 0);
		const showUntagged = untagged.length > 0;
		return {
			visibleGroups,
			showUntagged,
			allSectionIds: [
				...visibleGroups.map((g) => g.tag.id),
				...(showUntagged ? ["untagged"] : []),
			],
		};
	}

	if (activeFilter === "untagged") {
		return {
			visibleGroups: [],
			showUntagged: true,
			allSectionIds: ["untagged"],
		};
	}

	const visibleGroups = tagGroups.filter(
		(g) => g.tag.id === activeFilter && g.channels.length > 0,
	);
	return {
		visibleGroups,
		showUntagged: false,
		allSectionIds: visibleGroups.map((g) => g.tag.id),
	};
}

export function useTopicFilter(channels: ChannelWithTags[], allTags: Tag[]) {
	const [activeFilter, setActiveFilter] = useState<string | null>(null);

	const tagGroups = useMemo(
		() =>
			allTags.map((tag) => ({
				tag,
				channels: channels.filter((c) => c.tags.some((t) => t.id === tag.id)),
			})),
		[allTags, channels],
	);
	const untagged = useMemo(
		() => channels.filter((c) => c.tags.length === 0),
		[channels],
	);

	return {
		activeFilter,
		setActiveFilter,
		...computeTopicVisibility(tagGroups, untagged, activeFilter),
		tagGroups,
		untagged,
	};
}
