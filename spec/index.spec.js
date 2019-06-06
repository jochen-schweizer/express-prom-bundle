'use strict';
/* eslint-env jasmine */

const express = require('express');
const supertest = require('supertest');
const bundle = require('../');
const Koa = require('koa');
const c2k = require('koa-connect');
const supertestKoa = require('supertest-koa-agent');
const promClient = require('prom-client');
const cluster = require('cluster');

describe('index', () => {
  beforeEach(() => {
    promClient.register.clear();
  });

  it('metrics returns up=1', done => {
    const app = express();
    const bundled = bundle({
      excludeRoutes: ['/irrelevant', /at.all/]
    });
    app.use(bundled);
    app.use('/test', (req, res) => res.send('it worked'));

    const agent = supertest(app);
    agent.get('/test').end(() => {
      agent
        .get('/metrics')
        .end((err, res) => {
          expect(res.status).toBe(200);
          expect(res.text).toMatch(/up\s1/);
          done();
        });
    });
  });

  it('"up"-metric can be excluded', done => {
    const app = express();
    const bundled = bundle({
      includeUp: false
    });
    app.use(bundled);
    app.use('/test', (req, res) => res.send('it worked'));

    const agent = supertest(app);
    agent.get('/test').end(() => {
      agent
        .get('/metrics')
        .end((err, res) => {
          expect(res.status).toBe(200);
          expect(res.text).not.toMatch(/up\s1/);
          done();
        });
    });
  });

  it('metrics path can be defined with a regex', done => {
    const app = express();
    const bundled = bundle({
      metricsPath: /^\/prometheus$/
    });
    app.use(bundled);
    app.use('/test', (req, res) => res.send('it worked'));

    const agent = supertest(app);
    agent.get('/test').end(() => {
      agent
        .get('/prometheus')
        .end((err, res) => {
          expect(res.status).toBe(200);
          expect(res.text).toMatch(/up\s1/);
          done();
        });
    });
  });

  it('metrics path can be defined as regexp', done => {
    const app = express();
    const bundled = bundle();
    app.use(bundled);
    app.use('/test', (req, res) => res.send('it worked'));

    const agent = supertest(app);
    agent.get('/test').end(() => {
      agent
        .get('/metrics')
        .end((err, res) => {
          expect(res.status).toBe(200);
          expect(res.text).toMatch(/up\s1/);
          done();
        });
    });
  });

  it('httpDurationMetricName overrides histogram metric name', done => {
    const app = express();
    const bundled = bundle({
      httpDurationMetricName: 'my_http_duration'
    });
    app.use(bundled);

    const agent = supertest(app);
    agent.get('/metrics')
      .end((err, res) => {
        expect(res.text).toMatch(/my_http_duration/m);
        done();
      });
  });

  it('metrics should be attached to /metrics by default', done => {
    const app = express();
    const bundled = bundle();
    app.use(bundled);

    const agent = supertest(app);
    agent.get('/metrics')
      .end((err, res) => {
        expect(res.status).toBe(200);
        done();
      });
  });

  it('metrics can be attached to /metrics programatically', done => {
    const app = express();
    const bundled = bundle({
      autoregister: false
    });
    app.use(bundled.metricsMiddleware);
    app.use(bundled);

    app.use('/test', (req, res) => res.send('it worked'));

    const agent = supertest(app);
    agent.get('/metrics')
      .end((err, res) => {
        expect(res.status).toBe(200);
        done();
      });
  });

  it('returns error 500 on incorrect middleware usage', done => {
    const app = express();
    app.use(bundle);
    supertest(app)
      .get('/metrics')
      .end((err, res) => {
        expect(res.status).toBe(500);
        done();
      });
  });
  it('http latency gets counted', done => {
    const app = express();
    const instance = bundle();
    app.use(instance);
    app.use('/test', (req, res) => res.send('it worked'));
    const agent = supertest(app);
    agent
      .get('/test')
      .end(() => {
        const metricHashMap = instance.metrics.http_request_duration_seconds.hashMap;
        expect(metricHashMap['status_code:200']).toBeDefined();
        const labeled = metricHashMap['status_code:200'];
        expect(labeled.count).toBe(1);

        agent
          .get('/metrics')
          .end((err, res) => {
            expect(res.status).toBe(200);
            done();
          });
      });
  });

  it('filters out the excludeRoutes', done => {
    const app = express();
    const instance = bundle({
      excludeRoutes: ['/test', /bad.word/]
    });
    app.use(instance);
    app.use('/test', (req, res) => res.send('it worked'));
    app.use('/some/bad-word', (req, res) => res.send('it worked too'));
    const agent = supertest(app);
    agent
      .get('/test')
      .end(() => {
        agent
          .get('/some/bad-word')
          .end(() => {
            const metricHashMap = instance.metrics.http_request_duration_seconds.hashMap;
            expect(metricHashMap['status_code:200']).not.toBeDefined();

            agent
              .get('/metrics')
              .end((err, res) => {
                expect(res.status).toBe(200);
                done();
              });
          });
      });
  });

  it('filters out by the excludeFn', done => {
    const app = express();
    const instance = bundle({
      excludeRoutes: ['/test'],
      excludeFn: (req, res) => res.get('X-Ignored') === 'true'
    });

    app.use(instance);
    app.use('/test', (req, res) => res.send('it worked'));
    app.use('/ignored', (req, res) => {
      res.set('X-Ignored', true);
      res.send('it worked too');
    });

    const agent = supertest(app);
    agent
      .get('/test')
      .end(() => {
        agent
          .get('/ignored')
          .end(() => {
            const metricHashMap = instance.metrics.http_request_duration_seconds.hashMap;
            expect(metricHashMap['status_code:200']).not.toBeDefined();

            agent
              .get('/metrics')
              .end((err, res) => {
                expect(res.status).toBe(200);
                done();
              });
          });
      });
  });

  it('complains about deprecated options', () => {
    expect(() => bundle({prefix: 'hello'})).toThrow();
  });

  it('tolerates includePath, includeMethod, includeCustomLabels', done => {
    const app = express();
    const instance = bundle({
      includePath: true,
      includeMethod: true,
      includeCustomLabels: {foo: 'bar'}
    });
    app.use(instance);
    app.use('/test', (req, res) => res.send('it worked'));
    const agent = supertest(app);
    agent
      .get('/test')
      .end(() => {
        agent
          .get('/metrics')
          .end((err, res) => {
            expect(res.status).toBe(200);
            done();
          });
      });
  });

  it('metric type histogram works', done => {
    const app = express();
    const bundled = bundle({
      metricType: 'histogram',
      buckets: [10, 100],
    });
    app.use(bundled);
    app.use('/test', (req, res) => res.send('it worked'));

    const agent = supertest(app);
    agent.get('/test').end(() => {
      agent
        .get('/metrics')
        .end((err, res) => {
          expect(res.status).toBe(200);
          expect(res.text).toMatch(/le="100"/);
          done();
        });
    });
  });

  it('throws on unknown metricType ', () => {
    expect(() => {
      bundle({metricType: 'hello'});
    }).toThrow();
  });

  describe('usage of normalizePath()', () => {

    it('normalizePath can be replaced gloablly', done => {
      const app = express();
      const original = bundle.normalizePath;
      bundle.normalizePath = () => 'dummy';
      const instance = bundle({
        includePath: true,
      });
      app.use(instance);
      app.use('/test', (req, res) => res.send('it worked'));
      const agent = supertest(app);
      agent
        .get('/test')
        .end(() => {
          agent
            .get('/metrics')
            .end((err, res) => {
              expect(res.status).toBe(200);
              expect(res.text).toMatch(/"dummy"/m);
              bundle.normalizePath = original;
              done();
            });
        });
    });

    it('normalizePath function can be overridden', done => {
      const app = express();
      const instance = bundle({
        includePath: true,
        normalizePath: req => req.originalUrl + '-suffixed'
      });
      app.use(instance);
      app.use('/test', (req, res) => res.send('it worked'));
      const agent = supertest(app);
      agent
        .get('/test')
        .end(() => {
          agent
            .get('/metrics')
            .end((err, res) => {
              expect(res.status).toBe(200);
              expect(res.text).toMatch(/"\/test-suffixed"/m);
              done();
            });
        });
    });

    it('normalizePath can be passed as an array of [regex, replacement]', done => {
      const app = express();
      const instance = bundle({
        includePath: true,
        normalizePath: [
          ['^/docs/whatever/.*$', '/docs'],
          [/^\/docs$/, '/mocks']
        ]
      });
      app.use(instance);
      app.use('/docs/whatever/:andmore', (req, res) => res.send('it worked'));
      const agent = supertest(app);
      agent
        .get('/docs/whatever/unimportant')
        .end(() => {
          agent
            .get('/metrics')
            .end((err, res) => {
              expect(res.status).toBe(200);
              expect(res.text).toMatch(/"\/mocks"/m);
              done();
            });
        });
    });
  });

  it('formatStatusCode can be overridden', done => {
    const app = express();
    const instance = bundle({
      formatStatusCode: () => 555
    });
    app.use(instance);
    app.use('/test', (req, res) => res.send('it worked'));
    const agent = supertest(app);
    agent
      .get('/test')
      .end(() => {
        agent
          .get('/metrics')
          .end((err, res) => {
            expect(res.status).toBe(200);
            expect(res.text).toMatch(/555/);
            done();
          });
      });
  });

  it('includeStatusCode=false removes status_code label from metrics', done => {
    const app = express();
    const instance = bundle({
      includeStatusCode: false
    });
    app.use(instance);
    app.use('/test', (req, res) => res.send('it worked'));
    const agent = supertest(app);
    agent
      .get('/test')
      .end(() => {
        agent
          .get('/metrics')
          .end((err, res) => {
            expect(res.status).toBe(200);
            expect(res.text).not.toMatch(/="200"/);
            done();
          });
      });
  });

  it('customLabels={foo: "bar"} adds foo="bar" label to metrics', done => {
    const app = express();
    const instance = bundle({
      customLabels: {foo: 'bar'}
    });
    app.use(instance);
    app.use('/test', (req, res) => res.send('it worked'));
    const agent = supertest(app);
    agent
      .get('/test')
      .end(() => {
        agent
          .get('/metrics')
          .end((err, res) => {
            expect(res.status).toBe(200);
            expect(res.text).toMatch(/foo="bar"/);
            done();
          });
      });
  });

  it('tarnsformLabels can set label values', done => {
    const app = express();
    const instance = bundle({
      includePath: true,
      customLabels: {foo: 'bar'},
      transformLabels: labels => {
        labels.foo = 'baz';
        labels.path += '/ok';
      }
    });
    app.use(instance);
    app.use('/test', (req, res) => res.send('it worked'));
    const agent = supertest(app);
    agent
      .get('/test')
      .end(() => {
        agent
          .get('/metrics')
          .end((err, res) => {
            expect(res.status).toBe(200);
            expect(res.text).toMatch(/foo="baz"/);
            expect(res.text).toMatch(/path="\/test\/ok"/);
            done();
          });
      });
  });

  it('Koa: metrics returns up=1', done => {
    const app = new Koa();
    const bundled = bundle();
    app.use(c2k(bundled));

    app.use(function(ctx, next) {
      return next().then(() => ctx.body = 'it worked');
    });

    const agent = supertestKoa(app);
    agent.get('/test').end(() => {
      agent
        .get('/metrics')
        .end((err, res) => {
          expect(res.status).toBe(200);
          expect(res.text).toMatch(/^up\s1/m);
          done();
        });
    });
  });

  it('calls promClient.collectDefaultMetrics', () => {
    const spy = spyOn(promClient, 'collectDefaultMetrics');
    bundle({
      promClient: {
        collectDefaultMetrics: {
          timeout: 3000
        }
      }
    });
    expect(spy).toHaveBeenCalledWith({timeout: 3000});
  });

  describe('usage of clusterMetrics()', () => {
    it('clusterMetrics returns 200 even without a cluster', (done) => {
        const app = express();

        cluster.workers = [];

        app.use('/cluster_metrics', bundle.clusterMetrics());
        const agent = supertest(app);
        agent
          .get('/cluster_metrics')
          .end((err, res) => {
            expect(res.status).toBe(200);
            done();
          });
    });

    it('clusterMetrics returns 500 in case of an error', (done) => {
      const app = express();
      app.use('/cluster_metrics', bundle.clusterMetrics());
      const agent = supertest(app);

      // create a fake worker, which would not respond in time
      cluster.workers = [{
        isConnected: () => true,
        send: () => {}
      }];

      const errorSpy = spyOn(console, 'error'); // mute console.error

      agent
        .get('/cluster_metrics')
        .end((err, res) => {
          expect(res.status).toBe(500);
          expect(errorSpy).toHaveBeenCalled();
          done();
        });
    }, 6000);
  });

  describe('metricType: summary', () => {
    it('metric type summary works', done => {
      const app = express();
      const bundled = bundle({
        metricType: 'summary'
      });
      app.use(bundled);
      app.use('/test', (req, res) => res.send('it worked'));

      const agent = supertest(app);
      agent.get('/test').end(() => {
        agent
          .get('/metrics')
          .end((err, res) => {
            expect(res.status).toBe(200);
            expect(res.text).toMatch(/quantile="0.98"/);
            done();
          });
      });
    });

    it('custom pecentiles work', done => {
      const app = express();
      const bundled = bundle({
        metricType: 'summary',
        percentiles: [0.5, 0.85, 0.99],
      });
      app.use(bundled);
      app.use('/test', (req, res) => res.send('it worked'));

      const agent = supertest(app);
      agent.get('/test').end(() => {
        agent
          .get('/metrics')
          .end((err, res) => {
            expect(res.status).toBe(200);
            expect(res.text).toMatch(/quantile="0.85"/);
            done();
          });
      });
    });
  });
});
