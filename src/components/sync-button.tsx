'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { syncNowAction } from '@/actions/sync';
import { cn } from '@/lib/utils';

type SyncStatus = { ok: true; message: string } | { ok: false; message: string } | null;

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<SyncStatus>(null);

  const handleSync = () => {
    setStatus(null);
    startTransition(async () => {
      try {
        const result = await syncNowAction();
        setStatus({ ok: result.success, message: result.message });
      } catch (error) {
        setStatus({
          ok: false,
          message: error instanceof Error ? error.message : 'Sync failed',
        });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={handleSync}
        disabled={isPending}
        className="gap-1.5 shadow-sm"
      >
        <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
        {isPending ? 'Syncing…' : 'Sync Now'}
      </Button>
      {status && (
        <span
          className={cn(
            'flex items-center gap-1.5 text-xs max-w-[280px]',
            status.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'
          )}
        >
          {status.ok ? (
            <CheckCircle className="h-3 w-3 shrink-0" />
          ) : (
            <AlertCircle className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{status.message}</span>
        </span>
      )}
    </div>
  );
}
