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

