"use strict";

const express = require("express"),
    app = express(),
    promBundle = require(".");

app.use(promBundle({
    prefix: "demo_app:something"
}));

app.get("/hello", (req, res) => res.send("ok"));

app.listen(3000);