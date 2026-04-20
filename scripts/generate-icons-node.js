#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('[START] Generating PWA icons for Cravab...');

// Check if base icon exists
const baseIconPath = path.join(__dirname, '..', 'public', 'icon-512.png');
if (!fs.existsSync(baseIconPath)) {
    console.log('[ERROR] Base icon not found at public/icon-512.png');
    console.log('Please ensure icon-512.png exists in the public directory');
    process.exit(1);
}

// Icon sizes to generate
const iconSizes = [
    { size: 72, name: 'icon-72.png' },
    { size: 96, name: 'icon-96.png' },
    { size: 128, name: 'icon-128.png' },
    { size: 144, name: 'icon-144.png' },
    { size: 152, name: 'icon-152.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 384, name: 'icon-384.png' },
    { size: 512, name: 'icon-512.png' }
];

console.log('[INFO] Generating icon sizes...');

// For now, we'll just copy the base icon to all sizes
// In a real implementation, you'd use a library like sharp or jimp to resize
let generatedCount = 0;
let skippedCount = 0;

iconSizes.forEach(icon => {
    const outputPath = path.join(__dirname, '..', 'public', icon.name);
    
    // Skip if icon already exists
    if (fs.existsSync(outputPath)) {
        console.log(`[SKIP] Skipping ${icon.name} (already exists)`);
        skippedCount++;
        return;
    }
    
    try {
        // Copy the base icon to the new size
        // Note: This is a placeholder - in production you'd resize the image
        fs.copyFileSync(baseIconPath, outputPath);
        console.log(`[SUCCESS] Generated ${icon.name} (${icon.size}x${icon.size})`);
        generatedCount++;
    } catch (error) {
        console.log(`[ERROR] Failed to generate ${icon.name}: ${error.message}`);
    }
});

console.log('');
console.log('[COMPLETE] Icon generation completed!');
console.log(`[STATS] Generated: ${generatedCount}, Skipped: ${skippedCount}`);
console.log('[INFO] Your PWA is now ready for installation on all devices');
console.log('');
console.log('[LIST] Generated icons:');

// List all generated icons
const publicDir = path.join(__dirname, '..', 'public');
fs.readdirSync(publicDir)
    .filter(file => file.startsWith('icon-') && file.endsWith('.png'))
    .sort()
    .forEach(file => {
        console.log(`   ${file}`);
    });

console.log('');
console.log('[NOTE] Icons are currently copies of the base icon.');
console.log('[NOTE] For production, install ImageMagick and use the PowerShell script for proper resizing.');
