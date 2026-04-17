import request from "supertest";
import { AppDependencies } from "../../src/types";

export function loadTestApp(deps: AppDependencies = {}) {
  process.env.NODE_ENV = "test";

  // Import lazily to avoid module-level env state issues.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createApp } = require("../../src/app") as typeof import("../../src/app");

  const { app } = createApp(deps);
  const client = request(app);

  return { app, client };
}

type PostCapableClient = {
  post: (url: string) => request.Test;
};

export async function loginAsNemo(client: PostCapableClient) {
  const response = await client.post("/api/v1/auth/login").send({ username: "nemo" });
  return response.body as { token: string; playerId: string };
}
