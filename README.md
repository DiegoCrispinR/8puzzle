# 8-Puzzle Game

A creative and minimalist implementation of the classic 8-puzzle sliding game with a scoreboard.

## Project Structure

- `/public` - Contains all static assets for deployment
  - `index.html` - Main HTML file
  - `styles.css` - CSS styles
  - `script.js` - Game logic
  - `favicon.svg` - Vector favicon
  - `favicon.ico` - Fallback favicon
  - `manifest.json` - Web app manifest

## Deployment

This project is configured for deployment on Netlify. The `netlify.toml` file specifies that the `public` directory should be used as the publish directory.

## Features

- Minimalist design with green, white, and black color palette
- Weekly updating scoreboard
- Shuffle and solve functionality
- Google AdSense integration
- Security measures including CSP and input sanitization
\`\`\`

Let's also create a simple build script to help with deployment:
