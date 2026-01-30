#!/bin/bash
set -e

# app-kit release script
# Purpose: Build, Publish to NPM, and Tag in Git

# Help / Usage
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: ./release.sh [patch|minor|major|<version>]"
    echo "       ./release.sh           # Re-release current version"
    exit 0
fi

BUMP_TYPE=$1

# 1. Ensure git is clean
if [[ -n $(git status -s) ]]; then
    echo "❌ Error: Git working directory is not clean. Please commit or stash changes first."
    exit 1
fi

# 2. Build the project (ensures dist/ and libs/app-kit.tgz are fresh)
echo "🏗️  Building project..."
npm run build

if [ -z "$BUMP_TYPE" ]; then
    echo "=== 🚀 Re-Publishing Current Version ==="
    VERSION_NUM=$(node -p "require('./package.json').version")
    echo "ℹ️  Current version: $VERSION_NUM"
else
    echo "=== 🚀 Starting Release: $BUMP_TYPE ==="
    
    # Bump version
    NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version)
    VERSION_NUM=${NEW_VERSION#v}
    echo "📝 Bumped version to $VERSION_NUM"
fi

# 3. Publish to NPM
echo "📦 Publishing to NPM..."
# We use --access public because it's a scoped package
npm publish --access public

# 4. Git Commit and Tag
echo "📦 Committing and Tagging..."
git add package.json package-lock.json

# Only commit if there are changes
if ! git diff-index --quiet HEAD; then
    git commit -m "chore: release v$VERSION_NUM"
else
    echo "ℹ️  No changes to commit (version unchanged)."
fi

TAG_NAME="v$VERSION_NUM"

# Remove existing local tag if re-releasing
if [ -z "$BUMP_TYPE" ]; then
    git tag -d "$TAG_NAME" 2>/dev/null || true
fi

# Create tag
git tag -a "$TAG_NAME" -m "Release $TAG_NAME"
echo "✅ Created local tag: $TAG_NAME"

# 5. Push to Remote (Optional - uncomment if you have a remote set up)
if git remote | grep -q 'origin'; then
    echo "⬆️  Pushing to origin..."
    git push origin $(git branch --show-current)
    git push origin "$TAG_NAME"
else
    echo "⚠️  No git remote 'origin' found. Skipping push."
fi

echo ""
echo "🎉 Successfully published @mchen-lab/app-kit@$VERSION_NUM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
