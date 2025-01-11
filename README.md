# Sleep promise with Abort support

## should work on both browser and node with node-abort-controller module

### install

```
npm i @luolapeikko/sleep
```

### examples

```typescript
await sleep(1000); // plain sleep
const controller = new AbortController();
await sleep(1000, {signal: controller.signal}); // sleep with abort signal
await sleep(1000, {signal: controller.signal, abortThrows: true}); // sleep with abort signal and throws SleepAbortError when aborted
```

if adding abortThrows option true, it will throw `SleepAbortError` instance when aborted

### exampes as sleep Result

```typescript
const res = await sleepResult(1000); // plain sleep
const controller = new AbortController();
const res = await sleepResult(1000, {signal: controller.signal}); // sleep with abort signal
if (res.isErr) {/* something was wrong on arguments */}

const res = await sleepResult(1000, {signal: controller.signal, abortThrows: true}); // sleep with abort signal and throws SleepAbortError when aborted
if (res.isErr) {/* something was wrong on arguments or have aborted with SleepAbortError */}
```
