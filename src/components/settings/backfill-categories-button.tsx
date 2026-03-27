'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { backfillCategoryIdsAction } from '@/actions/sync';

export function BackfillCategoriesButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setStatus(null);
    try {
      const result = await backfillCategoryIdsAction();
      setStatus(result.message);
    } catch {
      setStatus('Backfill failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? 'Backfilling…' : 'Backfill Category Data'}
      </Button>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}
