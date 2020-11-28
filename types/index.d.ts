// TypeScript Version: 2.8

import { Request, RequestHandler, Response } from 'express';
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
    buckets?: number[];

    customLabels?: { [key: string]: any };

    includeStatusCode?: boolean;
    includeMethod?: boolean;
    includePath?: boolean;
    includeUp?: boolean;

    filter?: (req: Request) => boolean;

    metricType?: 'summary' | 'histogram';
    metricsPath?: string;
    httpDurationMetricName?: string;
    promClient?: { collectDefaultMetrics?: DefaultMetricsCollectorConfiguration };
    promRegistry?: Registry;
    normalizePath?: NormalizePathEntry[] | NormalizePathFn;
    formatStatusCode?: NormalizeStatusCodeFn;
    transformLabels?: TransformLabelsFn;

    // https://github.com/disjunction/url-value-parser#options
    urlValueParser?: {
      minHexLength?: number;
      minBase64Length?: number;
      replaceMasks?: string[];
      extraMasks?: string[];
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
