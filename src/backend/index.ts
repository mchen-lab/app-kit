
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
  logsDir?: string;
  disableStatic?: boolean;
  onConfigChange?: (config: BaseConfig) => void;
  recreateMissingConfig?: boolean;
}

// Utility function for checking file existence
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export class AppKit {
  public app: Express;
  public config: BaseConfig;
  private options: AppKitOptions;
  private configPath: string;
  private logsDir: string;
  private port: number | string | null = null;

  constructor(options: AppKitOptions) {
    this.options = options;
    this.app = express();
    this.config = { ...options.defaultConfig };
    
    const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), "data");
    this.configPath = options.configPath || path.join(dataDir, "settings.json");

    this.logsDir = process.env.LOGS_DIR || options.logsDir || path.resolve(process.cwd(), "logs");

    this.setupMiddleware();
  }

  private log(message: string, level: 'info' | 'error' | 'warn' = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.options.appName}]`;
    if (level === 'error') {
      console.error(`${prefix} ❌ ${message}`);
    } else if (level === 'warn') {
      console.warn(`${prefix} ⚠️ ${message}`);
    } else {
      console.log(`${prefix} ℹ️ ${message}`);
    }
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.log(`${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
  }

  public async initialize() {
    await this.loadConfig();
    this.setupRoutes();
    this.log("Initialized successfully");
  }

  private async loadConfig() {
    try {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.mkdir(this.logsDir, { recursive: true });

      // 1. Hydrate from Environment Variables (Default < Env)
      // Strategy: Look for keys present in defaultConfig (case-insensitive)
      const envKeys = Object.keys(process.env);
      for (const configKey of Object.keys(this.options.defaultConfig)) {
        const envKey = configKey.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        if (process.env[envKey] !== undefined) {
          const val = process.env[envKey];
          // Try to cast to number or boolean if original was that type
          if (typeof this.options.defaultConfig[configKey] === 'boolean') {
            this.config[configKey] = val === 'true' || val === '1';
          } else if (typeof this.options.defaultConfig[configKey] === 'number') {
            this.config[configKey] = Number(val);
          } else {
            this.config[configKey] = val;
          }
          this.log(`Overridden ${configKey} from environment variable ${envKey}`);
        }
      }

      // 2. Load from file (Env < File/UI)
      // Settings.json has the highest priority (User overrides)
      try {
        const fileContent = await fs.readFile(this.configPath, "utf-8");
        const fileConfig = JSON.parse(fileContent);
        this.config = { ...this.config, ...fileConfig };
        this.log(`Loaded config from ${this.configPath}`);
      } catch (e) {
        this.log(`Config file not found or invalid, using defaults/env.`, 'warn');
        if (this.options.recreateMissingConfig) {
          await this.saveConfig();
        }
      }

      // 3. (Removed) Save effective config back to disk to avoid restart loops in dev mode
      // If you want to force save, call appKit.saveConfig() explicitly.

    } catch (e) {
      this.log(`Failed to load config: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  }

  /**
   * Save current config to disk
   */
  public async saveConfig(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      this.log("Config saved");
      if (this.options.onConfigChange) {
        this.options.onConfigChange(this.config);
      }
    } catch (e) {
      this.log(`Failed to save config: ${e instanceof Error ? e.message : String(e)}`, 'error');
      throw e;
    }
  }

  /**
   * Update config with partial values and save
   */
  public async updateConfig(partial: Partial<BaseConfig>): Promise<void> {
    this.config = { ...this.config, ...partial };
    await this.saveConfig();
  }

  /**
   * Get the config file path (read-only access)
   */
  public getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Get the logs directory path (read-only access)
   */
  public getLogsDir(): string {
    return this.logsDir;
  }

  private setupRoutes() {
    const router = Router();

    // Standard Health Check
    router.get("/status", (req, res) => {
      res.json({ 
        status: "ok", 
        appName: this.options.appName,
        timestamp: new Date().toISOString(),
        port: this.port
      });
    });

    // Standard Config APIs
    router.get("/settings", (req, res) => res.json(this.config));
    router.post("/settings", async (req, res) => {
      try {
        const newSettings = req.body;
        await this.updateConfig(newSettings);
        this.log("Settings updated via API");
        res.json({ success: true, config: this.config });
      } catch (e) {
        this.log(`Failed to save settings: ${e}`, 'error');
        res.status(500).json({ error: "Failed to save settings" });
      }
    });

    // Version Info
    router.get("/version", (req, res) => {
      res.json({
        version: process.env.VITE_APP_VERSION || process.env.BUILD_METADATA || process.env.npm_package_version || "dev",
        commit: process.env.VITE_COMMIT_HASH || process.env.GIT_COMMIT || "unknown"
      });
    });

    // Documentation (README.md)
    router.get("/docs", async (req, res) => {
        try {
            const readmePath = path.resolve(process.cwd(), "README.md");
            const content = await fs.readFile(readmePath, "utf-8");
            res.json({ content });
        } catch {
            res.status(404).json({ error: "README.md not found" });
        }
    });

    this.app.use("/api", router);

    // Static Serving (Standard Vite Dist)
    if (!this.options.disableStatic) {
       const distPath = process.env.DIST_PATH || path.resolve(process.cwd(), "dist");
       this.app.use(express.static(distPath));
       
       // SPA Fallback
       this.app.get("*", (req, res, next) => {
         if (req.path.startsWith("/api")) return next();
         const indexPath = path.join(distPath, "index.html");
         res.sendFile(indexPath, (err) => {
           if (err) {
             res.status(404).send("Frontend assets not found. If this is dev mode, check your static path.");
           }
         });
       });
    }
  }

  public listen(port: number | string, callback?: () => void) {
    this.port = port;
    this.app.listen(port, () => {
      this.log(`🚀 ${this.options.appName} running on port ${port}`);
      if (callback) callback();
    });
  }
}

export function createApp(options: AppKitOptions) {
  return new AppKit(options);
}

