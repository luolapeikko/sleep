export class SleepAbortError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = 'SleepAbortError';
		Error.captureStackTrace(this, this.constructor);
	}
}

function handleAbort(abortThrows?: boolean): Promise<void> {
	if (abortThrows) {
		return Promise.reject(new SleepAbortError('Aborted'));
	}
	return Promise.resolve();
}

/**
 * sleep for a number of milliseconds and optional abort signaling to break sleep early
 * @example
 * await sleep(1000); // plain sleep
 * const controller = new AbortController();
 * await sleep(1000, {signal: controller.signal}); // sleep with abort signal
 * @param ms milliseconds to sleep
 * @param {AbortSignal} options.signal optional AbortSignal to abort sleep
 * @param {boolean} options.abortThrows if true, throw an error when aborted (default just resolves)
 * @returns {Promise<void>} sleep Promise
 * @throws {SleepAbortError} if options.abortThrows is true and the signal is aborted
 */
export function sleep(ms: number, options?: {signal?: AbortSignal; abortThrows?: boolean}): Promise<void> {
	// break out early if signal is already aborted
	if (options?.signal?.aborted) {
		return handleAbort(options.abortThrows);
	}
	return handleSleep(ms, options);
}

export function clearEventListener(signal: AbortSignal | undefined, onAbortCallback?: () => void): void {
	if (signal && onAbortCallback) {
		signal.removeEventListener('abort', onAbortCallback);
	}
}

function handleSleep(ms: number, options?: {signal?: AbortSignal; abortThrows?: boolean}): Promise<void> {
	return new Promise((resolve, reject) => {
		let timeoutRef: ReturnType<typeof setTimeout> | undefined;
		let isCallbackAborted = false;
		let onAbortCallback: (() => void) | undefined;
		if (options?.signal) {
			onAbortCallback = () => {
				if (timeoutRef) {
					clearTimeout(timeoutRef);
					timeoutRef = undefined;
				}
				if (options.abortThrows) {
					reject(new SleepAbortError('Aborted'));
				} else {
					resolve();
				}
				// remove the abort listener
				clearEventListener(options.signal, onAbortCallback);
				onAbortCallback = undefined;
				isCallbackAborted = true;
			};
			// build abort function to be called on signal abort
			options.signal.addEventListener('abort', onAbortCallback);
		}
		timeoutRef = setTimeout(() => {
			timeoutRef = undefined;
			clearEventListener(options?.signal, onAbortCallback);
			if (isCallbackAborted) {
				// we already handled the abort, so just return from timeout
				return;
			}
			resolve();
		}, ms);
	});
}
