import {Err, type IResult, Ok} from '@luolapeikko/result-option';
import {type Span, SpanStatusCode, trace} from '@opentelemetry/api';
import {type SleepOptions} from './options';
import {buildError, SleepAbortError} from './SleepAbortError';

const tracer = trace.getTracer('@luolapeikko/sleep');

/**
 * Telemetry semantic attribute keys
 */
export const SLEEP_TIMEOUT = 'sleep.timeout';
export const SLEEP_TIMEOUT_CALLBACK = 'sleep.callback.timeout';
export const SLEEP_SIGNAL = 'sleep.signal';
export const SLEEP_ABORT = 'sleep.abort';
export const SLEEP_ABORT_SIGNAL_CALLBACK = 'sleep.callback.abort_signal_callback';
export const SLEEP_ABORT_THROWS = 'sleep.abort_throws';

export class Sleeper {
	private ms: number;
	private options: SleepOptions;

	/**
	 * @param ms - The number of milliseconds to sleep.
	 * @param options - The options to use for the sleep.
	 * @since v0.3.0
	 */
	public constructor(ms: number, options: SleepOptions = {}) {
		this.ms = ms;
		this.options = options;
	}

	/**
	 * setup sleep trigger and return a promise to resolve when sleep is complete.
	 */
	public sleeps(): Promise<void> {
		return tracer.startActiveSpan('sleep', async (span: Span) => {
			try {
				if (typeof this.ms !== 'number') {
					throw new TypeError('Expected sleep ms to be a number');
				}
				// verify options is an object or undefined
				if (typeof this.options !== 'object') {
					throw new TypeError('Expected options to be an object or undefined');
				}
				span.setAttribute(SLEEP_TIMEOUT, this.ms);
				span.setAttribute(SLEEP_SIGNAL, !!this.options.signal);
				span.setAttribute(SLEEP_ABORT_THROWS, !!this.options.abortThrows);
				// break out early if signal is already aborted
				if (this.options.signal?.aborted) {
					this.handleAbort(span).unwrap();
				} else {
					await this.handleSleep();
				}
				span.setStatus({code: SpanStatusCode.OK});
			} catch (err) {
				if (err instanceof Error) {
					span.recordException(err);
				}
				span.setStatus({code: SpanStatusCode.ERROR});
				throw err;
			} finally {
				span.end();
			}
		});
	}

	/**
	 * setup sleep trigger and return a promise to resolve when sleep is complete.
	 */
	public async sleepsResult(): Promise<IResult<void, SleepAbortError | TypeError>> {
		try {
			return Ok(await this.sleeps());
		} catch (err) {
			return Err(buildError(err));
		}
	}

	/**
	 * Main sleep Promise function to handle timeout and possible abort signal event
	 */
	private handleSleep() {
		return new Promise<void>((resolve, reject) => {
			return tracer.startActiveSpan(`sleep-promise:${this.ms.toString()}`, (mainPromiseSpan: Span): void => {
				const sleepEndController = new AbortController();
				if (this.options.signal) {
					const abortSpan = tracer.startSpan('sleep-abort-event');
					this.options.signal.addEventListener(
						'abort',
						() => {
							try {
								// we are done, handle abort
								this.handleAbort(mainPromiseSpan).unwrap();
								resolve();
							} catch (unknownErr) {
								const err = buildError(unknownErr);
								mainPromiseSpan.setStatus({code: SpanStatusCode.ERROR});
								mainPromiseSpan.recordException(err);
								reject(err);
							} finally {
								abortSpan.setStatus({code: SpanStatusCode.OK});
								abortSpan.end();
								mainPromiseSpan.end();
								sleepEndController.abort(); // cleanup
							}
						},
						{
							signal: sleepEndController.signal,
						},
					);
					mainPromiseSpan.addEvent(SLEEP_ABORT_SIGNAL_CALLBACK);
				}
				const timeoutRef = setTimeout(() => {
					const timeoutSpan = tracer.startSpan('sleep-timeout-event');
					timeoutSpan.setStatus({code: SpanStatusCode.OK});
					sleepEndController.abort();
					timeoutSpan.end();
					resolve();
				}, this.ms);
				// when we are done this cleanups the timeout if it exists (either from abort or timeout)
				sleepEndController.signal.addEventListener('abort', () => {
					clearTimeout(timeoutRef);
				});
				mainPromiseSpan.addEvent(SLEEP_TIMEOUT_CALLBACK);
			});
		});
	}

	/**
	 * Handles aborting of the sleep function.
	 * Adds an event to the span with name {@link SLEEP_ABORT} and optional attributes
	 * {@link https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/semantic_conventions/exceptions.md#exception-event-attributes | exception event attributes}
	 * if signal.reason is an {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error | Error}.
	 * If abortThrows is true, throws a {@link SleepAbortError} with the reason as the cause.
	 * @param span - Span to add the abort event to.
	 * @param signal - AbortSignal that fired the abort event.
	 * @param abortThrows - If true, throws an exception when aborted.
	 * @returns Ok(undefined) if no exception was thrown, Err(SleepAbortError) if an exception was thrown.
	 */
	private handleAbort(span: Span | undefined): IResult<undefined, SleepAbortError> {
		// if reason is an Error, collect error details
		if (this.options.signal?.reason && this.options.signal.reason instanceof Error) {
			span?.addEvent(SLEEP_ABORT, {
				'exception.type': this.options.signal.reason.name,
				'exception.message': this.options.signal.reason.message,
				'exception.stacktrace': this.options.signal.reason.stack,
			});
		} else {
			span?.addEvent(SLEEP_ABORT);
		}
		if (this.options.signal && this.options.abortThrows) {
			return Err(new SleepAbortError('Aborted', {cause: this.options.signal.reason}));
		}
		return Ok(undefined);
	}
}
