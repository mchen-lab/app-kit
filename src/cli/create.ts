import fs from "fs/promises";
import path from "path";
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
  const userFiles = [
    { src: "user/server-index.ts", dest: "src/server/index.ts" },
    { src: "user/devops.config.json", dest: "devops.config.json" },
    { src: "user/package.json", dest: "package.json" },
    { src: "user/gitignore", dest: ".gitignore" },
    { src: "user/src/frontend/index.html", dest: "src/frontend/index.html" },
    { src: "user/src/frontend/main.ts", dest: "src/frontend/main.ts" },
    { src: "user/src/frontend/app.ts", dest: "src/frontend/app.ts" },
    { src: "user/src/frontend/styles.css", dest: "src/frontend/styles.css" },
    { src: "user/README.md", dest: "README.md" },
    { src: "user/CHANGELOG.md", dest: "CHANGELOG.md" },
  ];

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

  // Create data directory
  await ensureDir(path.join(projectDir, "data"));
  console.log(`✓ Created data/`);

  // Print next steps
  console.log(`
✅ Project created successfully!

Next steps:
  cd ${projectName}
  
  # Copy app-kit package
  cd ../app-kit && npm run build && npm pack
  mv mchen-lab-app-kit-*.tgz ../${projectName}/libs/app-kit.tgz
  cd ../${projectName}
  
  # Install dependencies
  npm install
  
  # Start development
  npm run dev:server

To update managed files later:
  npx @mchen-lab/app-kit update
`);
}
