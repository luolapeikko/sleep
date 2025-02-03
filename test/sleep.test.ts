import {type IResult} from '@luolapeikko/result-option';
import {describe, expect, it} from 'vitest';
import {buildError, sleep, SleepAbortError, type SleepOptions, sleepResult} from '../src/index';

describe('sleep-utils', () => {
	describe('sleep', () => {
		describe('sleep abort without throw', () => {
			it('should sleep', {timeout: 190}, async function () {
				const start = new Date().getTime();
				await sleep(100);
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(99);
			});
			it('should abort sleep early', {timeout: 10}, async function () {
				const controller = new AbortController();
				controller.abort();
				const start = new Date().getTime();
				await sleep(100, {signal: controller.signal});
				const time = new Date().getTime() - start;
				expect(time).to.be.lessThanOrEqual(10);
			});
			it('should abort middle of sleep', {timeout: 190}, async function () {
				const controller = new AbortController();
				const start = new Date().getTime();
				setTimeout(() => controller.abort(), 100);
				await sleep(200, {signal: controller.signal});
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(99).and.lessThan(150);
			});
			it('should not abort', {timeout: 190}, async function () {
				const controller = new AbortController();
				const start = new Date().getTime();
				await sleep(100, {signal: controller.signal});
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(99).and.lessThan(150);
			});
		});
		describe('sleep abort with throw', () => {
			it('should abort sleep early', {timeout: 10}, async function () {
				const controller = new AbortController();
				controller.abort();
				const start = new Date().getTime();
				const outputError = await sleep(100, {signal: controller.signal, abortThrows: true}).catch((e: Error) => e);
				expect(outputError).toBeInstanceOf(SleepAbortError);
				expect(outputError?.message).toEqual('Aborted');
				const causeError = outputError?.cause as Error | undefined;
				expect(causeError?.message).toEqual('This operation was aborted');
				const time = new Date().getTime() - start;
				expect(time).to.be.lessThanOrEqual(10);
			});
			it('should abort middle of sleep', {timeout: 190}, async function () {
				const expectedError = new SleepAbortError('Aborted', {cause: 'This operation was aborted'});
				const controller = new AbortController();
				const start = new Date().getTime();
				setTimeout(() => controller.abort('This operation was aborted'), 100);
				await expect(sleep(200, {signal: controller.signal, abortThrows: true})).rejects.toEqual(expectedError);
				const time = new Date().getTime() - start;
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
		describe('error handling', function () {
			it('should throw TypeError if ms is not a number', function () {
				expect(() => sleep('not a number' as unknown as number)).toThrow(TypeError);
			});
			it('should throw TypeError if options is not an object', function () {
				expect(() => sleep(100, 'not an object' as unknown as SleepOptions)).toThrow(TypeError);
			});
		});
	});

	describe('sleepResult', () => {
		describe('sleep abort without throw', () => {
			it('should sleep', {timeout: 190}, async function () {
				const start = new Date().getTime();
				const res: IResult<void, TypeError> = await sleepResult(100);
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(100);
				expect(res.isOk).to.be.eq(true);
				expect(res.ok()).to.be.eq(undefined);
			});
			it('should abort sleep early', {timeout: 10}, async function () {
				const controller = new AbortController();
				controller.abort();
				const start = new Date().getTime();
				const res: IResult<void, TypeError> = await sleepResult(100, {signal: controller.signal});
				const time = new Date().getTime() - start;
				expect(time).to.be.lessThanOrEqual(10);
				expect(res.isOk).to.be.eq(true);
				expect(res.ok()).to.be.eq(undefined);
			});
			it('should abort middle of sleep', {timeout: 190}, async function () {
				const controller = new AbortController();
				const start = new Date().getTime();
				setTimeout(() => controller.abort(), 100);
				const res: IResult<void, TypeError> = await sleepResult(200, {signal: controller.signal});
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(99).and.lessThan(150);
				expect(res.isOk).to.be.eq(true);
				expect(res.ok()).to.be.eq(undefined);
			});
		});
		describe('sleep abort with throw', () => {
			it('should abort sleep early', {timeout: 10}, async function () {
				const controller = new AbortController();
				controller.abort();
				const start = new Date().getTime();
				const res: IResult<void, TypeError | SleepAbortError> = await sleepResult(100, {signal: controller.signal, abortThrows: true});
				expect(() => res.unwrap()).to.throw(SleepAbortError, 'Aborted');
				const time = new Date().getTime() - start;
				expect(time).to.be.lessThanOrEqual(10);
				expect(res.isErr).to.be.eq(true);
				expect(res.err()).to.be.instanceOf(SleepAbortError);
			});
			it('should abort middle of sleep', {timeout: 190}, async function () {
				const controller = new AbortController();
				const start = new Date().getTime();
				setTimeout(() => controller.abort('with a reason'), 100);
				const res: IResult<void, TypeError | SleepAbortError> = await sleepResult(200, {signal: controller.signal, abortThrows: true});
				expect(() => res.unwrap()).to.throw(SleepAbortError, 'Aborted');
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(99).and.lessThan(150);
				expect(res.isErr).to.be.eq(true);
				const err = res.err();
				expect(err).to.be.instanceOf(SleepAbortError);
				if (!err || !(err instanceof SleepAbortError)) {
					throw new Error('err is not instance of SleepAbortError');
				}
			});
		});
		describe('multiple sleeps on same signal', () => {
			it('should abort both sleep promises', {timeout: 500}, async function () {
				const abortController = new AbortController();
				const value1ResPromise: Promise<IResult<void, TypeError | SleepAbortError>> = sleepResult(1000, {signal: abortController.signal, abortThrows: true});
				const value2ResPromise: Promise<IResult<void, TypeError | SleepAbortError>> = sleepResult(1000, {signal: abortController.signal, abortThrows: true});
				setTimeout(() => abortController.abort(), 100);
				const value1Res = await value1ResPromise;
				const value2Res = await value2ResPromise;
				expect(value1Res.isErr).to.be.eq(true);
				expect(value2Res.isErr).to.be.eq(true);
			});
		});
	});
	describe('buildError', function () {
		it('should throw TypeError if message is not a string', function () {
			expect(() => {
				throw buildError(1);
			}).toThrow(TypeError);
		});
	});
});
