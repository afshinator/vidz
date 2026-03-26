export class YouTubeQuotaError extends Error {
  constructor(
    message: string,
    public unitsUsed: number,
    public unitsRemaining: number
  ) {
    super(message);
    this.name = 'YouTubeQuotaError';
  }
}

export class SyncConflictError extends Error {
  constructor(message: string, public channelId: string) {
    super(message);
    this.name = 'SyncConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}