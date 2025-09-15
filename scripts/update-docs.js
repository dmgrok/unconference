#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Master Documentation Update Script
 * Runs all documentation update tasks in the correct order
 */

const SCRIPTS = [
  {
    name: 'Documentation Organization',
    script: 'organize-docs.js',
    description: 'Organize docs folder structure and create category READMEs'
  },
  {
    name: 'README Update',
    script: 'update-readme.js',
    description: 'Update main README with latest information'
  },
  {
    name: 'Changelog Generation',
    script: 'update-changelog.js',
    description: 'Generate changelog entries from git commits'
  }
];

function runScript(script) {
  console.log(`\n🚀 Running ${script.name}...`);
  console.log(`   ${script.description}`);
  
  try {
    execSync(`node scripts/${script.script}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error(`❌ Failed to run ${script.name}`);
    console.error(error.message);
    return false;
  }
  
  return true;
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.log('\n📋 Files changed:');
      status.trim().split('\n').forEach(line => {
        console.log(`  ${line}`);
      });
      
      console.log('\n💡 Consider committing these changes:');
      console.log('  git add .');
      console.log('  git commit -m "docs: update documentation"');
    } else {
      console.log('\n✨ No changes detected - documentation is up to date!');
    }
  } catch (error) {
    console.log('\n⚠️  Could not check git status (not a git repository?)');
  }
}

function main() {
  console.log('🔄 Master Documentation Update');
  console.log('=====================================');
  
  let success = true;
  
  for (const script of SCRIPTS) {
    if (!runScript(script)) {
      success = false;
      break;
    }
  }
  
  if (success) {
    console.log('\n🎉 All documentation updates completed successfully!');
    
    // Check for git changes
    checkGitStatus();
    
    console.log('\n📚 Documentation system features:');
    console.log('  ✅ Organized folder structure');
    console.log('  ✅ Automated README generation');
    console.log('  ✅ Conventional commit changelog');
    console.log('  ✅ Category-based organization');
    console.log('  ✅ Cross-referenced documentation');
    
    console.log('\n🔧 Available commands:');
    console.log('  npm run docs:update     - Run all documentation updates');
    console.log('  npm run docs:organize   - Organize docs folder only');
    console.log('  npm run docs:readme     - Update README only');
    console.log('  npm run docs:changelog  - Update changelog only');
    console.log('  npm run docs:setup      - Set up git hooks');
  } else {
    console.log('\n❌ Documentation update failed');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
