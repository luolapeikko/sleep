# sleep promise with abort support

## should work on both browser and node with node-abort-controller module

```typescript
await sleep(1000); // plain sleep
const controller = new AbortController();
await sleep(1000, {signal: controller.signal}); // sleep with abort signal
await sleep(1000, {signal: controller.signal, abortThrows: true}); // sleep with abort signal and throws AbortError when aborted
```
if adding abortThrows option true, it will throw ```SleepAbortError``` instance when aborted
