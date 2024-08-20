export class SleepAbortError extends Error {
	public readonly reason?: unknown;
	constructor(message: string, reason?: unknown) {
		super(message);
		this.reason = reason;
		this.name = 'SleepAbortError';
		Error.captureStackTrace(this, this.constructor);
	}
}

export function buildError(e: unknown): SleepAbortError | TypeError {
	if (e instanceof TypeError || e instanceof SleepAbortError) {
		return e;
	}
	return new TypeError(`Expected ${JSON.stringify(e)} to be SleepAbortError`);
}
