'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { syncNowAction } from '@/actions/sync';

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
        setStatus({ ok: false, message: error instanceof Error ? error.message : 'Sync failed' });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isPending}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? 'Syncing...' : 'Sync Now'}
      </Button>
      {status && (
        <span className={`flex items-center gap-1 text-xs ${status.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
          {status.ok
            ? <CheckCircle className="h-3 w-3" />
            : <AlertCircle className="h-3 w-3" />}
          {status.message}
        </span>
      )}
    </div>
  );
}