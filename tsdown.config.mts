import {defineConfig} from 'tsdown';

export default defineConfig({
	entry: 'src/index.ts',
	deps: {
		onlyBundle: ['core-result', '@open-draft/deferred-promise'],
	},
});
