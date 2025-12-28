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
    console.error('❌ Error reading vercel.json:', error);
    process.exit(1);
}

// Check if placeholder still exists in config
const hasPlaceholder = JSON.stringify(vercelConfig).includes('YOUR_SERVER_URL_HERE');

// If API_URL is set and not empty/relative, replace the placeholder
if (apiUrl && apiUrl !== '' && apiUrl !== 'proxy' && apiUrl !== 'relative') {
    // Normalize API URL (remove trailing slash, ensure it has protocol)
    let normalizedUrl = apiUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
    }
    normalizedUrl = normalizedUrl.replace(/\/$/, '');

    // Validate URL format
    try {
        new URL(normalizedUrl);
    } catch (error) {
        console.error(`❌ Invalid API_URL format: ${apiUrl}`);
        console.error('   API_URL must be a valid URL (e.g., https://api.example.com)');
        process.exit(1);
    }

    // Replace placeholder in all rewrite destinations
    if (vercelConfig.rewrites && Array.isArray(vercelConfig.rewrites)) {
        let replaced = false;
        vercelConfig.rewrites.forEach((rewrite) => {
            if (rewrite.destination && typeof rewrite.destination === 'string') {
                if (rewrite.destination.includes('YOUR_SERVER_URL_HERE')) {
                    rewrite.destination = rewrite.destination.replace(
                        'https://YOUR_SERVER_URL_HERE',
                        normalizedUrl
                    );
                    replaced = true;
                }
            }
        });

        if (!replaced) {
            console.log('⚠️  No placeholder found to replace (may have already been replaced)');
        }
    }

    // Write updated vercel.json
    fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 4));
    console.log(`✅ Updated vercel.json with API_URL: ${normalizedUrl}`);
    
    // Verify replacement worked
    const verifyConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    const stillHasPlaceholder = JSON.stringify(verifyConfig).includes('YOUR_SERVER_URL_HERE');
    if (stillHasPlaceholder) {
        console.error('❌ ERROR: Placeholder still exists after replacement!');
        console.error('   This will cause 502 errors. Please check the script.');
        process.exit(1);
    }
} else {
    // API_URL not set or using relative mode
    if (hasPlaceholder) {
        console.error('❌ ERROR: API_URL environment variable is not set!');
        console.error('');
        console.error('   The vercel.json still contains the placeholder "YOUR_SERVER_URL_HERE"');
        console.error('   This will cause 502 Bad Gateway errors when the proxy tries to forward requests.');
        console.error('');
        console.error('   Solution: Set API_URL in Vercel environment variables:');
        console.error('   1. Go to Vercel Dashboard → Project Settings → Environment Variables');
        console.error('   2. Add API_URL with your server URL (e.g., https://api.staging.sipoker.com)');
        console.error('   3. Redeploy');
        console.error('');
        console.error('   OR if you want to use relative paths (no proxy), set:');
        console.error('   API_URL= (empty string) or API_URL=proxy');
        console.error('');
        process.exit(1);
    } else {
        console.log('ℹ️  API_URL not set - using relative paths (no proxy)');
        console.log('   If you need proxy, set API_URL to your server URL');
    }
}

