import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const esbuild = process.env.ESBUILD || "/tmp/sip-build/node_modules/esbuild/bin/esbuild";

const embed = spawnSync(process.execPath, [join(root, "scripts", "embed_data.mjs")], { stdio: "inherit" });
if (embed.status !== 0) process.exit(embed.status || 1);

const bundle = spawnSync(esbuild, [
  join(root, "campus", "js", "app.js"),
  "--bundle",
  "--format=iife",
  "--target=es2020",
  `--outfile=${join(root, "campus", "js", "campus.iife.js")}`,
], { stdio: "inherit" });
if (bundle.status !== 0) process.exit(bundle.status || 1);
