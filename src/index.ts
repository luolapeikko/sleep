import {AbortSignal as NodeAbortSignal} from 'node-abort-controller';

export class SleepAbortError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = 'SleepAbortError';
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * sleep for a number of milliseconds and optional abort signaling to break sleep early
 * @example
 * await sleep(1000); // plain sleep
 * const controller = new AbortController();
 * await sleep(1000, {signal: controller.signal}); // sleep with abort signal
 * @param ms milliseconds to sleep
 * @param {AbortSignal} options.signal optional AbortSignal to abort sleep
 * @param {boolean} options.abortThrows if true, throw an error when aborted
 * @returns {Promise<void>} sleep Promise
 * @throws {SleepAbortError} if options.abortThrows is true and the signal is aborted
 */
export function sleep(ms: number, options?: {signal?: AbortSignal | NodeAbortSignal; abortThrows?: boolean}): Promise<void> {
	// break out early if signal is already aborted
	if (options?.signal?.aborted) {
		if (options.abortThrows) {
			return Promise.reject(new SleepAbortError('Aborted'));
		}
		return Promise.resolve();
	}
	return new Promise((resolve, reject) => {
		let timeoutRef: ReturnType<typeof setTimeout> | undefined;
		if (options?.signal) {
			// build abort function to be called on signal abort
			options.signal.onabort = () => {
				if (timeoutRef) {
					clearTimeout(timeoutRef);
					timeoutRef = undefined;
				}
				if (options?.abortThrows) {
					reject(new SleepAbortError('Aborted'));
				} else {
					resolve();
				}
			};
		}
		timeoutRef = setTimeout(() => {
			timeoutRef = undefined;
			if (options?.signal?.aborted) {
				// we use abort "onabort" callback to reject the promise
				return;
			}
			resolve();
		}, ms);
	});
}
