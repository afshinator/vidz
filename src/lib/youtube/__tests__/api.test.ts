import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YouTubeQuotaError } from '@/lib/error';

// The functions we'll test — they'll exist after extraction
// buildYouTubeUrl — pure URL building
// validateYouTubeResponse — response validation
// fetchYouTube — retry loop (mocked fetch)

describe('buildYouTubeUrl', () => {
  it('builds a URL from endpoint and params', async () => {
    const { buildYouTubeUrl } = await import('@/lib/youtube/api');
    const url = buildYouTubeUrl('/subscriptions', { mine: 'true', part: 'snippet' });
    expect(url).toBe('https://www.googleapis.com/youtube/v3/subscriptions?mine=true&part=snippet');
  });

  it('handles empty params', async () => {
    const { buildYouTubeUrl } = await import('@/lib/youtube/api');
    const url = buildYouTubeUrl('/channels', {});
    expect(url).toBe('https://www.googleapis.com/youtube/v3/channels');
  });
});

describe('validateYouTubeResponse', () => {
  it('returns parsed JSON for successful response', async () => {
    const { validateYouTubeResponse } = await import('@/lib/youtube/api');
    const response = new Response(JSON.stringify({ items: [] }), { status: 200 });
    const result = await validateYouTubeResponse(response);
    expect(result).toEqual({ items: [] });
  });

  it('throws YouTubeQuotaError on 403 quotaExceeded', async () => {
    const { validateYouTubeResponse } = await import('@/lib/youtube/api');
    const response = new Response(
      JSON.stringify({ error: { errors: [{ reason: 'quotaExceeded' }] } }),
      { status: 403 }
    );
    await expect(validateYouTubeResponse(response)).rejects.toThrow(YouTubeQuotaError);
  });

  it('throws YouTubeQuotaError on 403 dailyLimitExceeded', async () => {
    const { validateYouTubeResponse } = await import('@/lib/youtube/api');
    const response = new Response(
      JSON.stringify({ error: { errors: [{ reason: 'dailyLimitExceeded' }] } }),
      { status: 403 }
    );
    await expect(validateYouTubeResponse(response)).rejects.toThrow(YouTubeQuotaError);
  });

  it('throws on 401 with error message', async () => {
    const { validateYouTubeResponse } = await import('@/lib/youtube/api');
    const response = new Response(
      JSON.stringify({ error: { message: 'Invalid credentials' } }),
      { status: 401 }
    );
    await expect(validateYouTubeResponse(response)).rejects.toThrow('Invalid credentials');
  });

  it('throws generic error on 500', async () => {
    const { validateYouTubeResponse } = await import('@/lib/youtube/api');
    const response = new Response(
      JSON.stringify({ error: { message: 'Internal server error' } }),
      { status: 500 }
    );
    await expect(validateYouTubeResponse(response)).rejects.toThrow('Internal server error');
  });
});

describe('fetchYouTube', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns data and quota on success', async () => {
    const { fetchYouTube } = await import('@/lib/youtube/api');
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: '123' }] }), { status: 200 })
    );

    const result = await fetchYouTube('/videos', 'token', { id: '123' });
    expect(result).toEqual({ data: { items: [{ id: '123' }] }, quotaUsed: 1 });
  });

  it('retries on 500 then succeeds', async () => {
    const { fetchYouTube } = await import('@/lib/youtube/api');
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Server error' } }), { status: 500 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [] }), { status: 200 })
      );

    const result = await fetchYouTube('/videos', 'token');
    expect(result.data).toEqual({ items: [] });
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2);
  });

  it('retries on network error (TypeError) then succeeds', async () => {
    const { fetchYouTube } = await import('@/lib/youtube/api');
    vi.mocked(global.fetch)
      .mockRejectedValueOnce(new TypeError('Network failure'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [] }), { status: 200 })
      );

    const result = await fetchYouTube('/videos', 'token');
    expect(result.data).toEqual({ items: [] });
  });

  it('throws immediately on 403 quotaExceeded without retry', async () => {
    const { fetchYouTube } = await import('@/lib/youtube/api');
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: { errors: [{ reason: 'quotaExceeded' }] } }),
        { status: 403 }
      )
    );

    await expect(fetchYouTube('/videos', 'token')).rejects.toThrow(YouTubeQuotaError);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting retries on 500', async () => {
    const { fetchYouTube } = await import('@/lib/youtube/api');
    vi.mocked(global.fetch).mockImplementation(() =>
      Promise.resolve(Response.json({ error: { message: 'Server error' } }, { status: 500 }))
    );

    await expect(fetchYouTube('/videos', 'token')).rejects.toThrow('Server error');
    expect(vi.mocked(global.fetch).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('sends bearer token in Authorization header', async () => {
    const { fetchYouTube } = await import('@/lib/youtube/api');
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), { status: 200 })
    );

    await fetchYouTube('/videos', 'test-token');
    expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      })
    );
  });
});
