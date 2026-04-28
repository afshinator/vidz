# Dashboard Scrollable Video List Design

**Date:** 2026-04-28  
**Goal:** Allow users to see ALL videos inside dashboard accordion cards without navigating away

## Current Problem

- `TAG_LIMIT = 8` in `src/app/page.tsx` truncates videos per tag
- Users see "8 / 24" and must click "View All" to see remaining videos
- Forces navigation away from dashboard, breaking workflow

## Design: Scrollable List View (Option B)

### Architecture

1. **Remove** `TAG_LIMIT = 8` in `src/app/page.tsx`
2. **Remove** limit check in `groupByTag()` function
3. **Add** fixed-height scrollable container around `<VideoGrid>` inside accordion
4. **Default to list view** inside accordion (compact layout shows more videos)
5. **Keep** view mode toggle working (user can switch to grid if preferred)

### Components to Modify

**1. `src/app/page.tsx`**
- Delete `TAG_LIMIT` constant (line 15)
- Remove `if (group.videos.length < TAG_LIMIT)` checks in `groupByTag()`
- Wrap `<VideoGrid>` in scrollable container:

```tsx
<AccordionContent className="pb-4 pt-2">
  <div className="max-h-96 overflow-y-auto pr-2">
    <VideoGrid videos={...} />
  </div>
</AccordionContent>
```

**2. Scrollable Container**
- `max-h-96` = 24rem / 384px height (~6-8 list items visible)
- `overflow-y-auto` = vertical scrollbar when content overflows
- `pr-2` = padding to prevent scrollbar overlap

**3. Default View Mode Inside Accordion**
- Accordion content works better with list view (compact)
- Existing `ViewModeContext` remains so user can toggle to grid

### User Experience

1. User opens accordion → sees videos in **list layout** by default
2. ~6-8 list items visible before scrolling
3. Scroll to see ALL videos in that tag group
4. Toggle to grid view via existing view mode button (optional)
5. No "View All" navigation needed → all videos accessible in-place

### Data Flow

```
DashboardPage
  → groupByTag(videos) [NO LIMIT]
  → Accordion (per tag)
    → Scrollable Container (max-h-96)
      → VideoGrid (list default)
        → VideoListItem (compact)
```

### Files Modified

| File | Change |
|------|--------|
| `src/app/page.tsx` | Remove TAG_LIMIT, add scrollable wrapper |
| `src/components/video/video-grid.tsx` | No changes (works as-is) |
| `src/components/video/video-list-item.tsx` | No changes (works as-is) |

### Success Criteria

- [ ] All videos visible per tag (no artificial limit)
- [ ] Scrollable container works (max 384px height)
- [ ] List view default inside accordion
- [ ] View mode toggle still functional
- [ ] No navigation away from dashboard required
- [ ] TypeScript compiles without errors
- [ ] Biome lint passes
