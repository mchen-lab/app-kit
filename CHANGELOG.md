# Changelog

All notable changes to the `@mchen-lab/app-kit` project will be documented in this file.

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
