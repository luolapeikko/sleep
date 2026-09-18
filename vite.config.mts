/// <reference types="vitest" />

import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		reporters: ['github-actions', 'minimal'],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			reporter: ['text', 'lcovonly'],
		},
		setupFiles: ['dotenv/config', './test/instrumentation.mts'],
		include: ['./**/*.test.ts'],
		exclude: ['dist', 'node_modules'],
		pool: 'threads',
	},
});
