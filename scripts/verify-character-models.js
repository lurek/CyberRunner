#!/usr/bin/env node

/**
 * Character Model Verification Script
 * Checks if all character models exist and are properly configured
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${COLORS.cyan}
╔════════════════════════════════════════════════════════════╗
║      🎮 CYBER RUNNER - CHARACTER MODEL VERIFICATION       ║
╚════════════════════════════════════════════════════════════╝
${COLORS.reset}`);

// Expected character models
const EXPECTED_MODELS = [
  {
    id: 'default',
    name: 'Main Runner',
    file: 'Main_Character.glb',
    cost: 0
  },
  {
    id: 'eve',
    name: 'Eve',
    file: 'Eve By J.Gonzales.glb',
    cost: 3500
  },
  {
    id: 'kachujin',
    name: 'Kachujin',
    file: 'Kachujin G Rosales.glb',
    cost: 5000
  },
  {
    id: 'swat',
    name: 'SWAT Officer',
    file: 'SWAT.glb',
    cost: 6500
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    file: 'Vanguard By T. Choonyung.glb',
    cost: 8000
  }
];

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

console.log(`${COLORS.blue}📁 Checking Public Directory: ${PUBLIC_DIR}${COLORS.reset}\n`);

// Check if public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  console.log(`${COLORS.red}❌ ERROR: Public directory not found!${COLORS.reset}`);
  process.exit(1);
}

// Check each expected model
console.log(`${COLORS.cyan}🔍 Checking Character Models:${COLORS.reset}\n`);

EXPECTED_MODELS.forEach((model, index) => {
  totalChecks++;
  const modelPath = path.join(PUBLIC_DIR, model.file);
  const exists = fs.existsSync(modelPath);

  const costText = model.cost === 0 ? 'FREE' : `${model.cost.toLocaleString()} coins`;
  
  if (exists) {
    const stats = fs.statSync(modelPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`${COLORS.green}✅ ${index + 1}. ${model.name}${COLORS.reset}`);
    console.log(`   ID: ${model.id}`);
    console.log(`   File: ${model.file}`);
    console.log(`   Size: ${sizeMB} MB`);
    console.log(`   Cost: ${costText}`);
    console.log(`   Path: ${modelPath}`);
    console.log('');
    
    passedChecks++;
  } else {
    console.log(`${COLORS.red}❌ ${index + 1}. ${model.name} - MISSING!${COLORS.reset}`);
    console.log(`   Expected file: ${model.file}`);
    console.log(`   Expected path: ${modelPath}`);
    console.log('');
    
    failedChecks++;
  }
});

// Check for unexpected GLB files
console.log(`${COLORS.cyan}🔍 Checking for Unexpected Models:${COLORS.reset}\n`);

const allFiles = fs.readdirSync(PUBLIC_DIR);
const glbFiles = allFiles.filter(f => f.toLowerCase().endsWith('.glb'));
const expectedFiles = EXPECTED_MODELS.map(m => m.file);

const unexpectedFiles = glbFiles.filter(f => !expectedFiles.includes(f));

if (unexpectedFiles.length > 0) {
  console.log(`${COLORS.yellow}⚠️  Found ${unexpectedFiles.length} unexpected GLB file(s):${COLORS.reset}\n`);
  unexpectedFiles.forEach(file => {
    const filePath = path.join(PUBLIC_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`   📦 ${file} (${sizeMB} MB)`);
  });
  console.log(`\n${COLORS.yellow}💡 These files are not in CHARACTERS config. Consider adding them or removing if unused.${COLORS.reset}\n`);
} else {
  console.log(`${COLORS.green}✅ No unexpected files found.${COLORS.reset}\n`);
}

// Check constants.js configuration
console.log(`${COLORS.cyan}🔍 Checking constants.js Configuration:${COLORS.reset}\n`);

const constantsPath = path.join(__dirname, '..', 'src', 'utils', 'constants.js');
totalChecks++;

if (fs.existsSync(constantsPath)) {
  const constantsContent = fs.readFileSync(constantsPath, 'utf-8');
  
  let configCorrect = true;
  
  EXPECTED_MODELS.forEach(model => {
    if (!constantsContent.includes(model.id)) {
      console.log(`${COLORS.red}❌ Character '${model.id}' not found in CHARACTERS config${COLORS.reset}`);
      configCorrect = false;
    }
  });
  
  if (configCorrect) {
    console.log(`${COLORS.green}✅ constants.js configuration is correct${COLORS.reset}\n`);
    passedChecks++;
  } else {
    console.log(`${COLORS.red}❌ constants.js has configuration issues${COLORS.reset}\n`);
    failedChecks++;
  }
} else {
  console.log(`${COLORS.red}❌ constants.js not found at: ${constantsPath}${COLORS.reset}\n`);
  failedChecks++;
}

// Check required components
console.log(`${COLORS.cyan}🔍 Checking Required Components:${COLORS.reset}\n`);

const requiredFiles = [
  {
    path: 'src/game/models/GLBPlayerOptimized.js',
    name: 'Enhanced Player System'
  },
  {
    path: 'src/game/models/CharacterPreviewLoader_FIXED.js',
    name: 'Character Loader'
  },
  {
    path: 'src/ui/CharacterPreviewPage_NEW.jsx',
    name: 'Character Preview Page'
  },
  {
    path: 'src/ui/CharacterPreviewPage_NEW.css',
    name: 'Character Preview Styles'
  }
];

requiredFiles.forEach(file => {
  totalChecks++;
  const filePath = path.join(__dirname, '..', file.path);
  
  if (fs.existsSync(filePath)) {
    console.log(`${COLORS.green}✅ ${file.name}${COLORS.reset}`);
    console.log(`   Path: ${file.path}\n`);
    passedChecks++;
  } else {
    console.log(`${COLORS.red}❌ ${file.name} - MISSING!${COLORS.reset}`);
    console.log(`   Expected: ${file.path}\n`);
    failedChecks++;
  }
});

// Final Summary
console.log(`${COLORS.cyan}
╔════════════════════════════════════════════════════════════╗
║                    VERIFICATION SUMMARY                    ║
╚════════════════════════════════════════════════════════════╝
${COLORS.reset}`);

const passRate = ((passedChecks / totalChecks) * 100).toFixed(0);

console.log(`Total Checks: ${totalChecks}`);
console.log(`${COLORS.green}Passed: ${passedChecks}${COLORS.reset}`);
console.log(`${COLORS.red}Failed: ${failedChecks}${COLORS.reset}`);
console.log(`Pass Rate: ${passRate}%\n`);

if (failedChecks === 0) {
  console.log(`${COLORS.green}
╔════════════════════════════════════════════════════════════╗
║  ✅ ALL CHECKS PASSED! Your setup is ready to use! 🎉    ║
╚════════════════════════════════════════════════════════════╝
${COLORS.reset}`);
  
  console.log(`${COLORS.cyan}Next Steps:${COLORS.reset}`);
  console.log(`1. Update App.jsx to use CharacterPreviewPage_NEW`);
  console.log(`2. Run 'npm start' to test the game`);
  console.log(`3. Navigate to Characters page and test each character`);
  console.log(`4. Verify animations and rotation work correctly\n`);
  
  process.exit(0);
} else {
  console.log(`${COLORS.red}
╔════════════════════════════════════════════════════════════╗
║  ⚠️  SOME CHECKS FAILED! Please fix the issues above.     ║
╚════════════════════════════════════════════════════════════╝
${COLORS.reset}`);
  
  console.log(`${COLORS.yellow}Troubleshooting:${COLORS.reset}`);
  console.log(`1. Ensure all GLB files are in the public/ folder`);
  console.log(`2. Check file names match exactly (case-sensitive)`);
  console.log(`3. Verify constants.js has all character definitions`);
  console.log(`4. Make sure all new component files are created\n`);
  
  process.exit(1);
}
