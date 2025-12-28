#!/usr/bin/env node

/**
 * Build script to replace API_URL placeholder in vercel.json
 * This allows us to use environment variables in vercel.json rewrites
 */

const fs = require('fs');
const path = require('path');

const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');
const apiUrl = process.env.API_URL;

// Read vercel.json
let vercelConfig;
try {
    vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
} catch (error) {
    console.error('Error reading vercel.json:', error);
    process.exit(1);
}

// If API_URL is set and not empty/relative, replace the placeholder
if (apiUrl && apiUrl !== '' && apiUrl !== 'proxy' && apiUrl !== 'relative') {
    // Normalize API URL (remove trailing slash, ensure it has protocol)
    let normalizedUrl = apiUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
    }
    normalizedUrl = normalizedUrl.replace(/\/$/, '');

    // Replace placeholder in all rewrite destinations
    if (vercelConfig.rewrites && Array.isArray(vercelConfig.rewrites)) {
        vercelConfig.rewrites.forEach((rewrite) => {
            if (rewrite.destination && typeof rewrite.destination === 'string') {
                rewrite.destination = rewrite.destination.replace(
                    'https://YOUR_SERVER_URL_HERE',
                    normalizedUrl
                );
            }
        });
    }

    // Write updated vercel.json
    fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 4));
    console.log(`✅ Updated vercel.json with API_URL: ${normalizedUrl}`);
} else {
    console.log('⚠️  API_URL not set or set to relative/proxy mode - keeping placeholder in vercel.json');
    console.log('   If using proxy mode, make sure to manually update vercel.json with your server URL');
}

