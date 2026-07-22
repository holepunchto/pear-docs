// scripts/bare-refgen/layouts/bare-prom-client.ts
// Editorial layout for bare-prom-client. This fork ships rich JSDoc in its
// `.d.ts`, so most descriptions, `@param`s, and `@returns` are already carried
// by the model — this manifest only fills the remaining gaps on the main
// Registry / metric classes (getters that document what they return in prose
// but carry no `@returns`, plus `Histogram.zero`'s undocumented `labels`
// param). The config-interface property long tail is left undocumented rather
// than fabricated. Keys are the model's qualified member keys.

import type { Layout } from '../layout';

const layout: Layout = {
  params: {
    'Histogram.zero': {
      labels: 'Object with label keys and values to initialize to zero.',
    },
  },
  returns: {
    'Registry.getMetricsAsArray': 'All registered metrics as plain objects.',
    'Registry.getMetricsAsJSON': 'A promise resolving to all registered metrics as objects, each with its current values.',
    'Registry.getSingleMetric': 'The registered metric named `name`, or `undefined` if none is registered.',
    'Registry.getSingleMetricAsString': 'A promise resolving to the exposition-format string for the named metric.',
    'Registry.metrics': 'A promise resolving to the exposition-format string for all registered metrics.',
    'Registry.merge': 'A new `Registry` containing the metrics of every registry in `registers`.',
    'Counter.get': "A promise resolving to the counter's current value as a metric object.",
    'Gauge.get': "A promise resolving to the gauge's current value as a metric object.",
    'Histogram.get': "A promise resolving to the histogram's current buckets and counts as a metric object.",
    'Summary.get': "A promise resolving to the summary's current percentiles as a metric object.",
    'Pushgateway.push': 'A promise resolving with the Pushgateway HTTP response and body.',
    'Pushgateway.pushAdd': 'A promise resolving with the Pushgateway HTTP response and body.',
    'Pushgateway.delete': 'A promise resolving with the Pushgateway HTTP response and body.',
  },
};

export default layout;
