#!/bin/bash
set -e

# =============================================================================
# Generic Docker Build & Publish Script - Reads configuration from devops.config.json
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

PROJECT_NAME=$(read_config "projectName")
GHCR_ORG=$(read_config "ghcrOrg")
DOCKERHUB_USER=$(read_config "dockerHubUser")
IMAGE_NAME=$(read_config "imageName")
BUILDER_NAME=$(read_config "builderName")
BUILDER_NAME="${BUILDER_NAME:-${IMAGE_NAME}-builder}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running or not accessible."
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Image names
GHCR_IMAGE="ghcr.io/$GHCR_ORG/$IMAGE_NAME"
DOCKERHUB_IMAGE="$DOCKERHUB_USER/$IMAGE_NAME"
INPUT_TAG="${1:-dev}"

# Help
if [ "$1" == "--help" ]; then
    echo "Usage: ./build_and_publish.sh [tag]"
    echo "       ./build_and_publish.sh dev       # Build with 'dev' tag"
    echo "       ./build_and_publish.sh v1.2.3    # Build with semver tags (v1.2.3, 1.2, 1, latest)"
    echo ""
    echo "Project: $PROJECT_NAME"
    echo "Images:  $GHCR_IMAGE, $DOCKERHUB_IMAGE"
    exit 0
fi

# Tag logic
TAGS=""
add_tag() {
    local tag=$1
    TAGS="$TAGS -t $GHCR_IMAGE:$tag -t $DOCKERHUB_IMAGE:$tag"
}

if [[ "$INPUT_TAG" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    MAJOR="${BASH_REMATCH[1]}"
    MINOR="${BASH_REMATCH[2]}"
    PATCH="${BASH_REMATCH[3]}"
    VERSION="$MAJOR.$MINOR.$PATCH"
    
    echo "Detected version tag: v$VERSION"
    add_tag "$VERSION"
    add_tag "$MAJOR.$MINOR"
    add_tag "$MAJOR"
    add_tag "latest"
else
    add_tag "$INPUT_TAG"
fi

echo "=== 🐳 Building $PROJECT_NAME ==="
echo "Tags to push:"
echo "$TAGS" | sed 's/-t //g' | tr ' ' '\n'

# Setup buildx
echo "Checking for Docker Buildx..."
if ! docker buildx inspect "$BUILDER_NAME" > /dev/null 2>&1; then
    echo "Creating new buildx builder..."
    docker buildx create --name "$BUILDER_NAME" --use
    docker buildx inspect --bootstrap
else
    echo "Using existing buildx builder."
    docker buildx use "$BUILDER_NAME"
fi

echo "Building and pushing multi-platform image..."
echo "Platforms: linux/amd64, linux/arm64"

# Generate build metadata
BUILD_META="-dev-$(date +%Y%m%d)"
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "Build Metadata: $BUILD_META"
echo "Commit Hash: $COMMIT_HASH"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg BUILD_METADATA="$BUILD_META" \
  --build-arg GIT_COMMIT="$COMMIT_HASH" \
  $TAGS \
  --push \
  .

echo ""
echo "✅ Build and publish completed successfully!"
echo "   Images pushed with tags derived from: $INPUT_TAG"
