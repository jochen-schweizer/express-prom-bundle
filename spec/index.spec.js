'use strict';
/* eslint-env jasmine */

const express = require('express');
const supertest = require('supertest');
const bundle = require('../');
const Koa = require('koa');
const c2k = require('koa-connect');
const supertestKoa = require('supertest-koa-agent');
const promClient = require('prom-client');

describe('index', () => {
  beforeEach(() => {
    promClient.register.clear();
  });

  it('metrics returns up=1', done => {
    const app = express();
    const bundled = bundle({
      whitelist: ['up']
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

  it('metrics should be attached to /metrics by default', done => {
    const app = express();
    const bundled = bundle({
      whitelist: ['up']
    });
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

  it('metrics can be filtered using exect match', () => {
    const instance = bundle({blacklist: ['up']});
    expect(instance.metrics.up).not.toBeDefined();
    expect(instance.metrics.http_request_duration_seconds).toBeDefined();
  });
  it('metrics can be filtered using regex', () => {
    const instance = bundle({blacklist: [/http/]});
    expect(instance.metrics.up).toBeDefined();
    expect(instance.metrics.http_request_duration_seconds).not.toBeDefined();
  });
  it('metrics can be whitelisted', () => {
    const instance = bundle({whitelist: [/^up$/]});
    expect(instance.metrics.up).toBeDefined();
    expect(instance.metrics.nodejs_memory_heap_total_bytes).not.toBeDefined();
    expect(instance.metrics.http_request_duration_seconds).not.toBeDefined();
  });
  it('throws on both white and blacklist', () => {
    expect(() => {
      bundle({whitelist: [/up/], blacklist: [/up/]});
    }).toThrow();
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
      excludeRoutes: ['/test']
    });
    app.use(instance);
    app.use('/test', (req, res) => res.send('it worked'));
    const agent = supertest(app);
    agent
      .get('/test')
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

  it('complains about deprecated options', () => {
    expect(() => bundle({prefix: 'hello'})).toThrow();
  });

  it('tolerates includePath, includeMethod', done => {
    const app = express();
    const instance = bundle({
      includePath: true,
      includeMethod: true
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

  it('normalizePath can be overridden', done => {
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
            expect(res.text).not.toMatch(/200/);
            done();
          });
      });
  });

  it('Koa: metrics returns up=1', done => {
    const app = new Koa();
    const bundled = bundle({
      whitelist: ['up']
    });
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
});
