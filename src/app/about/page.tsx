import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, PlayCircle, BookmarkCheck, Tv, Settings, LayoutDashboard } from 'lucide-react';

export default async function AboutPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  return (
    <>
      <Header title="About vidz" />
      
      <div className="mt-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">vidz</span> is a personal YouTube subscription manager 
              built with Next.js 16 App Router, Drizzle ORM + Neon Postgres, and NextAuth Google OAuth.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>Routes and their purposes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { href: '/', label: 'Dashboard', icon: LayoutDashboard, desc: 'Tag-grouped accordion showing up to 8 unwatched videos per tag' },
                { href: '/unwatched', label: 'Unwatched', icon: PlayCircle, desc: 'All unwatched videos with Tags or YouTube Categories grouping' },
                { href: '/notes', label: 'Notes', icon: BookmarkCheck, desc: 'Saved videos with personal notes' },
                { href: '/tags', label: 'Tags', icon: Hash, desc: 'Channel grouping by custom tags' },
                { href: '/channels', label: 'Channels', icon: Tv, desc: 'All subscribed YouTube channels' },
                { href: '/settings', label: 'Settings', icon: Settings, desc: 'App configuration and preferences' },
              ].map((item) => (
                <div key={item.href} className="flex items-start gap-3">
                  <item.icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <div>
                    <a href={item.href} className="font-medium text-foreground hover:underline">{item.label}</a>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground">Theme</h4>
              <p className="text-sm text-muted-foreground">System / Light / Dark</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Timezone</h4>
              <p className="text-sm text-muted-foreground">Select your local timezone for accurate timestamps</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">YouTube Sync</h4>
              <p className="text-sm text-muted-foreground">Auto-sync toggle with interval options: Manual, 15min, 30min, 1hr, 6hr</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Category Backfill</h4>
              <p className="text-sm text-muted-foreground">Populate missing YouTube category data for existing videos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visual Design</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground">Typography</h4>
              <p className="text-sm text-muted-foreground">Space Grotesk for headings</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Accent Color</h4>
              <p className="text-sm text-muted-foreground">Crimson (OKLCH palette)</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Sidebar</h4>
              <p className="text-sm text-muted-foreground">Gradient background with crimson accent line</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">View Modes</h4>
              <p className="text-sm text-muted-foreground">Grid and List view toggle (persisted globally)</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Video Indicators</h4>
              <p className="text-sm text-muted-foreground">
                Cards: Amber ring + StickyNote badge when noted<br/>
                List items: Amber left-border + &quot;NOTED&quot; chip when noted
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Tag Colors</h4>
              <p className="text-sm text-muted-foreground">24-color picker (4 rows × 6 colors)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground">YouTube OAuth integration with subscriptions and videos sync via playlistItems API</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground">Video grouping by custom tags OR YouTube Categories</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground">Save videos with optional personal notes</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground">Assign multiple tags per channel via hover popover</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground">Click video to open action dialog: &quot;Open in YouTube&quot; or &quot;Save to Notes&quot;</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-sm text-muted-foreground">Dashboard shows tag-accordion with up to 8 unwatched videos per tag</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Entities</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            {['channels', 'videos', 'watched', 'video_notes', 'tags', 'channel_tags', 'video_tags', 'appSettings'].map((table) => (
              <div key={table} className="font-mono text-muted-foreground">{table}</div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
