import {buildError, type SleepAbortError} from './SleepAbortError.js';
import {Err, Ok, type Result} from '@luolapeikko/result-option';
import {type SleepOptions, type SleepThrowsOptions} from './options.js';
import {sleep} from './sleep.js';

/**
 * sleep for a number of milliseconds and optional abort signaling to break sleep early
 * @example
 * const res = await sleepResult(1000); // plain sleep
 * if (res.isErr) { // if need to handle fatal type errors
 * const controller = new AbortController();
 * const res = await sleepResult(1000, {signal: controller.signal}); // sleep with abort signal
 * if (res.isErr) { // if need to handle abort or fatal type errors
 * @see [Result](https://luolapeikko.github.io/result-option/types/Result.html#Example)
 * @param ms milliseconds to sleep
 * @param {SleepOptions} options options object
 * @returns {Promise<void>} - resolves after sleep or abort
 * @throws {SleepAbortError} if options.abortThrows is true and the signal is aborted
 */
export async function sleepResult(ms: number, options: SleepThrowsOptions): Promise<Result<void, SleepAbortError | TypeError>>;
export async function sleepResult(ms: number, options?: SleepOptions): Promise<Result<void, TypeError>>;
export async function sleepResult(ms: number, options?: SleepOptions): Promise<Result<void, TypeError> | Result<void, SleepAbortError | TypeError>> {
	try {
		return Ok(await sleep(ms, options));
	} catch (e) {
		return Err(buildError(e));
	}
}
