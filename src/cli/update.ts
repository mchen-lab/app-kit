import fs from "fs/promises";
import path from "path";
import {
  getTemplatesDir,
  getAppKitVersion,
  generateHeader,
  getFileType,
  processTemplate,
  isManagedFile,
  ensureDir,
  MANAGED_FILES,
} from "./utils.js";

export interface UpdateOptions {
  dryRun: boolean;
  force: boolean;
}

export async function updateProject(options: UpdateOptions): Promise<void> {
  const projectDir = process.cwd();
  const templatesDir = getTemplatesDir();
  const version = await getAppKitVersion();

  console.log(`\n🔄 Updating managed files to app-kit v${version}\n`);

  if (options.dryRun) {
    console.log("(Dry run - no files will be modified)\n");
  }

  // Check if this is an app-kit project
  const devopsConfigPath = path.join(projectDir, "devops.config.json");
  try {
    await fs.access(devopsConfigPath);
  } catch {
    console.error("❌ Error: devops.config.json not found");
    console.error("   This doesn't appear to be an app-kit project.");
    console.error("   Run this command from a project created with `app-kit create`");
    process.exit(1);
  }

  // Read devops.config.json for template variables
  let devopsConfig: Record<string, any> = {};
  try {
    const content = await fs.readFile(devopsConfigPath, "utf-8");
    devopsConfig = JSON.parse(content);
  } catch {
    console.warn("⚠ Could not parse devops.config.json, using defaults");
  }

  // Template variables
  const projectName = devopsConfig.projectName || path.basename(projectDir);
  const variables: Record<string, string> = {
    PROJECT_NAME: devopsConfig.imageName || projectName.toLowerCase().replace(/\s+/g, "-"),
    PROJECT_NAME_SNAKE: (devopsConfig.imageName || projectName).replace(/-/g, "_"),
    PROJECT_NAME_TITLE: projectName,
    PORT: String(devopsConfig.ports?.[0] || 3000),
    VERSION: version,
  };

  let updated = 0;
  let skipped = 0;
  let created = 0;

  for (const file of MANAGED_FILES) {
    const templatePath = path.join(templatesDir, "managed", file);
    const destPath = path.join(projectDir, file);

    try {
      // Check if template exists
      await fs.access(templatePath);
    } catch {
      console.log(`⚠ Template not found: ${file}`);
      continue;
    }

    // Check if destination exists
    let destExists = false;
    try {
      await fs.access(destPath);
      destExists = true;
    } catch {
      // File doesn't exist
    }

    // If file exists and not managed, skip unless forced
    if (destExists && !options.force) {
      const isManaged = await isManagedFile(destPath);
      if (!isManaged) {
        console.log(`⚠ Skipped ${file} (not a managed file, use --force to overwrite)`);
        skipped++;
        continue;
      }
    }

    // Generate new content
    let content = await fs.readFile(templatePath, "utf-8");
    content = processTemplate(content, variables);

    const fileType = getFileType(file);
    const header = generateHeader(fileType, version);
    content = header + content;

    if (options.dryRun) {
      if (destExists) {
        console.log(`Would update: ${file}`);
      } else {
        console.log(`Would create: ${file}`);
      }
    } else {
      await ensureDir(path.dirname(destPath));
      await fs.writeFile(destPath, content);

      // Make shell scripts executable
      if (file.endsWith(".sh")) {
        await fs.chmod(destPath, 0o755);
      }

      if (destExists) {
        console.log(`✓ Updated ${file}`);
        updated++;
      } else {
        console.log(`✓ Created ${file}`);
        created++;
      }
    }
  }

  console.log(`
Summary:
  Updated: ${updated}
  Created: ${created}
  Skipped: ${skipped}
`);

  if (options.dryRun) {
    console.log("Run without --dry-run to apply changes.");
  }
}
