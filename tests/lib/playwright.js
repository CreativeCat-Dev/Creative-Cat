"use strict";

/**
 * Shared Playwright resolver for the preserved hero QA scripts.
 *
 * The original scripts were written against a machine-specific Playwright
 * runtime and a downloaded Chromium build. That is not a project dependency, so
 * resolution is layered:
 *
 *   1. PLAYWRIGHT_MODULE  — explicit module path or package name
 *   2. tests/.local/runtime.json -> { "playwrightModule": "..." }
 *   3. `playwright-core` or `playwright` if installed
 *
 * Browser resolution is equally layered:
 *
 *   1. CHROMIUM_PATH      — explicit Chrome/Chromium executable
 *   2. tests/.local/runtime.json -> { "chromiumPath": "..." }
 *   3. Playwright's own bundled browser
 *
 * tests/.local/ is git-ignored, so no machine path is committed.
 */

const fs = require("node:fs");
const path = require("node:path");

function localConfig() {
  try {
    const file = path.join(__dirname, "..", ".local", "runtime.json");
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function loadPlaywright() {
  const config = localConfig();
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    config.playwrightModule,
    "playwright-core",
    "playwright",
  ].filter(Boolean);

  const errors = [];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch (error) {
      errors.push(`${candidate}: ${error.message}`);
    }
  }

  throw new Error(
    [
      "Could not load Playwright.",
      "Set PLAYWRIGHT_MODULE to a playwright-core/playwright module path,",
      "or create tests/.local/runtime.json with { \"playwrightModule\": \"...\" }.",
      ...errors,
    ].join("\n"),
  );
}

const { chromium } = loadPlaywright();

/** Launch options with the local Chromium override when one is configured. */
function launchOptions(extra = {}) {
  const config = localConfig();
  const executablePath = process.env.CHROMIUM_PATH || config.chromiumPath;
  return executablePath ? { executablePath, ...extra } : { ...extra };
}

module.exports = { chromium, launchOptions };
