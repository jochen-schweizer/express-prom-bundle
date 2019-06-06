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
  type NormalizePathEntry = [StringOrRegExp, string];
  type NormalizePathFn = (req: Request, opts: Opts) => string;
  type NormalizeStatusCodeFn = (res: Response) => number | string;
  type TransformLabelsFn = (labels: Labels, req: Request, res: Response) => Labels;

  interface Opts {
    autoregister?: boolean;
    buckets?: number[];

    excludeRoutes?: StringOrRegExp[];

    customLabels?: { [key: string]: any };

    includeStatusCode?: boolean;
    includeMethod?: boolean;
    includePath?: boolean;
    includeUp?: boolean;

    metricType?: 'summary' | 'histogram';
    metricsPath?: string;
    promClient?: { collectDefaultMetrics?: DefaultMetricsCollectorConfiguration };
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

  const normalizePath: NormalizePathFn;
  const normalizeStatusCode: NormalizeStatusCodeFn;

  function clusterMetrics(): RequestHandler;
}

interface express_prom_bundle {
  normalizePath: express_prom_bundle.NormalizePathFn;
  normalizeStatusCode: express_prom_bundle.NormalizeStatusCodeFn;
}

declare function express_prom_bundle(opts: express_prom_bundle.Opts): RequestHandler;
