import {type SleepOptions} from './options';
import {SleepAbortError} from './SleepAbortError';

/**
 * Removes the abort event listener from the AbortSignal.
 * @param signal - AbortSignal to remove the event listener from.
 * @param onAbortCallback - Callback to remove from the AbortSignal.
 */
function clearEventListener(signal: AbortSignal | undefined, onAbortCallback?: () => void): void {
	if (signal && onAbortCallback) {
		signal.removeEventListener('abort', onAbortCallback);
	}
}

function handleSleep(ms: number, options?: {signal?: AbortSignal; abortThrows?: boolean}): Promise<void> {
	return new Promise((resolve, reject) => {
		let timeoutRef: ReturnType<typeof setTimeout> | undefined;
		let onAbortCallback: (() => void) | undefined;
		if (options?.signal) {
			// build abort function to be called on signal abort to settle Promise and clear timeout/event listener
			onAbortCallback = () => {
				// clear timeout callback if it exists.
				if (timeoutRef) {
					clearTimeout(timeoutRef);
					timeoutRef = undefined;
				}
				// remove the abort listener and onAbortCallback reference
				clearEventListener(options.signal, onAbortCallback);
				onAbortCallback = undefined;
				// we are done, handle Promise
				if (options.abortThrows) {
					reject(new SleepAbortError('Aborted', {cause: options.signal?.reason}));
				} else {
					resolve();
				}
			};
			// build abort function to be called on signal abort
			options.signal.addEventListener('abort', onAbortCallback);
		}
		timeoutRef = setTimeout(() => {
			timeoutRef = undefined;
			clearEventListener(options?.signal, onAbortCallback);
			// if not aborted, resolve Promise
			if (!options?.signal?.aborted) {
				resolve();
			}
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
 * @since v0.0.1
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
		return options.abortThrows ? Promise.reject(new SleepAbortError('Aborted', {cause: options.signal.reason})) : Promise.resolve();
	}
	return handleSleep(ms, options);
}
