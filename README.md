# @mchen-lab/app-kit

A standardized Node-centric application shell for the workspace fleet.

## Purpose
Provides a consistent foundation for web services, handling:
- Configuration Management (Loader, Defaults, Auto-hydration)
- Express Server Setup (CORS, JSON, Logging)
- Static File Serving (Frontend hosting)
- Standardization (API routes, logging format)

## Usage

### Backend
```typescript
import { createApp, AppKit } from "@mchen-lab/app-kit/backend";

const appKit = createApp({
  appName: "My Service",
  defaultConfig: { ... }
});

// AppKit handles loading config from 'data/settings.json' or env vars
const app = appKit.app; // Express instance

app.listen(3000);
```

## Development
- `npm run build`: Compile TypeScript
- `npm pack`: Create tarball for local consumption
