#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Documentation Organization Script
 * Organizes and indexes documentation files in the docs folder
 */

const DOCS_PATH = './docs';

const FOLDER_STRUCTURE = {
  guides: {
    title: '📖 User Guides',
    description: 'Complete user documentation and setup guides',
    files: []
  },
  features: {
    title: '🎯 Features',
    description: 'Detailed feature specifications and architecture',
    files: []
  },
  security: {
    title: '🔒 Security',
    description: 'Security configuration and monitoring documentation',
    files: []
  },
  api: {
    title: '📡 API Reference',
    description: 'API documentation and examples',
    files: []
  },
  improvements: {
    title: '🚀 Improvements',
    description: 'Development improvements and update logs',
    files: []
  },
  reviews: {
    title: '📊 Reviews',
    description: 'Experience reviews and assessments',
    files: []
  }
};

function ensureDirectoryStructure() {
  console.log('📁 Ensuring documentation directory structure...');
  
  Object.keys(FOLDER_STRUCTURE).forEach(folder => {
    const folderPath = path.join(DOCS_PATH, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`  ✅ Created ${folder}/`);
    }
  });
}

function scanExistingFiles() {
  console.log('🔍 Scanning existing documentation files...');
  
  if (!fs.existsSync(DOCS_PATH)) {
    fs.mkdirSync(DOCS_PATH, { recursive: true });
    return;
  }
  
  const files = fs.readdirSync(DOCS_PATH);
  
  files.forEach(file => {
    const filePath = path.join(DOCS_PATH, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile() && file.endsWith('.md')) {
      // Categorize files based on content
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      let category = 'guides'; // default
      
      if (file.toLowerCase().includes('api') || content.includes('endpoint') || content.includes('api')) {
        category = 'api';
      } else if (file.toLowerCase().includes('security') || content.includes('security') || content.includes('csrf')) {
        category = 'security';
      } else if (file.toLowerCase().includes('feature') || content.includes('feature') || content.includes('specification')) {
        category = 'features';
      } else if (file.toLowerCase().includes('improvement') || file.toLowerCase().includes('update') || content.includes('improvement')) {
        category = 'improvements';
      } else if (file.toLowerCase().includes('review') || file.toLowerCase().includes('assessment') || content.includes('evaluation')) {
        category = 'reviews';
      }
      
      FOLDER_STRUCTURE[category].files.push(file);
    }
  });
}

function createCategoryReadmes() {
  console.log('📝 Creating category README files...');
  
  Object.entries(FOLDER_STRUCTURE).forEach(([folder, info]) => {
    const readmePath = path.join(DOCS_PATH, folder, 'README.md');
    
    let content = `# ${info.title}\n\n${info.description}\n\n`;
    
    if (info.files.length > 0) {
      content += '## Documents in this category\n\n';
      info.files.forEach(file => {
        content += `- [${file.replace('.md', '')}](../${file})\n`;
      });
      content += '\n';
    }
    
    // Add category-specific content
    switch (folder) {
      case 'guides':
        content += `## Quick Links

- [Installation Guide](../guides/installation.md)
- [Deployment Guide](../guides/deployment.md)
- [User Manual](../guides/user-manual.md)
- [Admin Guide](../guides/admin-guide.md)

## Getting Started

New to the project? Start with these documents in order:

1. **Installation Guide** - Set up your development environment
2. **User Manual** - Learn the basic functionality
3. **Admin Guide** - Understand administrative features
4. **Deployment Guide** - Deploy to production
`;
        break;
        
      case 'features':
        content += `## Architecture Overview

- **Round Management System** - Advanced round management with timers and assignments
- **Voting System** - Intelligent preference-based voting
- **Authentication** - Multi-provider OAuth integration
- **Event Management** - Complete event lifecycle management

## Feature Categories

- **Core Features** - Essential functionality
- **Admin Features** - Administrative tools and interfaces
- **Security Features** - Authentication and authorization
- **Integration Features** - Third-party integrations
`;
        break;
        
      case 'security':
        content += `## Security Features

- **CSRF Protection** - Cross-site request forgery prevention
- **Rate Limiting** - Request rate limiting and throttling
- **Input Validation** - XSS protection and input sanitization
- **Authentication** - Secure multi-provider OAuth
- **Authorization** - Role-based access control

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] Environment variables secured
- [ ] Rate limits configured
- [ ] CSRF protection active
- [ ] Input validation implemented
`;
        break;
        
      case 'api':
        content += `## API Documentation

Complete reference for all API endpoints and integration examples.

### API Categories

- **Authentication Endpoints** - User authentication and session management
- **Topic Management** - Topic creation, voting, and management
- **Round Management** - Round control and timing
- **Admin Endpoints** - Administrative functions
- **User Management** - User profile and settings

### Quick Reference

- Base URL: \`/api/\`
- Authentication: Session-based
- Rate Limits: Vary by endpoint type
- Response Format: JSON
`;
        break;
    }
    
    fs.writeFileSync(readmePath, content);
    console.log(`  ✅ Updated ${folder}/README.md`);
  });
}

function createMainDocsIndex() {
  console.log('📚 Creating main documentation index...');
  
  const indexPath = path.join(DOCS_PATH, 'README.md');
  
  let content = `# Documentation Index

Welcome to the comprehensive documentation for the Unconference Management Application.

## 📑 Documentation Categories

`;

  Object.entries(FOLDER_STRUCTURE).forEach(([folder, info]) => {
    const fileCount = info.files.length;
    content += `### [${info.title}](${folder}/)\n${info.description}\n`;
    if (fileCount > 0) {
      content += `*${fileCount} document${fileCount !== 1 ? 's' : ''}*\n\n`;
    } else {
      content += '\n';
    }
  });

  content += `## 🚀 Quick Start

1. **New Users**: Start with [User Guides](guides/)
2. **Developers**: Check [Features](features/) and [API Reference](api/)
3. **Admins**: See [Security](security/) documentation
4. **Contributors**: Review [Improvements](improvements/) and [Reviews](reviews/)

## 📋 Recent Updates

Check the [CHANGELOG.md](CHANGELOG.md) for the latest updates and changes.

## 🔍 Finding Documentation

- **By Topic**: Browse the categories above
- **By Search**: Use GitHub's search functionality
- **By File**: Check individual markdown files in each category

## 📝 Contributing to Documentation

1. Follow the existing structure and naming conventions
2. Use clear, descriptive titles and headers
3. Include code examples where applicable
4. Update relevant category README files
5. Run \`npm run docs:update\` to refresh the documentation index

---

*This index is automatically generated. Last updated: ${new Date().toLocaleString()}*
`;

  fs.writeFileSync(indexPath, content);
  console.log('  ✅ Updated main docs/README.md');
}

function main() {
  console.log('🔄 Organizing documentation...');
  
  ensureDirectoryStructure();
  scanExistingFiles();
  createCategoryReadmes();
  createMainDocsIndex();
  
  console.log('✅ Documentation organization complete!');
  console.log('📖 Key improvements:');
  console.log('  - Organized folder structure');
  console.log('  - Category-specific README files');
  console.log('  - Main documentation index');
  console.log('  - Quick navigation links');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
