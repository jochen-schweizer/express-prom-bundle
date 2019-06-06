// TypeScript Version: 2.8

import { Request, RequestHandler, Response } from 'express';
import { DefaultMetricsCollectorConfiguration } from 'prom-client';

export {};

export = express_prom_bundle;

declare namespace express_prom_bundle {
  interface Labels {
    [key: string]: string | number;
  }

  type StringOrRegExp = string | RegExp;
  type ExcludeFn = (req: Request, res: Response) => boolean;
  type NormalizePathEntry = [StringOrRegExp, string];
  type NormalizePathFn = (req: Request, opts: Opts) => string;
  type NormalizeStatusCodeFn = (res: Response) => number | string;
  type TransformLabelsFn = (labels: Labels, req: Request, res: Response) => Labels;

  interface Opts {
    autoregister?: boolean;

    excludeRoutes?: StringOrRegExp[];
    excludeFn?: ExcludeFn;

    customLabels?: { [key: string]: any };
    transformLabels?: TransformLabelsFn;

    includeStatusCode?: boolean;
    formatStatusCode?: NormalizeStatusCodeFn;

    includePath?: boolean;
    normalizePath?: NormalizePathEntry[] | NormalizePathFn;

    includeMethod?: boolean;
    includeUp?: boolean;

    httpDurationMetricName?: string;

    metricType?: 'summary' | 'histogram';
    metricsPath?: string;

    // summary
    percentiles?: number[];
    maxAgeSeconds?: number;
    ageBuckets?: number;

    // histogram
    buckets?: number[];

    promClient?: { collectDefaultMetrics?: DefaultMetricsCollectorConfiguration };

    // https://github.com/disjunction/url-value-parser#options
    urlValueParser?: {
      minHexLength?: number;
      minBase64Length?: number;
      replaceMasks?: string[];
      extraMasks?: string[];
    };
  }

  const normalizePath: NormalizePathFn;
  const normalizeStatusCode: NormalizeStatusCodeFn;

  function clusterMetrics(): RequestHandler;
}

interface express_prom_bundle {
  normalizePath: express_prom_bundle.NormalizePathFn;
  normalizeStatusCode: express_prom_bundle.NormalizeStatusCodeFn;
}

declare function express_prom_bundle(opts: express_prom_bundle.Opts): RequestHandler;