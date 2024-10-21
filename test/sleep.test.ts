/* eslint-disable sonarjs/no-duplicate-string */
import 'mocha';
import * as chai from 'chai';
import {sleep, SleepAbortError, sleepResult} from '../src/index.js';
import chaiAsPromised from 'chai-as-promised';
import {type IResult} from '@luolapeikko/result-option';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('sleep-utils', () => {
	describe('sleep', () => {
		describe('sleep abort without throw', () => {
			it('should sleep', async function () {
				this.slow(120);
				this.timeout(190);
				const start = new Date().getTime();
				await sleep(100);
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(100);
			});
			it('should abort sleep early', async function () {
				this.timeout(10);
				const controller = new AbortController();
				controller.abort();
				const start = new Date().getTime();
				await sleep(100, {signal: controller.signal});
				const time = new Date().getTime() - start;
				expect(time).to.be.lessThanOrEqual(10);
			});
			it('should abort middle of sleep', async function () {
				this.slow(120);
				this.timeout(190);
				const controller = new AbortController();
				const start = new Date().getTime();
				setTimeout(() => controller.abort(), 100);
				await sleep(200, {signal: controller.signal});
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(100).and.lessThan(150);
			});
		});
		describe('sleep abort with throw', () => {
			it('should abort sleep early', async function () {
				this.timeout(10);
				const controller = new AbortController();
				controller.abort();
				const start = new Date().getTime();
				await expect(sleep(100, {signal: controller.signal, abortThrows: true})).to.be.rejectedWith(SleepAbortError, 'Aborted');
				const time = new Date().getTime() - start;
				expect(time).to.be.lessThanOrEqual(10);
			});
			it('should abort middle of sleep', async function () {
				this.slow(120);
				this.timeout(190);
				const controller = new AbortController();
				const start = new Date().getTime();
				setTimeout(() => controller.abort(), 100);
				await expect(sleep(200, {signal: controller.signal, abortThrows: true})).to.be.rejectedWith(SleepAbortError, 'Aborted');
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(100).and.lessThan(150);
			});
		});
		describe('multiple sleeps on same signal', () => {
			it('should abort both sleep promises', async function () {
				this.timeout(500);
				this.slow(400);
				const abortController = new AbortController();
				const value1Promise = sleep(1000, {signal: abortController.signal});
				const value2Promise = sleep(1000, {signal: abortController.signal});
				setTimeout(() => abortController.abort(), 100);
				await expect(value1Promise).to.be.eventually.eq(undefined);
				await expect(value2Promise).to.be.eventually.eq(undefined);
			});
		});
	});
	describe('sleepResult', () => {
		describe('sleep abort without throw', () => {
			it('should sleep', async function () {
				this.slow(120);
				this.timeout(190);
				const start = new Date().getTime();
				const res: IResult<void, TypeError> = await sleepResult(100);
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(100);
				expect(res.isOk).to.be.eq(true);
				expect(res.ok()).to.be.eq(undefined);
			});
			it('should abort sleep early', async function () {
				this.timeout(10);
				const controller = new AbortController();
				controller.abort();
				const start = new Date().getTime();
				const res: IResult<void, TypeError> = await sleepResult(100, {signal: controller.signal});
				const time = new Date().getTime() - start;
				expect(time).to.be.lessThanOrEqual(10);
				expect(res.isOk).to.be.eq(true);
				expect(res.ok()).to.be.eq(undefined);
			});
			it('should abort middle of sleep', async function () {
				this.slow(120);
				this.timeout(190);
				const controller = new AbortController();
				const start = new Date().getTime();
				setTimeout(() => controller.abort(), 100);
				const res: IResult<void, TypeError> = await sleepResult(200, {signal: controller.signal});
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(100).and.lessThan(150);
				expect(res.isOk).to.be.eq(true);
				expect(res.ok()).to.be.eq(undefined);
			});
		});
		describe('sleep abort with throw', () => {
			it('should abort sleep early', async function () {
				this.timeout(10);
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
			it('should abort middle of sleep', async function () {
				this.slow(120);
				this.timeout(190);
				const controller = new AbortController();
				const start = new Date().getTime();
				setTimeout(() => controller.abort('with a reason'), 100);
				const res: IResult<void, TypeError | SleepAbortError> = await sleepResult(200, {signal: controller.signal, abortThrows: true});
				expect(() => res.unwrap()).to.throw(SleepAbortError, 'Aborted');
				const time = new Date().getTime() - start;
				expect(time).to.be.greaterThanOrEqual(100).and.lessThan(150);
				expect(res.isErr).to.be.eq(true);
				const err = res.err();
				expect(err).to.be.instanceOf(SleepAbortError);
				if (!err || !(err instanceof SleepAbortError)) {
					throw new Error('err is not instance of SleepAbortError');
				}
				expect(err.reason).to.be.eq('with a reason');
			});
		});
		describe('multiple sleeps on same signal', () => {
			it('should abort both sleep promises', async function () {
				this.timeout(500);
				this.slow(400);
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
});
