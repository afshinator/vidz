import { describe, it, expect, vi, beforeEach } from "vitest";

// Collect revalidatePath calls so we can assert on them
const revalidateCalls: Array<{ path: string; type?: string }> = [];

// Mock next/cache before anything else
vi.mock("next/cache", () => ({
	revalidatePath: (path: string, type?: string) => {
		revalidateCalls.push({ path, type });
	},
}));

// Mock auth to return a valid session
vi.mock("@/auth", () => ({
	auth: vi.fn().mockResolvedValue({ user: { id: "test-user" } }),
}));

// Mock DB queries — verifyVideoOwnership needs getVideoById to return a video
// markVideoWatched/unwatched need to be no-ops
vi.mock("@/lib/db/queries", () => ({
	getVideoById: vi.fn().mockResolvedValue({
		id: "test-video",
		channelId: "test-channel",
		title: "Test Video",
	}),
	markVideoWatched: vi.fn().mockResolvedValue(undefined),
	markVideoUnwatched: vi.fn().mockResolvedValue(undefined),
	addToWatchlist: vi.fn().mockResolvedValue({}),
	removeFromWatchlist: vi.fn().mockResolvedValue(undefined),
}));

import { markAsWatchedAction, toggleWatched } from "../videos";

describe("markAsWatchedAction", () => {
	beforeEach(() => {
		revalidateCalls.length = 0;
	});

	it("revalidates only page paths (no layout fallback)", async () => {
		await markAsWatchedAction("test-video");

		// Should NOT use the overly-broad layout revalidation
		const layoutCalls = revalidateCalls.filter((c) => c.type === "layout");
		expect(layoutCalls).toHaveLength(0);

		// Should revalidate the exact pages that show watched/unwatched state
		const paths = revalidateCalls.map((c) => c.path).sort();
		expect(paths).toContain("/");
		expect(paths).toContain("/unwatched");
		expect(paths).toContain("/tags");
		expect(paths).toContain("/channels");
		expect(paths).toContain("/channels/[id]");
	});

	it("revalidates channels via dynamic page pattern, not layout type", async () => {
		await markAsWatchedAction("test-video");

		// The channels list page should be revalidated as a literal path
		expect(revalidateCalls).toContainEqual({ path: "/channels" });

		// The channels detail pages should use the dynamic pattern
		expect(revalidateCalls).toContainEqual({
			path: "/channels/[id]",
			type: "page",
		});
	});
});

describe("toggleWatched", () => {
	beforeEach(() => {
		revalidateCalls.length = 0;
	});

	it("revalidates unwatched page when marking as watched (currentlyUnwatched=true)", async () => {
		// isWatched is false → currentlyWatched is false → user is marking as watched
		await toggleWatched("test-video", false);

		const paths = revalidateCalls.map((c) => c.path);
		expect(paths).toContain("/unwatched");
	});

	it("revalidates unwatched page when un-watching (currentlyWatched=true)", async () => {
		// Bug fix: toggleWatched was missing /unwatched revalidation
		// When un-watching, the video should reappear on /unwatched
		await toggleWatched("test-video", true);

		const paths = revalidateCalls.map((c) => c.path);
		expect(paths).toContain("/unwatched");
	});

	it("does not use layout revalidation", async () => {
		await toggleWatched("test-video", false);

		const layoutCalls = revalidateCalls.filter((c) => c.type === "layout");
		expect(layoutCalls).toHaveLength(0);
	});

	it("revalidates channels via dynamic page pattern", async () => {
		await toggleWatched("test-video", true);

		expect(revalidateCalls).toContainEqual({
			path: "/channels/[id]",
			type: "page",
		});
		expect(revalidateCalls).toContainEqual({ path: "/channels" });
	});
});
