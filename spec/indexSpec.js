"use strict";
/* eslint-env jasmine */

let express = require("express"),
    supertest = require("supertest"),
    bundle = require("../");

describe("index", () => {
    it("/metrics returns up=1", done => {
        const app = express();
        app.use(bundle({
            prefix: "hello:",
            whitelist: ["up"]
        }));
        app.use("/test", (req, res) => res.send("it worked"));
        
        const agent = supertest(app);
        agent.get("/test").end(() => {
            agent
                .get("/metrics")
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(res.text).toMatch(/hello:up\s1/);
                    done();
                });
        });
    });
    it("metrics can be filtered using exect match", () => {
        const instance = bundle({blacklist: ["up"]});
        expect(instance.metrics.up).not.toBeDefined();
        expect(instance.metrics.nodejs_memory_heap_total_bytes).toBeDefined();
    });
    it("metrics can be filtered using regex", () => {
        const instance = bundle({blacklist: [/memory/]});
        expect(instance.metrics.up).toBeDefined();
        expect(instance.metrics.nodejs_memory_heap_total_bytes).not.toBeDefined();
    });
    it("metrics can be whitelisted", () => {
        const instance = bundle({whitelist: [/^up$/]});
        expect(instance.metrics.up).toBeDefined();
        expect(instance.metrics.nodejs_memory_heap_total_bytes).not.toBeDefined();
        expect(instance.metrics.http_request_seconds).not.toBeDefined();
    });
    it("throws on both white and blacklist", () => {
        expect(() => {
            bundle({whitelist: [/up/], blacklist: [/up/]});
        }).toThrow();
    });
    it("returns error 500 on incorrect middleware usage", done => {
        const app = express();
        app.use(bundle);
        supertest(app)
            .get("/metrics")
            .end((err, res) => {
                expect(res.status).toBe(500);
                done();
            });
    });
    it("http latency gets counted", done => {
        const app = express();
        const instance = bundle();
        app.use(instance);
        app.use("/test", (req, res) => res.send("it worked"));
        const agent = supertest(app);
        agent
            .get("/test")
            .end(() => {
                const metricHashMap = instance.metrics.http_request_seconds.hashMap;
                expect(metricHashMap["status_code:200"]).toBeDefined();
                const labeled = metricHashMap["status_code:200"];
                expect(labeled.count).toBe(1);

                agent
                    .get("/metrics")
                    .end((err, res) => {
                        expect(res.status).toBe(200);
                        done();
                    });
            });
    });
    it("filters out the excludeRoutes", done => {
       const app = express();
        const instance = bundle({
            excludeRoutes: ["/test"]
        });
        app.use(instance);
        app.use("/test", (req, res) => res.send("it worked"));
        const agent = supertest(app);
        agent
            .get("/test")
            .end(() => {
                const metricHashMap = instance.metrics.http_request_seconds.hashMap;
                expect(metricHashMap["status_code:200"]).not.toBeDefined();

                agent
                    .get("/metrics")
                    .end((err, res) => {
                        expect(res.status).toBe(200);
                        done();
                    });
            });
    });
});