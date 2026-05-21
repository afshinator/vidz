import { describe, it, expect } from "vitest";
import { computeTopicVisibility } from "../use-topic-filter";
import type { ChannelWithTags } from "@/lib/db/queries";
import type { Tag } from "@/lib/db/schema";

function makeChannel(
	overrides: Partial<ChannelWithTags> = {},
): ChannelWithTags {
	return {
		id: "ch1",
		userId: "u1",
		title: "Test Channel",
		thumbnail: null,
		subscribedAt: null,
		createdAt: new Date(),
		customName: null,
		lastSyncedAt: null,
		tags: [],
		unwatchedCount: 0,
		...overrides,
	};
}

function makeTag(overrides: Partial<Tag> = {}): Tag {
	return {
		id: "t1",
		userId: "u1",
		name: "React",
		color: "#3b82f6",
		deletedAt: null,
		createdAt: new Date(),
		...overrides,
	};
}

function tagGroupsFrom(channels: ChannelWithTags[], allTags: Tag[]) {
	return allTags.map((tag) => ({
		tag,
		channels: channels.filter((c) => c.tags.some((t) => t.id === tag.id)),
	}));
}

describe("computeTopicVisibility", () => {
	it("shows all non-empty tag groups plus untagged by default", () => {
		const react = makeTag({ id: "t1", name: "React" });
		const vue = makeTag({ id: "t2", name: "Vue" });
		const tagged = makeChannel({ id: "ch1", tags: [react] });
		const untagged = makeChannel({ id: "ch2", tags: [] });
		const emptyTagChan = makeChannel({ id: "ch3", tags: [vue] });

		const result = computeTopicVisibility(
			tagGroupsFrom([tagged, untagged, emptyTagChan], [react, vue]),
			[untagged],
			null,
		);

		expect(result.visibleGroups).toHaveLength(2);
		expect(result.showUntagged).toBe(true);
		expect(result.allSectionIds).toEqual(["t1", "t2", "untagged"]);
	});

	it("hides tag groups with zero channels", () => {
		const react = makeTag({ id: "t1", name: "React" });
		const vue = makeTag({ id: "t2", name: "Vue" });

		const result = computeTopicVisibility(
			tagGroupsFrom([makeChannel({ id: "ch1", tags: [react] })], [react, vue]),
			[],
			null,
		);

		expect(result.visibleGroups).toHaveLength(1);
		expect(result.visibleGroups[0].tag.name).toBe("React");
	});

	it("hides untagged section when no untagged channels", () => {
		const react = makeTag({ id: "t1", name: "React" });

		const result = computeTopicVisibility(
			tagGroupsFrom([makeChannel({ id: "ch1", tags: [react] })], [react]),
			[],
			null,
		);

		expect(result.showUntagged).toBe(false);
		expect(result.allSectionIds).toEqual(["t1"]);
	});

	it("filters to a specific tag", () => {
		const react = makeTag({ id: "t1", name: "React" });
		const vue = makeTag({ id: "t2", name: "Vue" });

		const result = computeTopicVisibility(
			tagGroupsFrom(
				[
					makeChannel({ id: "ch1", tags: [react] }),
					makeChannel({ id: "ch2", tags: [vue] }),
					makeChannel({ id: "ch3", tags: [] }),
				],
				[react, vue],
			),
			[makeChannel({ id: "ch3", tags: [] })],
			"t1",
		);

		expect(result.visibleGroups).toHaveLength(1);
		expect(result.visibleGroups[0].tag.name).toBe("React");
		expect(result.showUntagged).toBe(false);
	});

	it("filters to untagged only", () => {
		const react = makeTag({ id: "t1", name: "React" });

		const result = computeTopicVisibility(
			tagGroupsFrom([makeChannel({ id: "ch1", tags: [react] })], [react]),
			[makeChannel({ id: "ch2", tags: [] })],
			"untagged",
		);

		expect(result.visibleGroups).toEqual([]);
		expect(result.showUntagged).toBe(true);
	});

	it("returns all when activeFilter is null", () => {
		const react = makeTag({ id: "t1", name: "React" });

		const result = computeTopicVisibility(
			tagGroupsFrom([makeChannel({ id: "ch1", tags: [react] })], [react]),
			[makeChannel({ id: "ch2", tags: [] })],
			null,
		);

		expect(result.showUntagged).toBe(true);
		expect(result.visibleGroups).toHaveLength(1);
	});
});
