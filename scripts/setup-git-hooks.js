#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Git Hooks Setup Script
 * Sets up automated documentation updates via git hooks
 */

const HOOKS_DIR = '.git/hooks';

const PRE_COMMIT_HOOK = `#!/bin/sh
# Pre-commit hook for documentation updates

echo "🔄 Updating documentation before commit..."

# Update documentation
node scripts/organize-docs.js
node scripts/update-readme.js

# Add updated documentation to the commit
git add docs/ README.md

echo "✅ Documentation updated"
`;

const POST_COMMIT_HOOK = `#!/bin/sh
# Post-commit hook for changelog generation

echo "📝 Generating changelog entry..."

# Generate changelog entry for the latest commits
node scripts/update-changelog.js

# Check if changelog was updated
if [ -n "$(git status --porcelain docs/CHANGELOG.md)" ]; then
  echo "📋 Changelog updated - consider adding to next commit"
fi
`;

const COMMIT_MSG_HOOK = `#!/bin/sh
# Commit message validation hook

commit_regex='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|security)(\(.+\))?(!)?: .{1,50}'

error_msg="
❌ Invalid commit message format!

Commit message must follow Conventional Commits specification:
<type>[optional scope]: <description>

Examples:
  feat: add user authentication
  fix(api): resolve voting endpoint bug
  docs: update README with setup instructions
  feat!: redesign user interface (breaking change)

Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, security
"

if ! grep -qE "$commit_regex" "$1"; then
    echo "$error_msg"
    exit 1
fi
`;

function ensureGitRepository() {
  if (!fs.existsSync('.git')) {
    console.error('❌ Not a git repository. Initialize git first with: git init');
    process.exit(1);
  }
}

function createHook(hookName, hookContent) {
  const hookPath = path.join(HOOKS_DIR, hookName);
  
  fs.writeFileSync(hookPath, hookContent);
  fs.chmodSync(hookPath, '755'); // Make executable
  
  console.log(`✅ Created ${hookName} hook`);
}

function setupHooks() {
  console.log('⚙️  Setting up git hooks...');
  
  createHook('pre-commit', PRE_COMMIT_HOOK);
  createHook('post-commit', POST_COMMIT_HOOK);
  createHook('commit-msg', COMMIT_MSG_HOOK);
  
  console.log('🎯 Git hooks configured for:');
  console.log('  - Automatic documentation updates (pre-commit)');
  console.log('  - Changelog generation (post-commit)');
  console.log('  - Conventional commit validation (commit-msg)');
}

function createEditorConfig() {
  const editorConfigPath = '.editorconfig';
  
  if (fs.existsSync(editorConfigPath)) {
    console.log('📝 .editorconfig already exists');
    return;
  }
  
  const editorConfig = `# EditorConfig helps maintain consistent coding styles
# https://editorconfig.org

root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[*.json]
indent_size = 2
`;

  fs.writeFileSync(editorConfigPath, editorConfig);
  console.log('✅ Created .editorconfig for consistent formatting');
}

function createGitAttributes() {
  const gitAttributesPath = '.gitattributes';
  
  if (fs.existsSync(gitAttributesPath)) {
    console.log('📝 .gitattributes already exists');
    return;
  }
  
  const gitAttributes = `# Git attributes for better diffs and language detection

# Documentation
*.md text eol=lf
docs/** linguist-documentation

# Source code
*.js text eol=lf
*.ts text eol=lf
*.vue text eol=lf
*.json text eol=lf

# Configuration files
*.yml text eol=lf
*.yaml text eol=lf
.env* text eol=lf

# Binary files
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.pdf binary
`;

  fs.writeFileSync(gitAttributesPath, gitAttributes);
  console.log('✅ Created .gitattributes for better git handling');
}

function main() {
  console.log('🚀 Setting up automated documentation system...');
  
  ensureGitRepository();
  setupHooks();
  createEditorConfig();
  createGitAttributes();
  
  console.log('\n🎉 Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Make a commit to test the hooks');
  console.log('2. Use conventional commit messages (feat:, fix:, docs:, etc.)');
  console.log('3. Documentation will be automatically updated');
  console.log('\n💡 Tips:');
  console.log('- Run `npm run docs:update` manually anytime');
  console.log('- Check docs/CHANGELOG.md for generated entries');
  console.log('- README.md is automatically synced with latest info');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
