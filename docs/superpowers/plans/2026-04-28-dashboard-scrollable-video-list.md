# Dashboard Scrollable Video List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove 8-video limit in dashboard accordion cards and add scrollable list view so users can see all videos without navigating away.

**Architecture:** Extract `groupByTag()` function to a separate file for testability, remove the `TAG_LIMIT` constraint, and wrap the `VideoGrid` component in a fixed-height scrollable container inside the accordion.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Vitest (testing)

---

### Task 1: Extract groupByTag and Add Unit Test

**Files:**
- Create: `src/lib/utils/video-grouping.ts`
- Create: `src/lib/utils/__tests__/video-grouping.test.ts`
- Modify: `src/app/page.tsx:24-51` (remove inline function)

- [ ] **Step 1: Write the failing test**

Create `src/lib/utils/__tests__/video-grouping.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { groupByTag } from '../video-grouping';
import type { UnwatchedVideoWithTags } from '@/lib/db/queries';

// Mock video factory
function makeVideo(overrides: Partial<UnwatchedVideoWithTags> = {}): UnwatchedVideoWithTags {
  return {
    id: 'vid1',
    channelId: 'chan1',
    title: 'Test Video',
    description: null,
    thumbnail: null,
    publishedAt: new Date('2024-01-01'),
    duration: null,
    viewCount: null,
    categoryId: null,
    fetchedAt: null,
    channelTitle: 'Test Channel',
    tags: [],
    ...overrides,
  };
}

describe('groupByTag', () => {
  it('should return ALL videos without artificial limit', () => {
    // Create 20 videos with the same tag
    const videos = Array.from({ length: 20 }, (_, i) =>
      makeVideo({
        id: `vid${i}`,
        title: `Video ${i}`,
        tags: [{ id: 'tag1', name: 'Programming', color: '#3b82f6' }],
      })
    );

    const result = groupByTag(videos);

    expect(result).toHaveLength(1);
    expect(result[0].videos).toHaveLength(20); // No limit!
  });

  it('should handle uncategorized videos without limit', () => {
    const videos = Array.from({ length: 15 }, (_, i) =>
      makeVideo({
        id: `vid${i}`,
        title: `Video ${i}`,
        tags: [],
      })
    );

    const result = groupByTag(videos);

    const uncategorized = result.find(g => g.id === 'uncategorized');
    expect(uncategorized).toBeDefined();
    expect(uncategorized!.videos).toHaveLength(15); // No limit!
  });

  it('should truncate videos that appear in multiple tags (once per tag)', () => {
    const video = makeVideo({
      id: 'vid1',
      tags: [
        { id: 'tag1', name: 'JavaScript', color: '#yellow' },
        { id: 'tag2', name: 'React', color: '#blue' },
      ],
    });

    const result = groupByTag([video]);

    expect(result).toHaveLength(2);
    expect(result[0].videos).toHaveLength(1);
    expect(result[1].videos).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /project/vidz && npx vitest run src/lib/utils/__tests__/video-grouping.test.ts`
Expected: FAIL with "Cannot find module '../video-grouping'"

- [ ] **Step 3: Create video-grouping.ts with groupByTag function**

Create `src/lib/utils/video-grouping.ts`:

```typescript
import type { UnwatchedVideoWithTags } from '@/lib/db/queries';

export interface TagGroup {
  id: string;
  name: string;
  color: string;
  videos: UnwatchedVideoWithTags[];
}

export function groupByTag(videos: UnwatchedVideoWithTags[]): TagGroup[] {
  const map = new Map<string, TagGroup>();
  const uncategorized: UnwatchedVideoWithTags[] = [];

  for (const video of videos) {
    if (video.tags.length === 0) {
      uncategorized.push(video);
    } else {
      for (const tag of video.tags) {
        if (!map.has(tag.id)) {
          map.set(tag.id, { id: tag.id, name: tag.name, color: tag.color, videos: [] });
        }
        const group = map.get(tag.id)!;
        group.videos.push(video);
      }
    }
  }

  const groups = Array.from(map.values())
    .filter((g) => g.videos.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (uncategorized.length > 0) {
    groups.push({ id: 'uncategorized', name: 'Uncategorized', color: '#6b7280', videos: uncategorized });
  }

  return groups;
}
```

- [ ] **Step 4: Update page.tsx to import groupByTag**

Modify `src/app/page.tsx`:
- Remove lines 15-51 (TAG_LIMIT constant and groupByTag function)
- Add import: `import { groupByTag } from '@/lib/utils/video-grouping';`
- Remove the local `TagGroup` interface (now imported from video-grouping.ts)

Updated `src/app/page.tsx` should start like:

```typescript
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUnwatchedVideosWithChannelTags, getNotedVideoIds } from '@/lib/db/queries';
import { Header } from '@/components/layout/header';
import { VideoGrid } from '@/components/video/video-grid';
import { EmptyState } from '@/components/ui/empty-state';
import { SyncButton } from '@/components/sync-button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { groupByTag } from '@/lib/utils/video-grouping';

export default async function DashboardPage() {
  // ... rest of component
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /project/vidz && npx vitest run src/lib/utils/__tests__/video-grouping.test.ts`
Expected: PASS (all 3 tests)

- [ ] **Step 6: Commit**

```bash
cd /project/vidz && git add src/lib/utils/video-grouping.ts src/lib/utils/__tests__/video-grouping.test.ts src/app/page.tsx
git commit -m "refactor: extract groupByTag from page.tsx for testability"
```

---

### Task 2: Remove TAG_LIMIT and Add Scrollable Container

**Files:**
- Modify: `src/app/page.tsx:111-118` (AccordionContent)

- [ ] **Step 1: Wrap VideoGrid in scrollable container**

Modify `src/app/page.tsx` lines 111-118 to add scrollable wrapper:

```tsx
<AccordionContent className="pb-4 pt-2">
  <div className="max-h-96 overflow-y-auto pr-2">
    <VideoGrid
      videos={group.videos.map((v) => ({
        ...v,
        isWatched: false,
        hasNote: notedIds.has(v.id),
      }))}
    />
  </div>
</AccordionContent>
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd /project/vidz && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run Biome lint**

Run: `cd /project/vidz && npx biome check --write src/app/page.tsx src/lib/utils/video-grouping.ts`
Expected: Fix any issues found

- [ ] **Step 4: Run unit tests**

Run: `cd /project/vidz && npx vitest run src/lib/utils/__tests__/video-grouping.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /project/vidz && git add src/app/page.tsx
git commit -m "feat: remove video limit and add scrollable list in dashboard accordion

- Remove TAG_LIMIT (was 8 videos per tag)
- Add max-h-96 overflow-y-auto scrollable container
- All videos now visible without navigating away"
```

---

### Task 3: Verify End-to-End

**Files:**
- Read: `src/app/page.tsx` (final state)

- [ ] **Step 1: Verify page.tsx has no TAG_LIMIT references**

Run: `cd /project/vidz && grep -n "TAG_LIMIT" src/app/page.tsx`
Expected: No output (TAG_LIMIT removed)

- [ ] **Step 2: Verify scrollable container exists**

Run: `cd /project/vidz && grep -A2 "AccordionContent" src/app/page.tsx | grep "max-h-96"`
Expected: Found (scrollable container in place)

- [ ] **Step 3: Run all quality checks**

Run:
```bash
cd /project/vidz && npx tsc --noEmit && \
npx biome check src/ && \
npx vitest run
```
Expected: All pass

- [ ] **Step 4: Final commit (if needed)**

If any fixes were made during quality checks, commit them.
