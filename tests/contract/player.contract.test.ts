import Ajv from "ajv";
import schema from "./player-response.schema.json";
import { loadTestApp, loginAsNemo } from "../helpers/test-app";

describe("Player API contract", () => {
  it("matches JSON schema", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    const response = await client
      .get(`/api/v1/players/${auth.playerId}`)
      .set("Authorization", `Bearer ${auth.token}`);

    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const valid = validate(response.body);

    expect(response.status).toBe(200);
    expect(valid).toBe(true);
  });
});
