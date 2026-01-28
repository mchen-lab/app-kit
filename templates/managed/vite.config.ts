import { defineConfig } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./package.json"), "utf-8"));

// Get commit hash
let commitHash = process.env.GIT_COMMIT;
if (!commitHash) {
  try {
    // Only try git if not provided via env (dev mode)
    commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch (e) {
    commitHash = 'unknown';
  }
}

export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify('v' + packageJson.version + (process.env.BUILD_METADATA || '')),
    '__COMMIT_HASH__': JSON.stringify(commitHash),
  },
  root: "src/frontend",
  
  server: {
    middlewareMode: true,
  },

  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/frontend"),
    },
  },
});
