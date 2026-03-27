import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getSettingsByUser, upsertSettings } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIMEZONES } from '@/lib/utils/time';
import { ThemeSelector } from '@/components/settings/theme-selector';
import { BackfillCategoriesButton } from '@/components/settings/backfill-categories-button';
import { Info } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }
  
  const settings = await getSettingsByUser(session.user.id);
  
  return (
    <>
      <Header title="Settings" />
      
      <div className="mt-6 space-y-6 max-w-2xl">
        <div className="flex gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Signed in as <span className="font-medium text-foreground">{session.user.id}</span>.
            If you ever revoke app access via{' '}
            <span className="font-medium text-foreground">myaccount.google.com/permissions</span>,
            you will need to sign out and back in — Google will not issue a new refresh token
            automatically, which means YouTube sync will stop working after an hour.
            If that happens, contact yourself to re-authorize.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how vidz looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <ThemeSelector 
                defaultValue={settings?.theme || 'system'} 
                userId={session.user.id}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Localization</CardTitle>
            <CardDescription>Set your timezone and display preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select defaultValue={settings?.timezone || 'America/Los_Angeles'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} ({tz.abbr})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>YouTube Sync</CardTitle>
            <CardDescription>Manage your YouTube data synchronization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-sync</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync your subscriptions
                </p>
              </div>
              <Switch />
            </div>
            <div className="space-y-2">
              <Label>Sync interval</Label>
              <Select defaultValue={settings?.syncIntervalMinutes?.toString() || '0'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Manual only</SelectItem>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every hour</SelectItem>
                  <SelectItem value="360">Every 6 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Category data</Label>
              <p className="text-sm text-muted-foreground">
                Populate missing YouTube category data for existing videos.
              </p>
              <BackfillCategoriesButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}