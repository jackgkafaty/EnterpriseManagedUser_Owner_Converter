#!/bin/bash

# Deployment script for GitHub Pages
echo "🚀 Building Enterprise Owner Management Tool..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run linting
echo "🔍 Running code quality checks..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Please fix the issues before deploying."
    exit 1
fi

# Build the project
echo "🏗️  Building for production..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Built files are in the 'dist' directory"
echo "🌐 Deploy by pushing to the main branch - GitHub Actions will handle the rest!"

# Optional: Start preview server
read -p "🔍 Would you like to preview the build locally? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Starting preview server..."
    npm run preview
fi
