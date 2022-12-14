// TypeScript Version: 2.8

import { Request, RequestHandler, Response, Express } from 'express';
import { DefaultMetricsCollectorConfiguration, Registry } from 'prom-client';

export {};

export = express_prom_bundle;

declare namespace express_prom_bundle {
  interface Labels {
    [key: string]: string | number;
  }

  type NormalizePathEntry = [string | RegExp, string];
  type NormalizePathFn = (req: Request, opts: Opts) => string;
  type NormalizeStatusCodeFn = (res: Response) => number | string;
  type TransformLabelsFn = (labels: Labels, req: Request, res: Response) => void;

  interface Opts {
    autoregister?: boolean;

    customLabels?: { [key: string]: any };

    includeStatusCode?: boolean;
    includeMethod?: boolean;
    includePath?: boolean;
    includeUp?: boolean;

    bypass?:
      | ((req: Request) => boolean)
      | {
          onRequest?: (req: Request) => boolean;
          onFinish?: (req: Request, res: Response) => boolean;
        };

    excludeRoutes?: Array<string | RegExp>;

    metricType?: 'summary' | 'histogram';

    // https://github.com/siimon/prom-client#histogram
    buckets?: number[];

    // https://github.com/siimon/prom-client#summary
    percentiles?: number[];
    maxAgeSeconds?: number;
    ageBuckets?: number;

    metricsPath?: string;
    httpDurationMetricName?: string;
    promClient?: { collectDefaultMetrics?: DefaultMetricsCollectorConfiguration };
    promRegistry?: Registry;
    normalizePath?: NormalizePathEntry[] | NormalizePathFn;
    formatStatusCode?: NormalizeStatusCodeFn;
    transformLabels?: TransformLabelsFn;
    urlPathReplacement?: string;
    metricsApp?: Express;

    // https://github.com/disjunction/url-value-parser#options
    urlValueParser?: {
      minHexLength?: number;
      minBase64Length?: number;
      replaceMasks?: Array<RegExp | string>;
      extraMasks?: Array<RegExp | string>;
    };
  }

  interface Middleware extends RequestHandler {
    metricsMiddleware: RequestHandler;
  }

  const normalizePath: NormalizePathFn;
  const normalizeStatusCode: NormalizeStatusCodeFn;

  function clusterMetrics(): RequestHandler;
}

interface express_prom_bundle {
  normalizePath: express_prom_bundle.NormalizePathFn;
  normalizeStatusCode: express_prom_bundle.NormalizeStatusCodeFn;
}

declare function express_prom_bundle(opts: express_prom_bundle.Opts): express_prom_bundle.Middleware;
