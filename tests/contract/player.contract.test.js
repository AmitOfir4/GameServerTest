"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ajv_1 = __importDefault(require("ajv"));
const player_response_schema_json_1 = __importDefault(require("./player-response.schema.json"));
const test_app_1 = require("../helpers/test-app");
describe("Player API contract", () => {
    it("matches JSON schema", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const auth = await (0, test_app_1.loginAsNemo)(client);
        const response = await client
            .get(`/api/v1/players/${auth.playerId}`)
            .set("Authorization", `Bearer ${auth.token}`);
        const ajv = new ajv_1.default();
        const validate = ajv.compile(player_response_schema_json_1.default);
        const valid = validate(response.body);
        expect(response.status).toBe(200);
        expect(valid).toBe(true);
    });
});
