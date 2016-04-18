"use strict";
/* eslint-env jasmine */

let express = require("express"),
    request = require("supertest"),
    bundle = require("../");

describe("index", () => {
    const app = express();
    
    app.use(bundle({
        prefix: "hello:"
    }));

    it("/metrics returns up=1", done => {
        request(app)
            .get("/metrics")
            .end((err, res) => {
                expect(res.status).toBe(200);
                expect(res.text).toMatch(/hello:up\s1/);
                done();
            });
    });
});