import {type IResult} from '@luolapeikko/result-option';
import {type SleepOptions, type SleepThrowsOptions} from './options';
import {type SleepAbortError} from './SleepAbortError';
import {Sleeper} from './Sleeper';
export * from './options';
export * from './SleepAbortError';

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
export function sleep(ms: number, options: SleepOptions = {}): Promise<void> {
	return new Sleeper(ms, options).sleeps();
}

/**
 * sleep for a number of milliseconds and optional abort signaling to break sleep early
 * @example
 * const res = await sleepResult(1000); // plain sleep
 * if (res.isErr) {} // if need to handle fatal type errors
 * const controller = new AbortController();
 * const res = await sleepResult(1000, {signal: controller.signal}); // sleep with abort signal
 * if (res.isErr) {} // if need to handle abort or fatal type errors
 * @see [Result](https://luolapeikko.github.io/result-option/types/Result.html#Example)
 * @param ms milliseconds to sleep
 * @param {SleepOptions} options options object
 * @returns {Promise<void>} - resolves after sleep or abort
 * @throws {SleepAbortError} if options.abortThrows is true and the signal is aborted
 * @since v0.1.3
 */
export async function sleepResult(ms: number, options: SleepThrowsOptions): Promise<IResult<void, SleepAbortError | TypeError>>;
export async function sleepResult(ms: number, options?: SleepOptions): Promise<IResult<void, TypeError>>;
export async function sleepResult(ms: number, options?: SleepOptions): Promise<IResult<void, SleepAbortError | TypeError>> {
	return new Sleeper(ms, options).sleepsResult();
}
