#!/usr/bin/env node

import { createProject } from "./create.js";
import { updateProject } from "./update.js";

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
@mchen-lab/app-kit CLI

Usage:
  app-kit create <project-name> [options]    Create a new Docker-ready Node.js project
  app-kit update [options]                   Update managed files to latest version
  app-kit --help                             Show this help message
  app-kit --version                          Show version

Create Options:
  --port <port>         Default port for the service (default: 3000)
  --no-frontend         Skip frontend setup

Update Options:
  --dry-run             Show what would be updated without making changes
  --force               Overwrite files even if modified

Examples:
  app-kit create my-service
  app-kit create my-api --port 8080 --no-frontend
  app-kit update
  app-kit update --dry-run
`);
}

async function main() {
  if (!command || command === "--help" || command === "-h") {
    showHelp();
    process.exit(0);
  }

  if (command === "--version" || command === "-v") {
    const pkg = await import("../../package.json", { with: { type: "json" } });
    console.log(pkg.default.version);
    process.exit(0);
  }

  if (command === "create") {
    const projectName = args[1];
    if (!projectName) {
      console.error("❌ Error: Project name is required");
      console.error("Usage: app-kit create <project-name>");
      process.exit(1);
    }

    const options = {
      port: 3000,
      withFrontend: true,
    };

    // Parse options
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--port" && args[i + 1]) {
        options.port = parseInt(args[i + 1]);
        i++;
      } else if (args[i] === "--no-frontend") {
        options.withFrontend = false;
      }
    }

    await createProject(projectName, options);
  } else if (command === "update") {
    const options = {
      dryRun: args.includes("--dry-run"),
      force: args.includes("--force"),
    };

    await updateProject(options);
  } else {
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
