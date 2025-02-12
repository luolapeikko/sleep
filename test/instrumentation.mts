import {getNodeAutoInstrumentations} from '@opentelemetry/auto-instrumentations-node';
import {OTLPLogExporter} from '@opentelemetry/exporter-logs-otlp-grpc';
import {OTLPMetricExporter} from '@opentelemetry/exporter-metrics-otlp-grpc';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-grpc';
import {Resource} from '@opentelemetry/resources';
import {SimpleLogRecordProcessor} from '@opentelemetry/sdk-logs';
import {PeriodicExportingMetricReader} from '@opentelemetry/sdk-metrics';
import {NodeSDK} from '@opentelemetry/sdk-node';
import {ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION} from '@opentelemetry/semantic-conventions';
import * as dotenv from 'dotenv';
import {afterAll, beforeAll} from 'vitest';

dotenv.config();

let sdk: NodeSDK | undefined;

/**
 * Setup opentelemetry instrumentation with grpc exporter (i.e. Aspire Dashboard)
 */

beforeAll(() => {
	if (process.env.ENABLE_INSTRUMENTATION === 'true') {
		sdk = new NodeSDK({
			instrumentations: [getNodeAutoInstrumentations()],
			logRecordProcessors: [new SimpleLogRecordProcessor(new OTLPLogExporter())],
			metricReader: new PeriodicExportingMetricReader({
				exporter: new OTLPMetricExporter(),
				exportIntervalMillis: 1000,
			}),
			resource: new Resource({
				[ATTR_SERVICE_NAME]: 'sleep-unit-test',
				[ATTR_SERVICE_VERSION]: '0.0.1',
			}),
			traceExporter: new OTLPTraceExporter(),
		});
		sdk.start();
		console.log('sdk started');
	}
});

afterAll(async () => {
	if (process.env.ENABLE_INSTRUMENTATION === 'true') {
		await new Promise((resolve) => setTimeout(resolve, 2000));
		await sdk?.shutdown();
	}
});
