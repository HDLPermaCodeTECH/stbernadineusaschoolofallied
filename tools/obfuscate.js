const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

/**
 * This script obfuscates the main script.js file to protect it from being easily copied.
 * Usage: node tools/obfuscate.js
 */

const inputPath = path.join(__dirname, '../asset/script.js');
const outputPath = path.join(__dirname, '../asset/script.obfuscated.js');

try {
    console.log('Reading script.js...');
    const code = fs.readFileSync(inputPath, 'utf8');

    console.log('Obfuscating... (this may take a few seconds)');
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 2000,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayCallsTransformThreshold: 0.75,
        stringArrayEncoding: ['base64'],
        stringArrayIndicesRestructuring: true,
        stringArrayObjectLookup: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
    }).getObfuscatedCode();

    fs.writeFileSync(outputPath, obfuscatedCode);
    console.log('SUCCESS: script.obfuscated.js created in the asset folder.');
    console.log('To use it, update your HTML files to point to script.obfuscated.js instead of script.js.');
} catch (error) {
    console.error('ERROR during obfuscation:', error.message);
}
