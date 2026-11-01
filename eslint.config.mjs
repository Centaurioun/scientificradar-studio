import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vendor snapshots are inactive source references, not ScientificRadar application code.
export default defineConfig([{ ignores: ["vendor-staging/**"] }, {
    extends: [...next],
}]);
