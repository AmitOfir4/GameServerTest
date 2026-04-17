"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTestApp = loadTestApp;
exports.loginAsNemo = loginAsNemo;
const supertest_1 = __importDefault(require("supertest"));
function loadTestApp(deps = {}) {
    process.env.NODE_ENV = "test";
    // Import lazily to avoid module-level env state issues.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createApp } = require("../../src/app");
    const { app } = createApp(deps);
    const client = (0, supertest_1.default)(app);
    return { app, client };
}
async function loginAsNemo(client) {
    const response = await client.post("/api/v1/auth/login").send({ username: "nemo" });
    return response.body;
}
