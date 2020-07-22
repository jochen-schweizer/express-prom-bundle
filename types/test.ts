import { Request, RequestHandler, Response } from 'express';
import * as promClient from 'prom-client';

import * as promBundle from 'express-prom-bundle';

// $ExpectType RequestHandler
const middleware: RequestHandler = promBundle({ includeMethod: true });

// $ExpectType: string
middleware.name;

promClient.register.clear();

// $ExpectType RequestHandler
promBundle({
  normalizePath: [
    // collect paths like "/customer/johnbobson" as just one "/custom/#name"
    ['^/customer/.*', '/customer/#name'],

    // collect paths like "/bobjohnson/order-list" as just one "/#name/order-list"
    ['^.*/order-list', '/#name/order-list']
  ],
  urlValueParser: {
    minHexLength: 5,
    extraMasks: [
      'ORD[0-9]{5,}' // replace strings like ORD1243423, ORD673562 as #val
    ]
  }
});

promClient.register.clear();

// $ExpectType RequestHandler
promBundle({
  buckets: [0.1, 0.4, 0.7],
  includeMethod: true,
  includePath: true,
  customLabels: { year: null },
  transformLabels: (labels: promBundle.Labels) => ({
    ...labels,
    year: new Date().getFullYear()
  }),
  metricType: 'summary',
  metricsPath: '/prometheus',
  promClient: {
    collectDefaultMetrics: {
    }
  },
  promRegistry: new promClient.Registry(),
  urlValueParser: {
    minHexLength: 5,
    extraMasks: [
      '^[0-9]+\\.[0-9]+\\.[0-9]+$' // replace dot-separated dates with #val
    ]
  },
  normalizePath: [
    ['^/foo', '/example'] // replace /foo with /example
  ],
  formatStatusCode: (res: Response) => res.statusCode + 100
});

// TypeScript workaround to write a readonly field
type Writable<T> = { -readonly [K in keyof T]: T[K] };
const wPromBundle: Writable<promBundle> = promBundle;

wPromBundle.normalizePath = (req: Request, opts: promBundle.Opts) => {
  const path = promBundle.normalizePath(req, opts);

  // count all docs as one path, but /docs/login as a separate one
  return path.match(/^\/docs/) && !path.match(/^\/login/) ? '/docs/*' : path;
};

wPromBundle.normalizeStatusCode = (res: Response) => res.statusCode.toString();

// $ExpectType RequestHandler
promBundle.clusterMetrics();

// Missing test
// const stringReturn: string = promBundle.normalizePath({}, {});
