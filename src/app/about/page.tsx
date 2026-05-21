import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { InfoCard } from "@/components/ui/info-card";
import type { LucideIcon } from "lucide-react";
import {
	Hash,
	PlayCircle,
	BookmarkCheck,
	Tv,
	Settings,
	LayoutDashboard,
} from "lucide-react";

interface NavItem {
	href: string;
	label: string;
	icon: LucideIcon;
	desc: string;
}

interface FactItem {
	title: string;
	detail: string;
}

const NAV_ITEMS: NavItem[] = [
	{
		href: "/",
		label: "Dashboard",
		icon: LayoutDashboard,
		desc: "Tag-grouped accordion showing up to 8 unwatched videos per tag",
	},
	{
		href: "/unwatched",
		label: "Unwatched",
		icon: PlayCircle,
		desc: "All unwatched videos with Tags or YouTube Categories grouping",
	},
	{
		href: "/notes",
		label: "Notes",
		icon: BookmarkCheck,
		desc: "Saved videos with personal notes",
	},
	{
		href: "/tags",
		label: "Tags",
		icon: Hash,
		desc: "Channel grouping by custom tags",
	},
	{
		href: "/channels",
		label: "Channels",
		icon: Tv,
		desc: "All subscribed YouTube channels",
	},
	{
		href: "/settings",
		label: "Settings",
		icon: Settings,
		desc: "App configuration and preferences",
	},
];

const SETTINGS_OPTIONS: FactItem[] = [
	{ title: "Theme", detail: "System / Light / Dark" },
	{
		title: "Timezone",
		detail: "Select your local timezone for accurate timestamps",
	},
	{
		title: "YouTube Sync",
		detail:
			"Auto-sync toggle with interval options: Manual, 15min, 30min, 1hr, 6hr",
	},
	{
		title: "Category Backfill",
		detail: "Populate missing YouTube category data for existing videos",
	},
];

const DESIGN_FACTS: FactItem[] = [
	{ title: "Typography", detail: "Space Grotesk for headings" },
	{ title: "Accent Color", detail: "Crimson (OKLCH palette)" },
	{ title: "Sidebar", detail: "Gradient background with crimson accent line" },
	{
		title: "View Modes",
		detail: "Grid and List view toggle (persisted globally)",
	},
	{
		title: "Video Indicators",
		detail:
			'Cards: Amber ring + StickyNote badge when noted; List items: Amber left-border + "NOTED" chip when noted',
	},
	{ title: "Tag Colors", detail: "24-color picker (4 rows × 6 colors)" },
];

const KEY_FEATURES = [
	"YouTube OAuth integration with subscriptions and videos sync via playlistItems API",
	"Video grouping by custom tags OR YouTube Categories",
	"Save videos with optional personal notes",
	"Assign multiple tags per channel via hover popover",
	'Click video to open action dialog: "Open in YouTube" or "Save to Notes"',
	"Dashboard shows tag-accordion with up to 8 unwatched videos per tag",
];

const DB_TABLES = [
	"channels",
	"videos",
	"watched",
	"video_notes",
	"tags",
	"channel_tags",
	"video_tags",
	"appSettings",
];

function FactList({ items }: { items: FactItem[] }) {
	return (
		<>
			{items.map(({ title, detail }) => (
				<div key={title}>
					<h4 className="font-medium text-foreground">{title}</h4>
					<p className="text-sm text-muted-foreground">{detail}</p>
				</div>
			))}
		</>
	);
}

export default async function AboutPage() {
	const session = await auth();
	if (!session?.user?.id) {
		redirect("/api/auth/signin");
	}

	return (
		<>
			<Header title="About vidz" />

			<div className="mt-6 space-y-6 max-w-2xl">
				<InfoCard title="Project Summary">
					<p className="text-sm text-muted-foreground">
						<span className="font-medium text-foreground">vidz</span> is a
						personal YouTube subscription manager built with Next.js 16 App
						Router, Drizzle ORM + Neon Postgres, and NextAuth Google OAuth.
					</p>
				</InfoCard>

				<InfoCard title="Navigation" description="Routes and their purposes">
					<div className="space-y-3">
						{NAV_ITEMS.map((item) => (
							<div key={item.href} className="flex items-start gap-3">
								<item.icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
								<div>
									<a
										href={item.href}
										className="font-medium text-foreground hover:underline"
									>
										{item.label}
									</a>
									<p className="text-sm text-muted-foreground">{item.desc}</p>
								</div>
							</div>
						))}
					</div>
				</InfoCard>

				<InfoCard title="Settings Options" className="space-y-4">
					<FactList items={SETTINGS_OPTIONS} />
				</InfoCard>

				<InfoCard title="Visual Design" className="space-y-4">
					<FactList items={DESIGN_FACTS} />
				</InfoCard>

				<InfoCard title="Key Features" className="space-y-3">
					{KEY_FEATURES.map((feature) => (
						<div key={feature} className="flex items-start gap-3">
							<div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
							<p className="text-sm text-muted-foreground">{feature}</p>
						</div>
					))}
				</InfoCard>

				<InfoCard
					title="Database Entities"
					className="grid grid-cols-2 gap-2 text-sm"
				>
					{DB_TABLES.map((table) => (
						<div key={table} className="font-mono text-muted-foreground">
							{table}
						</div>
					))}
				</InfoCard>
			</div>
		</>
	);
}
