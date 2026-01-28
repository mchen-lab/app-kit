import { createApp } from "@mchen-lab/app-kit/backend";
import { createServer } from "http";
import express, { type Request, type Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define your config schema
interface AppConfig {
  // Add your config properties here
  exampleSetting: string;
}

// Default config values
const defaultConfig: AppConfig = {
  exampleSetting: "default-value",
};

// Initialize AppKit
const appKit = createApp({
  appName: "{{PROJECT_NAME_TITLE}}",
  defaultConfig: defaultConfig,
  disableStatic: true, // We serve our own static files
});

const app = appKit.app;

// Environment Variables
const PORT = process.env.PORT || {{PORT}};
const startTime = Date.now();
const isProduction = process.env.NODE_ENV === "production";

// Version info from build
const VERSION = 'v' + (process.env.npm_package_version || "0.1.0") + (process.env.BUILD_METADATA || "");
const GIT_COMMIT = process.env.GIT_COMMIT || "";

// =============================================================================
// API Routes
// =============================================================================

// Status API
app.get("/api/status", (_req: Request, res: Response) => {
  const uptime = (Date.now() - startTime) / 1000;
  res.json({
    status: "online",
    uptime: uptime,
    timestamp: new Date().toISOString(),
    port: Number(PORT),
  });
});

// Version API
app.get("/api/version", (_req: Request, res: Response) => {
  res.json({
    version: VERSION,
    commit: GIT_COMMIT,
  });
});

// Example: Access config
app.get("/api/config-example", (_req: Request, res: Response) => {
  const config = appKit.config as AppConfig;
  res.json({ exampleSetting: config.exampleSetting });
});

// Example: Update config
app.post("/api/config-example", async (req: Request, res: Response) => {
  try {
    await appKit.updateConfig({ exampleSetting: req.body.exampleSetting });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update config" });
  }
});

// =============================================================================
// Server Startup & Frontend Integration
// =============================================================================

async function start() {
  await appKit.initialize();

  // Frontend Serving Logic
  if (isProduction) {
    // Production: Serve built static files
    const distPath = path.join(__dirname, "../../dist");
    app.use(express.static(distPath));

    // SPA fallback
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // Development: Use Vite middleware
    try {
      const vite = await import("vite");
      
      const frontendDir = path.resolve(__dirname, "../frontend");
      
      const viteServer = await vite.createServer({
        server: { middlewareMode: true },
        appType: "spa",
        root: frontendDir,
        configFile: path.resolve(frontendDir, "../../vite.config.ts"),
      });

      // Use Vite middleware for all routes except API
      app.use((req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }
        viteServer.middlewares(req, res, next);
      });
      
      console.log("🔥 Hot reload enabled via Vite Middleware");
    } catch (e) {
      console.error("Failed to start Vite middleware", e);
    }
  }

  const server = createServer(app);

  server.listen(PORT, () => {
    console.log(`🚀 {{PROJECT_NAME_TITLE}} running on http://localhost:${PORT}`);
  });
}

start().catch((err) => console.error("Startup failed", err));
