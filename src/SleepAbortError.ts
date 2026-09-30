/**
 * Error thrown when a sleep is aborted.
 * @since v0.1.3
 */
export class SleepAbortError extends Error {
	public constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'SleepAbortError';
		Error.captureStackTrace(this, this.constructor);
	}
}
