# Changelog

All notable changes to the `@mchen-lab/app-kit` project will be documented in this file.

## [0.1.11] - 2026-01-31

### Changed
- Migrated default CI runner from `ubuntu-latest` to `self-hosted` in managed templates.

## [0.1.10] - 2026-01-31

### Changed
- Refactored `release.sh` template to follow a **CI-only publishing model**. Production images are now built and published exclusively by GitHub Actions for improved trust and security.

## [0.1.9] - 2026-01-31

### Fixed
- Fixed `release.sh` template to correctly handle Docker builds by delegating to `build_and_publish.sh`. This resolves "invalid name -builder" errors caused by missing environment variables.

## [0.1.8] - 2026-01-31

### Added
- Automatic `package-lock.json` integrity hash refresh in the `update` command.
- CLI now runs `npm install` on the local tarball after synchronization to prevent CI failures.

## [0.1.7] - 2026-01-31

### Added
- Redesigned `Layout` component with mobile-responsive two-tier header.
- Secondary action bar slot for service-specific control buttons.
- Full-width content container support in the main layout.
- Improved logo handling with automatic fallback to title initial.

## [0.1.6] - 2026-01-30

### Added
- Standardized `LOGS_DIR` support in the backend core.
- Automatic creation of data and log directories during initialization.
- Persistent file logging (`app.log`) in the project templates.
- Support for `LOGS_DIR` and `DATA_DIR` in the managed Dockerfile template.
- Standardized open-source boilerplate files (LICENSE, CONTRIBUTING.md, etc.).

## [0.1.5] - 2026-01-29

### Added
- Configuration merging priority: Default < Environment Variables < UI Configuration.
- Support for `<br>` tags in Markdown tables with HTML sanitization.
- Automatic generation of `README.md` and `CHANGELOG.md` templates for new projects.

## [0.1.0] - 2026-01-18

### Added
- Initial release of the fleet application shell.
- Scaffolding engine with `create` and `update` commands.
- Unified Express server with Vite HMR integration.
- Standard UI components (Layout, AboutDialog, ConfigDialog).
