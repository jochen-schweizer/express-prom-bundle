"use strict";

const express = require("express"),
    app = express(),
    promBundle = require("express-prom-bundle"),
    promClient = require("prom-client");

const bundle = promBundle({
    prefix: "demo_app:something:",
    blacklist: [/up/]
});

app.use(bundle);

let c1 = new bundle.promClient.Counter("c1", "c1 help");
c1.inc(10);

let c2 = bundle.factory.newCounter("c2", "c2 help");
c2.inc(20);

app.get("/foo", (req, res) => {
    setTimeout(() => {
        res.send("foo response");
    }, 500);
});
app.get("/bar", (req, res) => res.send("bar response"));

app.listen(3001);
