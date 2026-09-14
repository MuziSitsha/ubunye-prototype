// Human-readable error handling (spec §50). Services throw AppError with a message
// that's already safe to show a user; route handlers catch anything else and fall
// back to a generic message rather than leaking a stack trace or a raw DB error.

export class AppError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "AppError";
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  return "We couldn't complete that step. Please try again.";
}
