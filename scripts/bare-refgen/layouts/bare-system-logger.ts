// scripts/bare-refgen/layouts/bare-system-logger.ts
// Editorial layout for bare-system-logger. The FreeRTOS note is read from
// liblog's src/freertos.c, which v1.0.7 pins.

import type { Layout } from '../layout';

const layout: Layout = {
  seeAlso: [
    'On FreeRTOS, which has no system log, records go to standard error, which the firmware routes to its console. Added in v1.0.7, through the FreeRTOS backend of `liblog`.',
  ],
};

export default layout;
