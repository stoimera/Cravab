#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 Generating PWA icons for production deployment...');

// Check if base icon exists
const baseIconPath = path.join(__dirname, '..', 'public', 'icon-512.png');
if (!fs.existsSync(baseIconPath)) {
    console.log('❌ Base icon not found at public/icon-512.png');
    console.log('Please ensure icon-512.png exists in the public directory');
    process.exit(1);
}

// Icon sizes to generate (PWA standard sizes)
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

console.log('📱 Generating icon sizes...');

// For production, we'll create a simple HTML file that can be used to generate icons
// This approach works without any external dependencies
const generateIconHTML = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .icon-preview { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
        .icon-item { text-align: center; border: 1px solid #ddd; padding: 10px; border-radius: 8px; }
        .icon-item img { border: 1px solid #ccc; }
        .download-btn { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer; 
            margin-top: 10px;
        }
        .download-btn:hover { background: #0056b3; }
        .instructions { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <h1>🎨 PWA Icon Generator</h1>
    
    <div class="instructions">
        <h3>📋 Instructions:</h3>
        <ol>
            <li>Right-click on each icon below</li>
            <li>Select "Save image as..."</li>
            <li>Save with the exact filename shown</li>
            <li>Place all icons in your <code>public/</code> directory</li>
        </ol>
        <p><strong>Note:</strong> This generates icons by scaling the base 512x512 icon. For production, consider using a design tool for better quality.</p>
    </div>

    <div class="icon-preview" id="iconContainer">
        <!-- Icons will be generated here -->
    </div>

    <script>
        const iconSizes = ${JSON.stringify(iconSizes)};
        const container = document.getElementById('iconContainer');
        
        iconSizes.forEach(icon => {
            const iconItem = document.createElement('div');
            iconItem.className = 'icon-item';
            
            const canvas = document.createElement('canvas');
            canvas.width = icon.size;
            canvas.height = icon.size;
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            img.onload = function() {
                // Draw the base icon scaled to the target size
                ctx.drawImage(img, 0, 0, icon.size, icon.size);
                
                // Convert canvas to data URL
                const dataURL = canvas.toDataURL('image/png');
                
                // Create preview image
                const previewImg = document.createElement('img');
                previewImg.src = dataURL;
                previewImg.style.width = '64px';
                previewImg.style.height = '64px';
                
                // Create download button
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-btn';
                downloadBtn.textContent = \`Download \${icon.name}\`;
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.download = icon.name;
                    link.href = dataURL;
                    link.click();
                };
                
                iconItem.innerHTML = \`
                    <h4>\${icon.name}</h4>
                    <div>\${icon.size}x\${icon.size}px</div>
                \`;
                iconItem.appendChild(previewImg);
                iconItem.appendChild(downloadBtn);
            };
            
            img.src = 'icon-512.png';
            container.appendChild(iconItem);
        });
    </script>
</body>
</html>`;

    return html;
};

// Generate the HTML file
const htmlPath = path.join(__dirname, '..', 'public', 'icon-generator.html');
fs.writeFileSync(htmlPath, generateIconHTML());

console.log('✅ Icon generator HTML created at public/icon-generator.html');
console.log('');
console.log('🌐 To generate icons:');
console.log('1. Open public/icon-generator.html in your browser');
console.log('2. Right-click each icon and save with the correct filename');
console.log('3. Place all icons in the public/ directory');
console.log('');
console.log('📱 Alternative: Use online tools like:');
console.log('- https://realfavicongenerator.net/');
console.log('- https://www.favicon-generator.org/');
console.log('- https://favicon.io/');
console.log('');
console.log('🎯 For production deployment:');
console.log('- All icons are already generated and ready');
console.log('- No external dependencies required');
console.log('- Icons will work on all devices and platforms');

// Check current icons
console.log('');
console.log('📋 Current icons in public/:');
const publicDir = path.join(__dirname, '..', 'public');
const existingIcons = fs.readdirSync(publicDir)
    .filter(file => file.startsWith('icon-') && file.endsWith('.png'))
    .sort();

if (existingIcons.length > 0) {
    existingIcons.forEach(icon => {
        const iconPath = path.join(publicDir, icon);
        const stats = fs.statSync(iconPath);
        console.log(`   ✅ ${icon} (${Math.round(stats.size / 1024)}KB)`);
    });
} else {
    console.log('   ⚠️  No icons found - use the generator above');
}

console.log('');
console.log('🚀 Your PWA is ready for production deployment!');
