import {DeferredPromise} from '@open-draft/deferred-promise';
import type {CoreResult} from 'core-result';
import {SleepAbortError} from './SleepAbortError';

export * from './SleepAbortError';

function handleAbort<E extends Error>(
	sleepPromise: DeferredPromise<CoreResult<void, E | SleepAbortError>>,
	options: SleepOptions<E>,
): DeferredPromise<CoreResult<void, E | SleepAbortError>> {
	if (options.signal && options.abortThrows) {
		const abortError = new SleepAbortError('Aborted', {cause: options.signal.reason});
		sleepPromise.resolve({success: false, error: typeof options.abortThrows === 'function' ? options.abortThrows(abortError) : abortError});
	} else {
		sleepPromise.resolve({success: true, value: undefined});
	}
	return sleepPromise;
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
export async function sleep(ms: number, options: SleepOptions<Error> = {}): Promise<void> {
	const res = await sleepResult(ms, options);
	if (!res.success) {
		throw res.error;
	}
}

/**
 * Options for sleep function
 * @since v0.1.3
 */
export type SleepOptions<E extends Error> = {
	/** optional AbortSignal to abort sleep */
	signal?: AbortSignal;
	/** if true, throw an error when aborted (default just resolves) */
	abortThrows?: boolean | ((err: SleepAbortError) => E);
};

/**
 * sleep for a number of milliseconds and optional abort signaling to break sleep early
 * @example
 * const res = await sleepResult(1000); // plain sleep
 * if (!res.success) {} // res.error = SleepAbortError | TypeError
 * const controller = new AbortController();
 * const res = await sleepResult(1000, {signal: controller.signal}); // sleep with abort signal
 * if (!res.success) {} // res.error = SleepAbortError | TypeError
 * @see [CoreResult](https://github.com/luolapeikko/core-result)
 * @param ms milliseconds to sleep
 * @param {SleepOptions} options options object
 * @returns {Promise<void>} - resolves after sleep or abort
 * @throws {SleepAbortError} if options.abortThrows is true and the signal is aborted
 * @since v0.1.3
 */
export function sleepResult<E extends Error = SleepAbortError>(ms: number, options: SleepOptions<E> = {}): Promise<CoreResult<void, E>> {
	const sleepPromise = new DeferredPromise<CoreResult<void, E | SleepAbortError>>();
	if (options.signal?.aborted) {
		return handleAbort(sleepPromise, options);
	}
	const abortListener = () => void handleAbort(sleepPromise, options);
	const timeoutId = setTimeout(() => sleepPromise.resolve({success: true, value: undefined}), ms);
	sleepPromise.finally(() => {
		// do cleanup
		options.signal?.removeEventListener('abort', abortListener);
		clearTimeout(timeoutId);
	});
	options.signal?.addEventListener('abort', abortListener, {once: true});
	return sleepPromise;
}
