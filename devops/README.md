# DevOps Templates

Reusable DevOps scripts for Docker-based projects in the workspace fleet.

## Quick Start

1. Create a `devops.config.json` in your project root:

```json
{
  "projectName": "My Service",
  "packageJsonPath": ".",
  "ghcrOrg": "mchen-lab",
  "dockerHubUser": "xychenmsn",
  "imageName": "my-service",
  "containerName": "my-service",
  "volumeName": "my_service_data",
  "ports": [3000, 8080]
}
```

2. Use the templates:

**Option A: Symlink (recommended for monorepos)**
```bash
ln -s ../app-kit/devops/release.sh ./release.sh
ln -s ../app-kit/devops/build_and_publish.sh ./build_and_publish.sh
ln -s ../app-kit/devops/docker_relaunch.sh ./docker_relaunch.sh
```

**Option B: Wrapper script**
```bash
#!/bin/bash
exec "$(dirname "$0")/../app-kit/devops/release.sh" "$@"
```

**Option C: Direct invocation**
```bash
../app-kit/devops/release.sh patch
```

## Scripts

### release.sh

Bump version, commit, tag, and push to trigger CI.

```bash
./release.sh patch    # Bump patch version (1.0.0 -> 1.0.1)
./release.sh minor    # Bump minor version (1.0.0 -> 1.1.0)
./release.sh major    # Bump major version (1.0.0 -> 2.0.0)
./release.sh          # Re-release current version (for CI retry)
```

### build_and_publish.sh

Build and push multi-platform Docker images.

```bash
./build_and_publish.sh dev      # Build with 'dev' tag
./build_and_publish.sh v1.2.3   # Build with semver tags (creates 1.2.3, 1.2, 1, latest)
```

### docker_relaunch.sh

Pull latest image and restart container.

```bash
./docker_relaunch.sh dev            # Relaunch with 'dev' tag
./docker_relaunch.sh latest         # Relaunch with 'latest' tag
./docker_relaunch.sh dev --delete-volume  # Clear data and restart
```

## Configuration Reference

See `devops.config.schema.json` for the full schema.

| Field | Required | Description |
|-------|----------|-------------|
| `projectName` | ✓ | Human-readable name for logs |
| `imageName` | ✓ | Docker image name |
| `packageJsonPath` | | Path to package.json (default: `.`) |
| `ghcrOrg` | | GitHub Container Registry org |
| `dockerHubUser` | | Docker Hub username |
| `containerName` | | Container name (default: imageName) |
| `volumeName` | | Data volume name |
| `ports` | | Port mappings array |

## CI/CD Template

Copy `ci-template.yml` to your project's `.github/workflows/ci.yml` and customize the repository variables:

- `vars.GHCR_ORG` - GitHub Container Registry organization
- `vars.DOCKERHUB_USER` - Docker Hub username
- `vars.IMAGE_NAME` - Image name
- `secrets.DOCKER_USERNAME` - Docker Hub username (for push)
- `secrets.DOCKER_PASSWORD` - Docker Hub password/token
- `secrets.GHCR_PAT` - GitHub PAT for GHCR
