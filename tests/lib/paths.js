"use strict";

/**
 * Output paths for the preserved hero QA scripts.
 *
 * Screenshots and geometry JSON are generated artefacts, never committed. The
 * default root is tests/.local/out (git-ignored); HERO_OUT_DIR overrides it.
 */

const fs = require("node:fs");
const path = require("node:path");

const OUT_ROOT = process.env.HERO_OUT_DIR || path.join(__dirname, "..", ".local", "out");

function out(name) {
  const dir = path.join(OUT_ROOT, name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = { OUT_ROOT, out };
