
import express, { Express, Router } from "express";
import cors from "cors";
import path from "path";
import fs from "fs/promises";

// Types for Config
export interface BaseConfig {
  [key: string]: any;
}

export interface AppKitOptions {
  appName: string;
  defaultConfig: BaseConfig;
  configPath?: string;
  disableStatic?: boolean;
}

export class AppKit {
  public app: Express;
  public config: BaseConfig;
  private options: AppKitOptions;
  private configPath: string;

  constructor(options: AppKitOptions) {
    this.options = options;
    this.app = express();
    this.config = { ...options.defaultConfig };
    
    // Default config path: /data/settings.json or ./data/settings.json
    // We try to detect if we are in a container (usually /app)
    const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), "data");
    this.configPath = options.configPath || path.join(dataDir, "settings.json");

    this.setupMiddleware();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  public async initialize() {
    await this.loadConfig();
    this.setupRoutes();
  }

  private async loadConfig() {
    try {
      // 1. Ensure dir exists
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });

      // 2. Load File if exists
      try {
        const fileContent = await fs.readFile(this.configPath, "utf-8");
        const fileConfig = JSON.parse(fileContent);
        this.config = { ...this.config, ...fileConfig };
        console.log(`[AppKit] Loaded config from ${this.configPath}`);
      } catch (e) {
        console.log(`[AppKit] Config file not found or invalid, initializing defaults.`);
      }

      // 3. Auto-Hydrate from ENV (Simple version: generic flat or nested via helper)
      // For now, let's look for known keys in default config? 
      // Or just matching generic logic if implemented. 
      // User requested "Env overrides settings.json".
      // Let's implement basic nested overrides: VAR_NAME maps to varName or var_name
      
      // 4. Save effective config back to disk (to persist Env overwrites or Defaults)
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));

    } catch (e) {
      console.error("[AppKit] Failed to load config", e);
    }
  }

  private setupRoutes() {
    const router = Router();

    // Standard Config APIs
    router.get("/settings", (req, res) => res.json(this.config));
    router.post("/settings", async (req, res) => {
      try {
        const newSettings = req.body;
        this.config = { ...this.config, ...newSettings };
        await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
        res.json({ success: true, config: this.config });
      } catch (e) {
        res.status(500).json({ error: "Failed to save settings" });
      }
    });

    // Version Info
    router.get("/version", (req, res) => {
      res.json({
        version: process.env.VITE_APP_VERSION || process.env.npm_package_version || "dev",
        commit: process.env.VITE_COMMIT_HASH || "unknown"
      });
    });

    this.app.use("/api", router);

    // Static Serving (Standard Vite Dist)
    if (!this.options.disableStatic) {
       // Assuming dist is sibling to server or in known location
       // In `local-notes-mcp2`: backend/server.js serves ../frontend/dist
       // We need to be flexible.
       const distPath = process.env.DIST_PATH || path.resolve(process.cwd(), "frontend/dist");
       this.app.use(express.static(distPath));
       
       // SPA Fallback
       this.app.get("*", (req, res, next) => {
         if (req.path.startsWith("/api")) return next();
         res.sendFile(path.join(distPath, "index.html"));
       });
    }
  }

  public listen(port: number | string, callback?: () => void) {
    this.app.listen(port, () => {
      console.log(`[AppKit] 🚀 ${this.options.appName} running on port ${port}`);
      if (callback) callback();
    });
  }
}

export function createApp(options: AppKitOptions) {
  return new AppKit(options);
}
