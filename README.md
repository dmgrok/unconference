# Unconference Management Application

A modern, feature-rich web application for managing unconference events with advanced round management, real-time voting, and participant coordination.

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
- Node.js 18+ 
- npm or pnpm
- OAuth Apps (Google and/or GitHub for authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/unconference.git
cd unconference

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# GitHub OAuth (required for authentication)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Session Security
NUXT_SESSION_PASSWORD=your_secure_session_password

# Data Storage Paths
NUXT_TOPICS_FILE_PATH=./data/topics.json
NUXT_USERS_FILE_PATH=./data/users.json

# Application Settings
NUXT_MAX_VOTES_PER_TOPIC=12
NUXT_TOP_TOPICS_COUNT=10
APP_ENV=development
```

## 📖 Usage Guide

### For Event Organizers

1. **Setup Event**
   - Configure event details in Settings
   - Set up rooms and capacity
   - Customize voting and round parameters

2. **Manage Rounds**
   - Access Round Management from admin menu
   - Review voting results and select topics
   - Start rounds with custom duration
   - Monitor progress with real-time timer

3. **Monitor Participation**
   - View live voting statistics
   - Track participant engagement
   - Generate QR codes for easy access

### For Participants

1. **Join Event**
   - Login with GitHub or as guest
   - Scan QR code or visit event URL

2. **Propose & Vote**
   - Submit discussion topics
   - Vote for preferred topics (1st and 2nd choice)
   - See real-time voting results

3. **Participate in Rounds**
   - Check dashboard for round status
   - View your assigned discussion topic
   - Follow timer for round duration

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Vue 3 + Nuxt 3 + TypeScript
- **UI Framework**: Vuetify 3 (Material Design)
- **Authentication**: nuxt-auth-utils with GitHub OAuth
- **Data Storage**: File-based JSON storage
- **Logging**: Winston logging system
- **Deployment**: Docker + Azure Static Web Apps

### Project Structure
```
unconference/
├── components/           # Vue components
├── composables/         # Vue composables
├── data/               # JSON data files
├── docs/               # Documentation
├── layouts/            # Page layouts
├── middleware/         # Route middleware
├── pages/              # Application pages
├── server/api/         # API endpoints
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Deployment
npm run build:azure     # Build for Azure deployment
npm run build:docker    # Build Docker image
npm run docker          # Run Docker container
```

### Key Development Commands

```bash
# Install dependencies
npm install

# Type checking
npm run typecheck

# Linting
npm run lint

# Testing (when available)
npm run test
```

## 🐳 Docker Deployment

### Quick Docker Setup

```bash
# Build the image
docker build -t unconference .

# Run the container
docker run -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e GITHUB_CLIENT_ID=your_id \
  -e GITHUB_CLIENT_SECRET=your_secret \
  -e NUXT_SESSION_PASSWORD=your_password \
  unconference
```

### Docker Compose

```yaml
version: '3.8'
services:
  unconference:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - GITHUB_CLIENT_ID=your_github_client_id
      - GITHUB_CLIENT_SECRET=your_github_client_secret
      - NUXT_SESSION_PASSWORD=your_secure_password
```

## 📚 Documentation

- **[Features Guide](docs/FEAUTURES.md)** - Comprehensive feature overview
- **[Round Management](docs/round-management.md)** - Advanced round system guide
- **[Changelog](docs/CHANGELOG.md)** - Version history and updates
- **[Architecture Guide](CLAUDE.md)** - Technical implementation details

## 🔒 Security Considerations

- **Authentication**: Secure GitHub OAuth implementation
- **Session Management**: Encrypted session handling
- **Data Privacy**: Local data storage, no external data sharing
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Proper cross-origin request handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Vue 3 Composition API
- Maintain responsive design principles
- Include appropriate error handling
- Update documentation for new features

## 📄 License & Commercial Use

### Open Source (AGPLv3)
This project is available under the **GNU Affero General Public License v3.0** for:
- ✅ Events with **fewer than 50 participants**
- ✅ Personal and educational use
- ✅ Small community events
- ⚠️ Requires attribution and sharing modifications

### Commercial License Required
For events with **50 or more participants**, including:
- 🏢 Corporate conferences and meetings
- 🎓 Large educational events
- 🏛️ Government and public sector events
- 💼 Professional conferences and trade shows

**[Contact us for commercial licensing →](mailto:your-email@domain.com)**

### Attribution Required
All users must include: **"Powered by [Unconference Platform](https://github.com/dmgrok/unconference)"**

📖 **[Read full licensing documentation →](docs/LICENSING.md)**

## 🆘 Support & Troubleshooting

### Common Issues

**Build Errors**: Ensure Node.js 18+ and check environment variables
**Authentication Issues**: Verify GitHub OAuth configuration
**Data Persistence**: Check file permissions for data directory
**Timer Not Updating**: Refresh browser or check network connection

### Getting Help

- Check the [documentation](docs/) for detailed guides
- Review [issues](https://github.com/your-org/unconference/issues) for known problems
- Create a new issue for bugs or feature requests

## 🙏 Acknowledgments

- **Special thanks to [@helaili](https://github.com/helaili)** for the original [unconference repository](https://github.com/helaili/unconference) that sparked the foundation of this project 🌟
- Built with [Nuxt 3](https://nuxt.com/) and [Vue 3](https://vuejs.org/)
- UI powered by [Vuetify](https://vuetifyjs.com/)
- Icons from [Material Design Icons](https://materialdesignicons.com/)
- Deployment supported by [Azure Static Web Apps](https://azure.microsoft.com/services/app-service/static/)

---

**Ready to transform your unconference experience?** 🚀
