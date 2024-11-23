/**
 * Error thrown when a sleep is aborted.
 * @since v0.1.3
 */
export class SleepAbortError extends Error {
	public readonly reason?: unknown;
	constructor(message: string, reason?: unknown) {
		super(message);
		this.reason = reason;
		this.name = 'SleepAbortError';
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Build an error from an unknown thrown value
 * @param e unknown value to build an error from
 * @returns SleepAbortError or TypeError
 * @since v0.1.3
 */
export function buildError(e: unknown): SleepAbortError | TypeError {
	if (e instanceof TypeError || e instanceof SleepAbortError) {
		return e;
	}
	return new TypeError(`Expected ${JSON.stringify(e)} to be SleepAbortError`);
}
