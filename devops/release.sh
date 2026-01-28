#!/bin/bash
set -e

# =============================================================================
# Generic Release Script - Reads configuration from devops.config.json
# Part of @mchen-lab/app-kit DevOps Templates
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)" 2>/dev/null || PROJECT_ROOT="$PWD"

# Find config file (check current dir first, then script dir)
if [ -f "./devops.config.json" ]; then
    CONFIG_FILE="./devops.config.json"
elif [ -f "$PROJECT_ROOT/devops.config.json" ]; then
    CONFIG_FILE="$PROJECT_ROOT/devops.config.json"
else
    echo "❌ Error: devops.config.json not found"
    echo "   Create one based on the schema in app-kit/devops/"
    exit 1
fi

# Read config values using node
read_config() {
    node -p "require('$CONFIG_FILE').$1 || ''"
}

PROJECT_NAME=$(read_config "projectName")
PACKAGE_JSON_PATH=$(read_config "packageJsonPath")
PACKAGE_JSON_PATH="${PACKAGE_JSON_PATH:-.}"  # Default to current dir

# Help / Usage
if [ "$1" == "--help" ]; then
    echo "Usage: ./release.sh [patch|minor|major|<version>]"
    echo "       ./release.sh           # Re-release current version"
    echo ""
    echo "Project: $PROJECT_NAME"
    echo "Config:  $CONFIG_FILE"
    exit 0
fi

BUMP_TYPE=$1

echo "=== 🚀 Release Script for $PROJECT_NAME ==="
echo "Using config: $CONFIG_FILE"

# 1. Ensure git is clean
if [[ -n $(git status -s) ]]; then
    echo "❌ Error: Git working directory is not clean. Please commit or stash changes first."
    exit 1
fi

# 2. Ensure we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "❌ Error: You must be on the 'main' branch to release. Currently on '$CURRENT_BRANCH'."
    exit 1
fi

# 3. Ensure local main is up-to-date with remote
echo "🔄 Fetching latest from origin..."
git fetch origin main
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    echo "❌ Error: Local 'main' is not in sync with 'origin/main'."
    echo "   Local:  $LOCAL_COMMIT"
    echo "   Remote: $REMOTE_COMMIT"
    echo "   Please run 'git pull' or 'git push' first."
    exit 1
fi

# Determine package.json location
if [ "$PACKAGE_JSON_PATH" == "." ]; then
    PKG_JSON="./package.json"
    PKG_LOCK="./package-lock.json"
else
    PKG_JSON="$PACKAGE_JSON_PATH/package.json"
    PKG_LOCK="$PACKAGE_JSON_PATH/package-lock.json"
fi

if [ -z "$BUMP_TYPE" ]; then
    echo "=== 🚀 Re-Releasing Current Version ==="
    VERSION_NUM=$(node -p "require('$PKG_JSON').version")
    echo "ℹ️  Current version: $VERSION_NUM"
    FORCE_RE_RELEASE="true"
else
    echo "=== 🚀 Starting Release: $BUMP_TYPE ==="
    
    # Bump version
    if [ "$PACKAGE_JSON_PATH" != "." ]; then
        cd "$PACKAGE_JSON_PATH"
    fi
    NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version)
    if [ "$PACKAGE_JSON_PATH" != "." ]; then
        cd - > /dev/null
    fi
    VERSION_NUM=${NEW_VERSION#v}
    echo "📝 Bumped version to $VERSION_NUM"
fi

# 4. Git Commit and Tag
echo "📦 Committing and Tagging..."
git add "$PKG_JSON"
[ -f "$PKG_LOCK" ] && git add "$PKG_LOCK"

# Only commit if there are changes
if ! git diff-index --quiet HEAD; then
    git commit -m "chore: release v$VERSION_NUM" || echo "⚠️  Nothing to commit."
else
    echo "ℹ️  No changes to commit (version unchanged)."
fi

TAG_NAME="v$VERSION_NUM"

# If this is a re-release, purge the old tag to trigger CI
if [ "$FORCE_RE_RELEASE" = "true" ]; then
    echo "🔥 Re-release mode: Removing existing tag '$TAG_NAME' from remote and local..."
    git push origin --delete "$TAG_NAME" 2>/dev/null || echo "   (Remote tag didn't exist or failed to delete)"
    git tag -d "$TAG_NAME" 2>/dev/null || echo "   (Local tag didn't exist)"
fi

# Create tag
git tag -f -a "$TAG_NAME" -m "Release $TAG_NAME"

echo "✅ Created local tag: $TAG_NAME"

# 5. Push to Remote
echo "⬆️  Pushing to origin..."
git push origin main
git push origin "$TAG_NAME"

echo ""
echo "🎉 Release $TAG_NAME completed successfully!"
echo "   - $PKG_JSON updated"
echo "   - Git tag pushed (CI should trigger)"
