# Unconference Documentation

Welcome to the comprehensive documentation for the Unconference Management Application. This documentation is organized into logical sections to help you find what you need quickly.

## � Documentation Structure

### 📖 [`guides/`](./guides/)
User guides, setup instructions, and deployment documentation:
- **[User Guide](./guides/user-guide.md)** - Complete guide for organizers and participants
- **[Deployment Guide](./guides/deployment-guide.md)** - Production deployment instructions
- **[Environment Setup](./guides/environment-setup.md)** - Development environment configuration
- **[OAuth Setup](./guides/oauth-setup.md)** - Authentication provider configuration

### ⚡ [`features/`](./features/)
Feature specifications and architecture documentation:
- **[Features Overview](./features/FEAUTURES.md)** - Complete feature list and capabilities
- **[Round Management](./features/round-management.md)** - Round system architecture and workflow
- **[Multi-Event Architecture](./features/multi-event-architecture.md)** - Platform scaling and event management

### � [`security/`](./security/)
Security configuration and monitoring documentation:
- **[CSRF Configuration](./security/CSRF_CONFIGURATION.md)** - Cross-Site Request Forgery protection setup
- **[Monitoring & Security](./security/MONITORING_SECURITY.md)** - Security monitoring and threat detection

### 📊 [`reviews/`](./reviews/)
Experience reviews and platform assessments:
- **[Attendee Experience Review](./reviews/ATTENDEE_EXPERIENCE_REVIEW.md)** - User experience analysis
- **[Organizer Experience Review](./reviews/ORGANIZER_EXPERIENCE_REVIEW.md)** - Admin/organizer workflow review
- **[Platform Approach Review](./reviews/PLATFORM_APPROACH_REVIEW.md)** - Overall platform architecture assessment

### 🚀 [`improvements/`](./improvements/)
Improvement summaries and update logs:
- **[Super Admin Role Improvements](./improvements/SUPER_ADMIN_ROLE_IMPROVEMENTS.md)** - Enhanced admin role features
- **[Organizer Improvements Summary](./improvements/ORGANIZER_IMPROVEMENTS_SUMMARY.md)** - Organizer experience enhancements
- **[Design Improvements Summary](./improvements/DESIGN_IMPROVEMENTS_SUMMARY.md)** - UI/UX improvements
- **[Text Overflow Fixes](./improvements/TEXT_OVERFLOW_FIXES.md)** - Layout and display fixes
- **[Group Assignment Fixes](./improvements/GROUP_ASSIGNMENT_FIXES.md)** - Assignment algorithm improvements
- **[Topic Management Improvements](./improvements/TOPIC_MANAGEMENT_AND_GROUP_VIEWING_IMPROVEMENTS.md)** - Topic handling enhancements
- **[Role Permissions Update](./improvements/ROLE_PERMISSIONS_UPDATE.md)** - Permission system changes
- **[Event User Association](./improvements/EVENT_USER_ASSOCIATION.md)** - User-event relationship improvements
- **[One Participant One Group Update](./improvements/ONE_PARTICIPANT_ONE_GROUP_UPDATE.md)** - Assignment logic fixes

## � Core Documentation

- **[CHANGELOG.md](./CHANGELOG.md)** - Complete version history and feature changes
- **[API Documentation](./api-documentation.md)** - Complete API reference

## 🎯 Quick Start

1. **For Developers**: Start with [Environment Setup](./guides/environment-setup.md)
2. **For Deployers**: Check [Deployment Guide](./guides/deployment-guide.md)
3. **For Users**: Read the [User Guide](./guides/user-guide.md)
4. **For Security**: Review [Security Documentation](./security/)

## � Quick Navigation Paths

### Path 1: Event Participant
```
Main README → User Guide (Participant sections) → Features Overview
```

### Path 2: Event Organizer
```
Main README → User Guide (Admin sections) → Round Management → Organizer Improvements
```

### Path 3: Developer/Integrator
```
Main README → Environment Setup → API Documentation → Security Configuration
```

### Path 4: System Administrator
```
Main README → Deployment Guide → Security Documentation → Monitoring
```

## 🔄 Recent Updates (v2.5.0 - September 2025)

- ✅ **Enhanced Super Admin Role Management** - Isolated navigation and improved access controls
- ✅ **Comprehensive Security Enhancements** - CSRF protection, rate limiting, and threat detection  
- ✅ **Improved User Registration System** - Better validation and error handling
- ✅ **Documentation Reorganization** - Logical folder structure for better navigation

Check the [CHANGELOG.md](./CHANGELOG.md) for complete details.

## 🔍 Finding Information

### Search Tips
- Use browser search (Ctrl+F/Cmd+F) within documents
- Check table of contents in each document
- Cross-references are provided between related topics
- GitHub search covers all documentation files

### Common Topics

| Topic | Primary Document | Additional Resources |
|-------|------------------|---------------------|
| Installation | [Environment Setup](./guides/environment-setup.md) | [Deployment Guide](./guides/deployment-guide.md) |
| Voting System | [User Guide](./guides/user-guide.md) | [Features](./features/FEAUTURES.md) |
| Round Management | [Round Management](./features/round-management.md) | [User Guide](./guides/user-guide.md) |
| Admin Features | [User Guide](./guides/user-guide.md) | [Organizer Improvements](./improvements/) |
| API Integration | [API Documentation](./api-documentation.md) | [Security Config](./security/) |
| Security Setup | [Security Documentation](./security/) | [Deployment Guide](./guides/deployment-guide.md) |
| Troubleshooting | [User Guide](./guides/user-guide.md) | [Reviews](./reviews/) |

## �️ New File Structure

```
docs/
├── README.md                    # This index file
├── CHANGELOG.md                 # Version history
├── api-documentation.md         # API reference
├── guides/                      # User and setup guides
│   ├── user-guide.md
│   ├── deployment-guide.md
│   ├── environment-setup.md
│   └── oauth-setup.md
├── features/                    # Feature specifications
│   ├── FEAUTURES.md
│   ├── round-management.md
│   └── multi-event-architecture.md
├── security/                    # Security documentation
│   ├── CSRF_CONFIGURATION.md
│   └── MONITORING_SECURITY.md
├── reviews/                     # Experience assessments
│   ├── ATTENDEE_EXPERIENCE_REVIEW.md
│   ├── ORGANIZER_EXPERIENCE_REVIEW.md
│   └── PLATFORM_APPROACH_REVIEW.md
└── improvements/                # Enhancement logs
    ├── SUPER_ADMIN_ROLE_IMPROVEMENTS.md
    ├── ORGANIZER_IMPROVEMENTS_SUMMARY.md
    └── [other improvement docs]
```

## 🤝 Contributing

When adding new documentation:
1. Place files in the appropriate category folder
2. Update this README if adding new categories
3. Update the CHANGELOG.md for significant documentation changes
4. Follow the existing naming conventions

### Documentation Standards
- Use clear, concise language
- Include practical examples
- Maintain consistent formatting
- Update cross-references
- Test all code examples

## 📞 Support and Contact

- **General Questions**: Create GitHub issue
- **Technical Issues**: Check troubleshooting guides first
- **Feature Requests**: Submit enhancement proposals
- **Bug Reports**: Use issue templates provided

---

*Last updated: September 2025*
