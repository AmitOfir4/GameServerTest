import type { Config } from "jest";

const common: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts", "!src/scripts/run-db-api.ts", "!src/scripts/seed-db.ts"],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  clearMocks: true
};

const config: Config = {
  testTimeout: 120000,
  projects: [
    {
      ...common,
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.ts"]
    },
    {
      ...common,
      displayName: "integration",
      testMatch: ["<rootDir>/tests/integration/**/*.test.ts"]
    },
    {
      ...common,
      displayName: "e2e",
      testMatch: ["<rootDir>/tests/e2e/**/*.test.ts"]
    },
    {
      ...common,
      displayName: "contract",
      testMatch: ["<rootDir>/tests/contract/**/*.test.ts"]
    },
    {
      ...common,
      displayName: "db",
      testMatch: ["<rootDir>/tests/db/**/*.test.ts"]
    },
    {
      ...common,
      displayName: "smoke",
      testMatch: ["<rootDir>/tests/smoke/**/*.test.ts"]
    }
  ]
};

export default config;
