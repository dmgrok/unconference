# unconference

![License](https://img.shields.io/badge/license-AGPL-3.0-green.svg)

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation
```bash
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
```

The application will be available at `http://localhost:3000`

### Docker Quick Start
```bash
# Build and run with Docker
npm run build:docker
npm run docker
```

## 🛠️ Tech Stack

- **Frontend**: Vue 3, Nuxt 3, TypeScript, Vuetify
- **Backend**: Nuxt API routes, Prisma ORM
- **Database**: SQLite (configurable)
- **Authentication**: Multi-provider OAuth (Google, GitHub)
- **Deployment**: Docker, Azure, self-hosted
- **Testing**: Vitest, Playwright
- **Monitoring**: Winston logging

## 📚 Documentation

- **[📖 User Guide](docs/guides/README.md)** - Complete user documentation
- **[🎯 Features](docs/features/README.md)** - Detailed feature documentation
- **[🔒 Security](docs/security/README.md)** - Security configuration and best practices
- **[📡 API Reference](docs/api-documentation.md)** - Complete API documentation
- **[📝 Changelog](docs/CHANGELOG.md)** - Version history and changes

## 🆕 Recent Changes

## [0.1.0] - 2025-09-19

### ✨ Added
- update changelog and README with new features and fixes for version 0.1.0
- Update README
- Revise action plan to enhance revenue protection and knowledge capture features
- Add comprehensive licensing comparison and optimal strategy documentation
- Enhance event selection and context management with improved UI and navigation
- update room management and participant handling with new endpoints and role management
- implement room management with CRUD functionality and event status handling
- implement room management with CRUD functionality and event status handling
- implement read-only mode for inactive events with UI updates and access control
- add event status management with reactivation functionality and access control for organizers and super admins
- enhance event navigation with query parameters and error handling (super-admin)
- Implement navigation isolation and access restrictions for Super Admin role
- Enhance Super Admin role with improved navigation, redirection, and event management features
- Update user data structure and enhance registration form validation with success messaging

### 📚 Documentation
- Update CHANGELOG with new features, documentation, and fixes for version 0.1.0
- organize documentation structure and update README
- update changelog with automated documentation system entry

### 🐛 Fixed
- update research modelId and maxTokens for improved performance (config)

### 🔧 Maintenance
- Update CHANGELOG with new features, documentation, and fixes for version 0.1.0



## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using [Conventional Commits](https://conventionalcommits.org/)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 💫 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/dmgrok/unconference/issues)
- 💬 [Discussions](https://github.com/dmgrok/unconference/discussions)

---

*Built with ❤️ for the unconference community*
