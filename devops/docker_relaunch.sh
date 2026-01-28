#!/bin/bash
set -e

# =============================================================================
# Generic Docker Relaunch Script - Reads configuration from devops.config.json
# Part of @mchen-lab/app-kit DevOps Templates
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)" 2>/dev/null || PROJECT_ROOT="$PWD"

# Find config file
if [ -f "./devops.config.json" ]; then
    CONFIG_FILE="./devops.config.json"
elif [ -f "$PROJECT_ROOT/devops.config.json" ]; then
    CONFIG_FILE="$PROJECT_ROOT/devops.config.json"
else
    echo "❌ Error: devops.config.json not found"
    exit 1
fi

# Read config values using node
read_config() {
    node -p "require('$CONFIG_FILE').$1 || ''"
}

read_config_array() {
    node -p "JSON.stringify(require('$CONFIG_FILE').$1 || [])"
}

PROJECT_NAME=$(read_config "projectName")
GHCR_ORG=$(read_config "ghcrOrg")
IMAGE_NAME=$(read_config "imageName")
CONTAINER_NAME=$(read_config "containerName")
CONTAINER_NAME="${CONTAINER_NAME:-$IMAGE_NAME}"
VOLUME_NAME=$(read_config "volumeName")

# Parse ports from config
PORTS_JSON=$(read_config_array "ports")

TAG="dev"
DELETE_VOLUME=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --delete-volume)
      DELETE_VOLUME=true
      shift
      ;;
    --help)
      echo "Usage: ./docker_relaunch.sh [tag] [--delete-volume]"
      echo ""
      echo "Options:"
      echo "  tag              Docker image tag (default: dev)"
      echo "  --delete-volume  Delete the data volume before starting (DESTRUCTIVE)"
      echo ""
      echo "Project: $PROJECT_NAME"
      echo "Container: $CONTAINER_NAME"
      echo "Volume: $VOLUME_NAME"
      exit 0
      ;;
    *)
      TAG="$1"
      shift
      ;;
  esac
done

IMAGE="ghcr.io/$GHCR_ORG/$IMAGE_NAME:$TAG"

echo "=== 🐳 Relaunching $PROJECT_NAME ($TAG) ==="
echo "Image: $IMAGE"

if [ "$DELETE_VOLUME" = true ]; then
    echo "⚠️  WARNING: You have requested to delete the data volume '$VOLUME_NAME'."
    echo "   This will PERMANENTLY ERASE all data in the container."
    read -p "   Are you sure you want to continue? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted by user."
        exit 1
    fi
fi

echo "⬇️  Pulling image..."
docker pull "$IMAGE"

echo "🛑 Stopping existing container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || echo "   (No running container found)"

echo "🗑️  Removing existing container..."
docker rm "$CONTAINER_NAME" 2>/dev/null || echo "   (No container to remove)"

if [ "$DELETE_VOLUME" = true ] && [ -n "$VOLUME_NAME" ]; then
    echo "🔥 Deleting volume '$VOLUME_NAME'..."
    docker volume rm "$VOLUME_NAME" 2>/dev/null || echo "   (Volume did not exist)"
fi

# Build port mapping arguments from config
PORT_ARGS=""
if [ "$PORTS_JSON" != "[]" ]; then
    # Parse ports array - each item can be a number or object {host, container}
    PORT_ARGS=$(node -e "
        const ports = $PORTS_JSON;
        const args = ports.map(p => {
            if (typeof p === 'number') return '-p ' + p + ':' + p;
            if (typeof p === 'object') return '-p ' + p.host + ':' + p.container;
            return '';
        }).filter(Boolean).join(' ');
        console.log(args);
    ")
fi

# Build volume argument
VOLUME_ARG=""
if [ -n "$VOLUME_NAME" ]; then
    VOLUME_ARG="-v $VOLUME_NAME:/app/data"
fi

echo "▶️  Starting new container..."
eval "docker run -d --name \"$CONTAINER_NAME\" $PORT_ARGS $VOLUME_ARG \"$IMAGE\""

echo "✅ Container started!"
echo "   - Container: $CONTAINER_NAME"
echo "   - Tag: $TAG"
echo "   - Logs: docker logs -f $CONTAINER_NAME"
