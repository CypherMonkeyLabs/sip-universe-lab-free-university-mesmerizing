/* Development-set score. Not the frozen held-out files.
   Usage: node tests/sipbot-eval.mjs
*/
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const runner = path.join(here, "sipbot-heldout.mjs");
const result = spawnSync(process.execPath, [runner, "--spec", path.join(here, "sipbot-dev.json"), "--out", path.join(here, "sipbot-dev-report.json")], {
  stdio: "inherit",
});
process.exit(result.status == null ? 1 : result.status);
