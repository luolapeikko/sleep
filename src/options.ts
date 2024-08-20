/**
 * Options for sleep function
 * @typedef {object} SleepOptions
 * @property {AbortSignal} [signal] - optional AbortSignal to abort sleep
 * @property {boolean} [abortThrows] - if true, throw an error when aborted (default just resolves)
 */
export type SleepOptions = {
	/** optional AbortSignal to abort sleep */
	signal?: AbortSignal;
	/** if true, throw an error when aborted (default just resolves) */
	abortThrows?: boolean;
};

export type SleepThrowsOptions = {
	/** optional AbortSignal to abort sleep */
	signal: AbortSignal;
	/** if true, throw an error when aborted (default just resolves) */
	abortThrows: true;
};
