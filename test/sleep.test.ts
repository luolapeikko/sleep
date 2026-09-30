import type {CoreResult} from 'core-result';
import {describe, expect, it} from 'vitest';
import {SleepAbortError, sleep, sleepResult} from '../src/index';

describe('sleep-utils', () => {
	describe('sleep', () => {
		describe('sleep abort without throw', () => {
			it('should sleep', {timeout: 190}, async function () {
				const start = Date.now();
				await sleep(100);
				const time = Date.now() - start;
				expect(time).to.be.greaterThanOrEqual(99);
			});
			it('should abort sleep early', {timeout: 50}, async function () {
				const controller = new AbortController();
				controller.abort();
				const start = Date.now();
				await sleep(100, {signal: controller.signal});
				const time = Date.now() - start;
				expect(time).to.be.lessThanOrEqual(50);
			});
			it('should abort middle of sleep', {timeout: 190}, async function () {
				const controller = new AbortController();
				const start = Date.now();
				setTimeout(() => controller.abort(), 100);
				await sleep(200, {signal: controller.signal});
				const time = Date.now() - start;
				expect(time).to.be.greaterThanOrEqual(99).and.lessThan(150);
			});
			it('should not abort', {timeout: 190}, async function () {
				const controller = new AbortController();
				const start = Date.now();
				await sleep(100, {signal: controller.signal});
				const time = Date.now() - start;
				expect(time).to.be.greaterThanOrEqual(99).and.lessThan(150);
			});
		});
		describe('sleep abort with throw', () => {
			it('should abort sleep early', {timeout: 50}, async function () {
				const controller = new AbortController();
				controller.abort();
				const start = Date.now();
				const outputError = await sleep(100, {signal: controller.signal, abortThrows: true}).catch((e: Error) => e);
				expect(outputError).toBeInstanceOf(SleepAbortError);
				expect(outputError?.message).toEqual('Aborted');
				const causeError = outputError?.cause as Error | undefined;
				expect(causeError?.message).toEqual('This operation was aborted');
				const time = Date.now() - start;
				expect(time).to.be.lessThan(50);
			});
			it('should abort middle of sleep', {timeout: 190}, async function () {
				const expectedError = new SleepAbortError('Aborted', {cause: new Error('This operation was aborted')});
				const controller = new AbortController();
				const start = Date.now();
				setTimeout(() => controller.abort(new Error('This operation was aborted')), 100);
				await expect(sleep(200, {signal: controller.signal, abortThrows: true})).rejects.toEqual(expectedError);
				const time = Date.now() - start;
				expect(time).to.be.greaterThanOrEqual(99).and.lessThan(150);
			});
		});
		describe('multiple sleeps on same signal', () => {
			it('should abort both sleep promises', {timeout: 500}, async function () {
				const abortController = new AbortController();
				const value1Promise = sleep(1000, {signal: abortController.signal});
				const value2Promise = sleep(1000, {signal: abortController.signal});
				setTimeout(() => abortController.abort(), 100);
				await expect(value1Promise).resolves.toEqual(undefined);
				await expect(value2Promise).resolves.toEqual(undefined);
			});
		});
	});

	describe('sleepResult', () => {
		describe('sleep abort without throw', () => {
			it('should sleep', {timeout: 190}, async function () {
				const start = Date.now();
				const res: CoreResult<void, TypeError> = await sleepResult(100);
				const time = Date.now() - start;
				expect(time).to.be.greaterThanOrEqual(100);
				expect(res.success).to.be.eq(true);
				expect(res.value).to.be.eq(undefined);
			});
			it('should abort sleep early', {timeout: 10}, async function () {
				const controller = new AbortController();
				controller.abort();
				const start = Date.now();
				const res: CoreResult<void, TypeError> = await sleepResult(100, {signal: controller.signal});
				const time = Date.now() - start;
				expect(time).to.be.lessThanOrEqual(10);
				expect(res.success).to.be.eq(true);
				expect(res.value).to.be.eq(undefined);
			});
			it('should abort middle of sleep', {timeout: 190}, async function () {
				const controller = new AbortController();
				const start = Date.now();
				setTimeout(() => controller.abort(), 100);
				const res: CoreResult<void, TypeError> = await sleepResult(200, {signal: controller.signal});
				const time = Date.now() - start;
				expect(time).to.be.greaterThanOrEqual(99).and.lessThan(150);
				expect(res.success).to.be.eq(true);
				expect(res.value).to.be.eq(undefined);
			});
		});
		describe('sleep abort with throw', () => {
			it('should abort sleep early', {timeout: 10}, async function () {
				const controller = new AbortController();
				controller.abort();
				const start = Date.now();
				const res: CoreResult<void, TypeError | SleepAbortError> = await sleepResult(100, {signal: controller.signal, abortThrows: true});
				expect(res.error).to.be.eql(new SleepAbortError('Aborted'));
				const time = Date.now() - start;
				expect(time).to.be.lessThanOrEqual(10);
				expect(res.success).to.be.eq(false);
				expect(res.error).to.be.instanceOf(SleepAbortError);
			});
			it('should abort middle of sleep', {timeout: 190}, async function () {
				const controller = new AbortController();
				const start = Date.now();
				setTimeout(() => controller.abort(new Error('with a reason')), 100);
				const res: CoreResult<void, TypeError | SleepAbortError> = await sleepResult(200, {signal: controller.signal, abortThrows: true});
				expect(res.error).to.be.eql(new SleepAbortError('Aborted'));
				const time = Date.now() - start;
				expect(time).to.be.greaterThanOrEqual(99).and.lessThan(150);
				expect(res.success).to.be.eq(false);
				const err = res.error;
				expect(err).to.be.instanceOf(SleepAbortError);
				if (!err || !(err instanceof SleepAbortError)) {
					throw new Error('err is not instance of SleepAbortError');
				}
			});
			it('should pickup error type from abortThrows callback', {timeout: 190}, async function () {
				const controller = new AbortController();
				controller.abort();
				const res: CoreResult<void, TypeError> = await sleepResult(200, {signal: controller.signal, abortThrows: () => new TypeError('Aborted')});
				expect(res.error).to.be.eql(new TypeError('Aborted'));
			});
		});
		describe('multiple sleeps on same signal', () => {
			it('should abort both sleep promises', {timeout: 500}, async function () {
				const abortController = new AbortController();
				const value1ResPromise: Promise<CoreResult<void, TypeError | SleepAbortError>> = sleepResult(1000, {signal: abortController.signal, abortThrows: true});
				const value2ResPromise: Promise<CoreResult<void, TypeError | SleepAbortError>> = sleepResult(1000, {signal: abortController.signal, abortThrows: true});
				setTimeout(() => abortController.abort(), 100);
				const value1Res = await value1ResPromise;
				const value2Res = await value2ResPromise;
				expect(value1Res.success).to.be.eq(false);
				expect(value2Res.success).to.be.eq(false);
			});
		});
	});
});
