#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Automated Changelog Generator
 * Generates changelog entries based on conventional commit messages
 */

const CHANGELOG_PATH = './docs/CHANGELOG.md';
const PACKAGE_PATH = './package.json';

const COMMIT_TYPES = {
  feat: { label: 'Added', emoji: '✨' },
  fix: { label: 'Fixed', emoji: '🐛' },
  docs: { label: 'Documentation', emoji: '📚' },
  style: { label: 'Style', emoji: '💄' },
  refactor: { label: 'Changed', emoji: '♻️' },
  perf: { label: 'Performance', emoji: '⚡' },
  test: { label: 'Testing', emoji: '🧪' },
  build: { label: 'Build System', emoji: '🔨' },
  ci: { label: 'CI/CD', emoji: '👷' },
  chore: { label: 'Maintenance', emoji: '🔧' },
  revert: { label: 'Reverted', emoji: '⏪' },
  security: { label: 'Security', emoji: '🔒' },
  breaking: { label: 'Breaking Changes', emoji: '💥' }
};

function getLatestTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  } catch (error) {
    return null;
  }
}

function getCommitsSinceTag(tag) {
  const command = tag 
    ? `git log ${tag}..HEAD --pretty=format:"%H|%s|%b|%an|%ad" --date=short`
    : 'git log --pretty=format:"%H|%s|%b|%an|%ad" --date=short --max-count=50'; // Limit to last 50 commits for initial run
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    if (!output.trim()) return [];
    
    return output.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.split('|');
      if (parts.length < 5) return null; // Skip malformed lines
      
      const [hash, subject, body, author, date] = parts;
      return { hash, subject: subject || '', body: body || '', author: author || '', date: date || '' };
    }).filter(Boolean); // Remove null entries
  } catch (error) {
    console.error('Error getting commits:', error.message);
    return [];
  }
}

function parseConventionalCommit(subject) {
  // Handle undefined or null subjects
  if (!subject) return null;
  
  const match = subject.match(/^(\w+)(\(.+\))?(!)?: (.+)$/);
  if (!match) return null;
  
  const [, type, scope, breaking, description] = match;
  return {
    type: breaking ? 'breaking' : type,
    scope: scope ? scope.slice(1, -1) : null,
    description,
    isBreaking: !!breaking
  };
}

function generateChangelogEntry(commits, version) {
  const grouped = {};
  const breakingChanges = [];
  
  commits.forEach(commit => {
    const parsed = parseConventionalCommit(commit.subject);
    if (!parsed) return;
    
    const typeInfo = COMMIT_TYPES[parsed.type] || { label: 'Other', emoji: '📝' };
    const category = typeInfo.label;
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    const entry = {
      description: parsed.description,
      scope: parsed.scope,
      hash: commit.hash.substring(0, 7),
      author: commit.author,
      date: commit.date
    };
    
    if (parsed.isBreaking || parsed.type === 'breaking') {
      breakingChanges.push(entry);
    } else {
      grouped[category].push(entry);
    }
  });
  
  let changelog = `## [${version}] - ${new Date().toISOString().split('T')[0]}\n\n`;
  
  // Add breaking changes first
  if (breakingChanges.length > 0) {
    changelog += `### 💥 Breaking Changes\n`;
    breakingChanges.forEach(entry => {
      changelog += `- ${entry.description}${entry.scope ? ` (${entry.scope})` : ''}\n`;
    });
    changelog += '\n';
  }
  
  // Add other categories
  Object.keys(grouped).sort().forEach(category => {
    const items = grouped[category];
    if (items.length > 0) {
      const emoji = Object.values(COMMIT_TYPES).find(t => t.label === category)?.emoji || '📝';
      changelog += `### ${emoji} ${category}\n`;
      items.forEach(entry => {
        changelog += `- ${entry.description}${entry.scope ? ` (${entry.scope})` : ''}\n`;
      });
      changelog += '\n';
    }
  });
  
  return changelog;
}

function updateChangelog(newEntry) {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    fs.writeFileSync(CHANGELOG_PATH, '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n');
  }
  
  const currentContent = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  const lines = currentContent.split('\n');
  
  // Find where to insert (after the header)
  let insertIndex = lines.findIndex(line => line.startsWith('##'));
  if (insertIndex === -1) {
    insertIndex = lines.length;
  }
  
  const newLines = newEntry.split('\n');
  lines.splice(insertIndex, 0, ...newLines);
  
  fs.writeFileSync(CHANGELOG_PATH, lines.join('\n'));
}

function getCurrentVersion() {
  if (fs.existsSync(PACKAGE_PATH)) {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
    return pkg.version || '0.1.0';
  }
  return '0.1.0';
}

function main() {
  const args = process.argv.slice(2);
  const version = args[0] || getCurrentVersion();
  
  console.log('🔄 Generating changelog...');
  
  const latestTag = getLatestTag();
  console.log(latestTag ? `📍 Latest tag: ${latestTag}` : '📍 No previous tags found');
  
  const commits = getCommitsSinceTag(latestTag);
  console.log(`📝 Found ${commits.length} commits`);
  
  if (commits.length === 0) {
    console.log('✅ No new commits to document');
    return;
  }
  
  const changelogEntry = generateChangelogEntry(commits, version);
  updateChangelog(changelogEntry);
  
  console.log('✅ Changelog updated successfully!');
  console.log(`📖 View changes in ${CHANGELOG_PATH}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
