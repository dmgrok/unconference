#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * README Synchronization Script
 * Updates README.md with key information from documentation files
 */

const README_PATH = './README.md';
const DOCS_PATH = './docs';
const PACKAGE_PATH = './package.json';

function readPackageInfo() {
  if (fs.existsSync(PACKAGE_PATH)) {
    return JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
  }
  return {};
}

function getRecentChanges() {
  const changelogPath = path.join(DOCS_PATH, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) return '';
  
  const content = fs.readFileSync(changelogPath, 'utf8');
  const lines = content.split('\n');
  
  // Find the first version section
  let startIndex = lines.findIndex(line => line.match(/^## \[.+\]/));
  if (startIndex === -1) return '';
  
  // Find the next version section or end
  let endIndex = lines.findIndex((line, index) => 
    index > startIndex && line.match(/^## \[.+\]/)
  );
  if (endIndex === -1) endIndex = Math.min(startIndex + 20, lines.length); // Limit to 20 lines
  
  return lines.slice(startIndex, endIndex).join('\n');
}

function getDocumentationLinks() {
  const links = [];
  
  // Scan docs folder for key documentation
  const docFiles = [
    { file: 'guides/README.md', title: '📖 User Guide', description: 'Complete user documentation' },
    { file: 'features/README.md', title: '🎯 Features', description: 'Detailed feature documentation' },
    { file: 'guides/deployment.md', title: '🚀 Deployment', description: 'Deployment and setup guide' },
    { file: 'security/README.md', title: '🔒 Security', description: 'Security configuration and best practices' },
    { file: 'api-documentation.md', title: '📡 API Reference', description: 'Complete API documentation' },
    { file: 'CHANGELOG.md', title: '📝 Changelog', description: 'Version history and changes' }
  ];
  
  docFiles.forEach(({ file, title, description }) => {
    const fullPath = path.join(DOCS_PATH, file);
    if (fs.existsSync(fullPath)) {
      links.push(`- **[${title}](docs/${file})** - ${description}`);
    }
  });
  
  return links.join('\n');
}

function generateBadges(pkg) {
  const badges = [];
  
  if (pkg.version) {
    badges.push(`![Version](https://img.shields.io/badge/version-${pkg.version}-blue.svg)`);
  }
  
  if (pkg.license) {
    badges.push(`![License](https://img.shields.io/badge/license-${pkg.license}-green.svg)`);
  }
  
  // Add Node.js version if specified in engines
  if (pkg.engines?.node) {
    badges.push(`![Node](https://img.shields.io/badge/node-${pkg.engines.node}-brightgreen.svg)`);
  }
  
  return badges.join(' ');
}

function getQuickStart() {
  return `## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation
\`\`\`bash
# Clone the repository
git clone https://github.com/dmgrok/unconference.git
cd unconference

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:setup

# Start development server
npm run dev
\`\`\`

The application will be available at \`http://localhost:3000\`

### Docker Quick Start
\`\`\`bash
# Build and run with Docker
npm run build:docker
npm run docker
\`\`\``;
}

function getTechStack() {
  return `## 🛠️ Tech Stack

- **Frontend**: Vue 3, Nuxt 3, TypeScript, Vuetify
- **Backend**: Nuxt API routes, Prisma ORM
- **Database**: SQLite (configurable)
- **Authentication**: Multi-provider OAuth (Google, GitHub)
- **Deployment**: Docker, Azure, self-hosted
- **Testing**: Vitest, Playwright
- **Monitoring**: Winston logging`;
}

function generateNewReadme(pkg) {
  const badges = generateBadges(pkg);
  const recentChanges = getRecentChanges();
  const documentationLinks = getDocumentationLinks();
  const quickStart = getQuickStart();
  const techStack = getTechStack();
  
  return `# ${pkg.name || 'Unconference Management Application'}

${badges}

> A modern, feature-rich web application for managing unconference events with advanced round management, real-time voting, and participant coordination.

## 🌟 Key Features

### 🎯 **Advanced Round Management**
- **Pre-Round Planning**: Review past rounds and manually select topics
- **Real-Time Timer**: Configurable round duration with live countdown
- **Smart Assignment**: Automatic participant assignment based on preferences
- **Round History**: Complete analytics and tracking of all past rounds

### 🗳️ **Intelligent Voting System**
- **Preference Voting**: Weighted scoring (1st choice = 2 points, 2nd choice = 1 point)
- **Direct Dashboard Voting**: One-click voting interface
- **Real-Time Updates**: Live vote counts and statistics
- **Badge System**: Recognition for popular topics

### 👥 **User & Admin Experience**
- **Role-Based Access**: Admin and user roles with appropriate permissions
- **Multi-Provider OAuth**: Secure authentication with Google, GitHub, or email/password
- **Guest Support**: Quick anonymous access for events
- **Mobile Responsive**: Full functionality on all devices

### 🏢 **Event Management**
- **Room Assignments**: Automatic topic-to-room mapping
- **QR Code Access**: Easy event joining via QR codes
- **Theme Support**: Light/dark mode with customization
- **Multi-Event Ready**: Support for different event configurations

${quickStart}

${techStack}

## 📚 Documentation

${documentationLinks}

${recentChanges ? `## 🆕 Recent Changes\n\n${recentChanges}` : ''}

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes using [Conventional Commits](https://conventionalcommits.org/)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ${pkg.license || 'MIT'} License - see the [LICENSE](LICENSE) file for details.

## 💫 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/dmgrok/unconference/issues)
- 💬 [Discussions](https://github.com/dmgrok/unconference/discussions)

---

*Built with ❤️ for the unconference community*
`;
}

function main() {
  console.log('🔄 Updating README.md...');
  
  const pkg = readPackageInfo();
  const newReadme = generateNewReadme(pkg);
  
  // Backup existing README
  if (fs.existsSync(README_PATH)) {
    const backupPath = `${README_PATH}.backup`;
    fs.copyFileSync(README_PATH, backupPath);
    console.log(`📁 Backed up existing README to ${backupPath}`);
  }
  
  fs.writeFileSync(README_PATH, newReadme);
  
  console.log('✅ README.md updated successfully!');
  console.log('📖 Key improvements:');
  console.log('  - Clean, scannable format');
  console.log('  - Automatic badges from package.json');
  console.log('  - Recent changes from changelog');
  console.log('  - Links to detailed documentation');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
