import * as express from "express";
import { DefaultMetricsCollectorConfiguration } from "prom-client";

type NormalizePathRegexs = [string, string];

interface Labels {
  [key: string]: string | number;
}

interface Opts {
  autoregister?: boolean;
  buckets?: [number];

  includeStatusCode?: boolean;
  includeMethod?: boolean;
  includePath?: boolean;
  includeUp?: boolean;

  metricType?: "summary" | "histogram";
  metricsPath?: string;
  promClient?: DefaultMetricsCollectorConfiguration;
  normalizePath?: NormalizePathRegexs;
  formatStatusCode?: (res: express.Response) => number | string;

  transformLabels: (
    labels: Labels,
    req: express.Request,
    res: express.Response
  ) => Labels;

  // https://github.com/disjunction/url-value-parser#options
  urlValueParser?: {
    minHexLength?: number;
    minBase64Length?: number;
    replaceMasks?: string[];
    extraMasks?: string[];
  };
}

export function normalizePath(
  req: express.Request,
  opts?: { normalizePath?: NormalizePathRegexs }
);

export default function(opts: Opts): express.RequestHandler;
