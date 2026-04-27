import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Playwright tests live in e2e/ and run via `npm run e2e`. Don't let
  // Jest try to execute them — it would crash on @playwright/test imports.
  testPathIgnorePatterns: ["/node_modules/", "/e2e/", "/.next/"],
};

export default config;
