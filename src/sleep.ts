import {SleepAbortError} from './SleepAbortError.js';
import {type SleepOptions} from './options.js';

function handleAbort(abortThrows?: boolean, reason?: unknown): Promise<void> {
	if (abortThrows) {
		return Promise.reject(new SleepAbortError('Aborted', reason));
	}
	return Promise.resolve();
}

function clearEventListener(signal: AbortSignal | undefined, onAbortCallback?: () => void): void {
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
					reject(new SleepAbortError('Aborted', options.signal?.reason));
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

/**
 * sleep for a number of milliseconds and optional abort signaling to break sleep early
 * @example
 * await sleep(1000); // plain sleep
 * const controller = new AbortController();
 * await sleep(1000, {signal: controller.signal}); // sleep with abort signal
 * @param ms milliseconds to sleep
 * @param {SleepOptions} options options object
 * @returns {Promise<void>} - resolves after sleep or abort
 * @throws {SleepAbortError} if options.abortThrows is true and the signal is aborted
 */
export function sleep(ms: number, options?: SleepOptions): Promise<void> {
	if (typeof ms !== 'number') {
		throw new TypeError('Expected sleep ms to be a number');
	}
	// verify options is an object or undefined
	if (options !== undefined && typeof options !== 'object') {
		throw new TypeError('Expected options to be an object or undefined');
	}
	// break out early if signal is already aborted
	if (options?.signal?.aborted) {
		return handleAbort(options.abortThrows, options.signal.reason);
	}
	return handleSleep(ms, options);
}
