import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { SyncButton } from "@/components/sync-button";
import { DashboardAccordion } from "@/components/dashboard/dashboard-accordion";
import { EmptyState } from "@/components/ui/empty-state";
import {
	getNotedVideoIds,
	getUnwatchedVideosWithChannelTags,
} from "@/lib/db/queries";
import { groupByTag } from "@/lib/utils/video-grouping";

export default async function DashboardPage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/api/auth/signin");
	}

	const [allUnwatched, notedVideoIds] = await Promise.all([
		getUnwatchedVideosWithChannelTags(session.user.id),
		getNotedVideoIds(session.user.id),
	]);
	const tagGroups = groupByTag(allUnwatched);
	const totalUnwatched = allUnwatched.length;

	return (
		<>
			<Header
				title="Dashboard"
				subtitle={`Welcome back${session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}`}
				actions={<SyncButton />}
			/>

			<div className="space-y-8">
				{tagGroups.length > 0 ? (
					<DashboardAccordion
						tagGroups={tagGroups}
						notedVideoIds={notedVideoIds}
						totalUnwatched={totalUnwatched}
					/>
				) : (
					<EmptyState
						title="All caught up!"
						description="No unwatched videos. Sync your subscriptions to check for new content."
						action={<SyncButton />}
					/>
				)}
			</div>
		</>
	);
}
