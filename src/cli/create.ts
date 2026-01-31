import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import {
  getTemplatesDir,
  getAppKitVersion,
  generateHeader,
  getFileType,
  processTemplate,
  ensureDir,
  MANAGED_FILES,
} from "./utils.js";

export interface CreateOptions {
  port: number;
  withFrontend: boolean;
  react: boolean;
}

export async function createProject(
  projectName: string,
  options: CreateOptions
): Promise<void> {
  const projectDir = path.resolve(process.cwd(), projectName);
  const templatesDir = getTemplatesDir();
  const version = await getAppKitVersion();

  console.log(`\n🚀 Creating new app-kit project: ${projectName}\n`);

  // Check if directory exists
  try {
    await fs.access(projectDir);
    console.error(`❌ Error: Directory "${projectName}" already exists`);
    process.exit(1);
  } catch {
    // Directory doesn't exist, good to proceed
  }

  // Create project directory
  await ensureDir(projectDir);
  console.log(`✓ Created ${projectName}/`);

  // Template variables
  const variables: Record<string, string> = {
    PROJECT_NAME: projectName,
    PROJECT_NAME_SNAKE: projectName.replace(/-/g, "_"),
    PROJECT_NAME_TITLE: projectName
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    PORT: String(options.port),
    VERSION: version,
  };

  // Copy managed files (with headers)
  for (const file of MANAGED_FILES) {
    const templatePath = path.join(templatesDir, "managed", file);
    const destPath = path.join(projectDir, file);

    try {
      let content = await fs.readFile(templatePath, "utf-8");
      content = processTemplate(content, variables);

      // Add header for managed files
      const fileType = getFileType(file);
      const header = generateHeader(fileType, version);
      content = header + content;

      await ensureDir(path.dirname(destPath));
      await fs.writeFile(destPath, content);

      // Make shell scripts executable
      if (file.endsWith(".sh")) {
        await fs.chmod(destPath, 0o755);
      }

      console.log(`✓ Created ${file} (managed)`);
    } catch (err) {
      console.warn(`⚠ Skipped ${file}: template not found`);
    }
  }

  // Copy user-owned files (no headers)
  const userFiles: Array<{ src: string; dest: string }> = [
    { src: "user/server-index.ts", dest: "src/server/index.ts" },
    { src: "user/devops.config.json", dest: "devops.config.json" },
    { src: options.react ? "user/package.react.json" : "user/package.json", dest: "package.json" },
    { src: "user/gitignore", dest: ".gitignore" },
    { src: "user/README.md", dest: "README.md" },
    { src: "user/CHANGELOG.md", dest: "CHANGELOG.md" },
    { src: "user/LICENSE", dest: "LICENSE" },
    { src: "user/CONTRIBUTING.md", dest: "CONTRIBUTING.md" },
    { src: "user/CODE_OF_CONDUCT.md", dest: "CODE_OF_CONDUCT.md" },
    { src: "user/SECURITY.md", dest: "SECURITY.md" },
    { src: "user/vitest.config.ts", dest: "vitest.config.ts" },
  ];

  if (options.withFrontend) {
    if (options.react) {
      userFiles.push(
        // Main frontend files
        { src: "user/src/frontend-react/index.html", dest: "src/frontend/index.html" },
        { src: "user/src/frontend-react/main.tsx", dest: "src/frontend/main.tsx" },
        { src: "user/src/frontend-react/App.tsx", dest: "src/frontend/App.tsx" },
        { src: "user/src/frontend-react/styles.css", dest: "src/frontend/styles.css" },
        
        // Lib utilities
        { src: "user/src/frontend-react/lib/utils.ts", dest: "src/frontend/lib/utils.ts" },
        
        // App-level components
        { src: "user/src/frontend-react/components/VersionBanner.tsx", dest: "src/frontend/components/VersionBanner.tsx" },
        { src: "user/src/frontend-react/components/AboutDialog.tsx", dest: "src/frontend/components/AboutDialog.tsx" },
        { src: "user/src/frontend-react/components/ConfigDialog.tsx", dest: "src/frontend/components/ConfigDialog.tsx" },
        { src: "user/src/frontend-react/components/Layout.tsx", dest: "src/frontend/components/Layout.tsx" },
        { src: "user/src/frontend-react/components/StatusCard.tsx", dest: "src/frontend/components/StatusCard.tsx" },
        { src: "user/src/frontend-react/components/LogViewer.tsx", dest: "src/frontend/components/LogViewer.tsx" },
        
        // UI primitives (shadcn/radix-ui style)
        { src: "user/src/frontend-react/components/ui/alert-dialog.tsx", dest: "src/frontend/components/ui/alert-dialog.tsx" },
        { src: "user/src/frontend-react/components/ui/badge.tsx", dest: "src/frontend/components/ui/badge.tsx" },
        { src: "user/src/frontend-react/components/ui/button.tsx", dest: "src/frontend/components/ui/button.tsx" },
        { src: "user/src/frontend-react/components/ui/card.tsx", dest: "src/frontend/components/ui/card.tsx" },
        { src: "user/src/frontend-react/components/ui/dialog.tsx", dest: "src/frontend/components/ui/dialog.tsx" },
        { src: "user/src/frontend-react/components/ui/input.tsx", dest: "src/frontend/components/ui/input.tsx" },
        { src: "user/src/frontend-react/components/ui/label.tsx", dest: "src/frontend/components/ui/label.tsx" },
        { src: "user/src/frontend-react/components/ui/scroll-area.tsx", dest: "src/frontend/components/ui/scroll-area.tsx" },
        { src: "user/src/frontend-react/components/ui/select.tsx", dest: "src/frontend/components/ui/select.tsx" },
        { src: "user/src/frontend-react/components/ui/sonner.tsx", dest: "src/frontend/components/ui/sonner.tsx" },
        { src: "user/src/frontend-react/components/ui/tabs.tsx", dest: "src/frontend/components/ui/tabs.tsx" },
        { src: "user/src/frontend-react/components/ui/textarea.tsx", dest: "src/frontend/components/ui/textarea.tsx" }
      );
    } else {
      userFiles.push(
        { src: "user/src/frontend/index.html", dest: "src/frontend/index.html" },
        { src: "user/src/frontend/main.ts", dest: "src/frontend/main.ts" },
        { src: "user/src/frontend/app.ts", dest: "src/frontend/app.ts" },
        { src: "user/src/frontend/styles.css", dest: "src/frontend/styles.css" }
      );
    }
  }

  for (const { src, dest } of userFiles) {
    const templatePath = path.join(templatesDir, src);
    const destPath = path.join(projectDir, dest);

    try {
      let content = await fs.readFile(templatePath, "utf-8");
      content = processTemplate(content, variables);

      await ensureDir(path.dirname(destPath));
      await fs.writeFile(destPath, content);
      console.log(`✓ Created ${dest}`);
    } catch (err) {
      console.warn(`⚠ Skipped ${dest}: template not found`);
    }
  }

  // Create libs directory for app-kit
  await ensureDir(path.join(projectDir, "libs"));
  console.log(`✓ Created libs/`);

  // Provision the library
  try {
    const libSource = path.resolve(templatesDir, "../libs/app-kit.tgz");
    const libDest = path.join(projectDir, "libs/app-kit.tgz");
    
    let sourced = false;
    if (await fs.stat(libSource).then(() => true).catch(() => false)) {
      await fs.copyFile(libSource, libDest);
      console.log(`✓ Provisioned @mchen-lab/app-kit library`);
      sourced = true;
    } else {
      // Fallback: look in root for dev
      const rootLibSource = path.resolve(templatesDir, "../mchen-lab-app-kit-0.1.1.tgz");
      if (await fs.stat(rootLibSource).then(() => true).catch(() => false)) {
        await fs.copyFile(rootLibSource, libDest);
        console.log(`✓ Provisioned @mchen-lab/app-kit library (from root)`);
        sourced = true;
      }
    }
    
    if (!sourced) {
       console.warn(`⚠️  Warning: Library tarball not found at ${libSource}. Manual copy required.`);
    }
  } catch (e) {
    console.warn(`⚠️  Warning: Could not provision library: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Create data directory
  await ensureDir(path.join(projectDir, "data"));
  console.log(`✓ Created data/`);

  // Finalizing
  console.log("\n✅ Project created successfully!");

  try {
    execSync('git init', { cwd: projectDir, stdio: 'ignore' });
    console.log(`✓ Initialized git repository`);
  } catch (e) {
    // Ignore git init errors
  }

  // Print next steps
  console.log(`
Next steps:
  cd ${projectName}
  
  # Install dependencies
  npm install
  
  # Start development
  npm run dev

To update managed files later:
  npx @mchen-lab/app-kit update
`);
}
