#!/usr/bin/env node

/**
 * Simple iOS PWA asset generator
 * Creates basic Apple touch icons and splash screens using existing assets
 */

const fs = require('fs');
const path = require('path');

// Copy existing icons to create Apple touch icons
const appleTouchIconSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180];

// iOS splash screen sizes (width x height)
const splashSizes = [
  { width: 2048, height: 2732, name: 'splash-2048x2732.png' }, // iPad Pro 12.9"
  { width: 1668, height: 2388, name: 'splash-1668x2388.png' }, // iPad Pro 11"
  { width: 1536, height: 2048, name: 'splash-1536x2048.png' }, // iPad
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' }, // iPhone X/XS/11 Pro
  { width: 1242, height: 2688, name: 'splash-1242x2688.png' }, // iPhone XR/11
  { width: 750, height: 1334, name: 'splash-750x1334.png' },   // iPhone 6/7/8
  { width: 640, height: 1136, name: 'splash-640x1136.png' },   // iPhone 5/SE
];

function copyIconForSize(size) {
  const sourceIcon = path.join(__dirname, '../public/icon-192.png');
  const targetIcon = path.join(__dirname, `../public/apple-touch-icon-${size}x${size}.png`);
  
  if (fs.existsSync(sourceIcon)) {
    fs.copyFileSync(sourceIcon, targetIcon);
    console.log(`✅ Created apple-touch-icon-${size}x${size}.png`);
    return true;
  } else {
    console.log(`⚠️  Source icon not found, skipping apple-touch-icon-${size}x${size}.png`);
    return false;
  }
}

function createSplashScreen(splash) {
  // Create a simple HTML splash screen that will be converted to PNG
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cravab</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: ${splash.width}px;
      height: ${splash.height}px;
      background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
    }
    .icon {
      width: ${Math.min(splash.width, splash.height) * 0.2}px;
      height: ${Math.min(splash.width, splash.height) * 0.2}px;
      background: white;
      border-radius: ${Math.min(splash.width, splash.height) * 0.02}px;
      margin-bottom: ${splash.height * 0.05}px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${Math.min(splash.width, splash.height) * 0.1}px;
      color: #2563eb;
      font-weight: bold;
    }
    .title {
      font-size: ${splash.height * 0.05}px;
      font-weight: bold;
      margin-bottom: ${splash.height * 0.02}px;
    }
    .subtitle {
      font-size: ${splash.height * 0.03}px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="icon">V</div>
  <div class="title">Cravab</div>
  <div class="subtitle">Service Business Management Platform</div>
</body>
</html>`;
  
  const htmlPath = path.join(__dirname, `../public/${splash.name.replace('.png', '.html')}`);
  fs.writeFileSync(htmlPath, html);
  
  console.log(`✅ Created ${splash.name.replace('.png', '.html')} (convert to PNG manually)`);
  return true;
}

function generateBrowserConfig() {
  const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square70x70logo src="/icon-72.png"/>
            <square150x150logo src="/icon-152.png"/>
            <square310x310logo src="/icon-512.png"/>
            <TileColor>#2563eb</TileColor>
        </tile>
    </msapplication>
</browserconfig>`;
  
  const outputPath = path.join(__dirname, '../public/browserconfig.xml');
  fs.writeFileSync(outputPath, browserConfig);
  
  console.log('✅ Generated browserconfig.xml');
  return true;
}

function createPlaceholderSplashImages() {
  // Create simple placeholder splash screens using CSS
  const splashDir = path.join(__dirname, '../public/splash-screens');
  if (!fs.existsSync(splashDir)) {
    fs.mkdirSync(splashDir, { recursive: true });
  }
  
  splashSizes.forEach(splash => {
    const css = `
/* ${splash.name} */
@media (device-width: ${splash.width}px) and (device-height: ${splash.height}px) and (-webkit-device-pixel-ratio: 2) {
  .splash-screen {
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .splash-icon {
    width: 120px;
    height: 120px;
    background: white;
    border-radius: 20px;
    margin-bottom: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60px;
    color: #2563eb;
    font-weight: bold;
  }
  .splash-title {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  .splash-subtitle {
    font-size: 18px;
    opacity: 0.8;
  }
}`;
    
    const cssPath = path.join(splashDir, `${splash.name.replace('.png', '.css')}`);
    fs.writeFileSync(cssPath, css);
  });
  
  console.log('✅ Created splash screen CSS files');
  return true;
}

async function main() {
  console.log('🚀 Starting simple iOS PWA asset generation...\n');
  
  try {
    // Create Apple touch icons
    console.log('📱 Creating Apple touch icons...');
    const iconResults = appleTouchIconSizes.map(size => copyIconForSize(size));
    const iconSuccess = iconResults.some(result => result === true);
    
    if (!iconSuccess) {
      console.log('⚠️  No source icon found. Please ensure /public/icon-192.png exists');
    }
    
    // Create splash screens
    console.log('\n🖼️  Creating splash screens...');
    const splashResults = splashSizes.map(splash => createSplashScreen(splash));
    const splashSuccess = splashResults.every(result => result === true);
    
    // Create browser config
    console.log('\n🌐 Creating browser config...');
    const configSuccess = generateBrowserConfig();
    
    // Create CSS splash screens
    console.log('\n🎨 Creating CSS splash screens...');
    const cssSuccess = createPlaceholderSplashImages();
    
    console.log('\n📋 Next Steps:');
    console.log('1. Convert HTML splash screens to PNG images');
    console.log('2. Use an online tool like https://htmlcsstoimage.com/');
    console.log('3. Or use the canvas-based generator: node scripts/generate-ios-assets.js');
    console.log('4. Test the PWA on iOS Safari');
    console.log('5. Add to home screen to verify installation');
    
    console.log('\n🎉 Basic iOS PWA assets generated!');
    console.log('\nFor production, consider:');
    console.log('- Using proper PNG splash screens');
    console.log('- Testing on actual iOS devices');
    console.log('- Optimizing for different screen sizes');
    
  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  copyIconForSize,
  createSplashScreen,
  generateBrowserConfig,
  createPlaceholderSplashImages
};
