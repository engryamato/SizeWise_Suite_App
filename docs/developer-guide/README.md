# Developer Guide

Welcome to the SizeWise Suite Developer Guide! This comprehensive resource provides everything you need to understand, contribute to, and extend the SizeWise Suite platform.

## 🚀 Getting Started

### Development Environment Setup
- **[Getting Started](getting-started.md)** - Complete development environment setup
- **[Prerequisites](getting-started.md#prerequisites)** - Required tools and dependencies
- **[Installation](getting-started.md#installation)** - Step-by-step installation guide
- **[First Build](getting-started.md#first-build)** - Verifying your setup

### Quick References
- **[Project Structure](architecture/project-structure.md)** - Understanding the codebase organization
- **[Technology Stack](architecture/technology-stack.md)** - Technologies and frameworks used
- **[Development Workflow](getting-started.md#workflow)** - Git workflow and development process

## 🏗️ Architecture

### System Design
- **[Architecture Overview](architecture/overview.md)** - High-level system architecture
- **[Frontend Architecture](architecture/frontend.md)** - Next.js frontend structure and patterns
- **[Backend Architecture](architecture/backend.md)** - Flask backend and calculation engines
- **[Data Layer](architecture/data-layer.md)** - Data models and persistence

### Design Decisions
- **[Architecture Decision Records](architecture/decisions/)** - Formal ADR documentation
- **[Technology Choices](architecture/technology-stack.md#decisions)** - Why we chose specific technologies
- **[Design Patterns](architecture/patterns.md)** - Common patterns and conventions

## 📡 API Reference

### Core APIs
- **[API Overview](api-reference/README.md)** - API architecture and conventions
- **[Authentication API](api-reference/authentication.md)** - User authentication and authorization
- **[Calculation API](api-reference/calculations.md)** - HVAC calculation endpoints
- **[Project API](api-reference/projects.md)** - Project management endpoints

### API Documentation
- **[OpenAPI Specification](api-reference/openapi.yaml)** - Complete API specification
- **[Error Handling](api-reference/errors.md)** - Error codes and handling
- **[Rate Limiting](api-reference/rate-limiting.md)** - API usage limits and policies

## 🧪 Testing

### Testing Strategy
- **[Testing Overview](testing.md#overview)** - Testing philosophy and approach
- **[Unit Testing](testing.md#unit-tests)** - Component and function testing
- **[Integration Testing](testing.md#integration-tests)** - API and workflow testing
- **[End-to-End Testing](testing.md#e2e-tests)** - Full application testing

### Testing Tools
- **[Jest Configuration](testing.md#jest)** - Frontend unit testing setup
- **[Playwright Setup](testing.md#playwright)** - E2E testing configuration
- **[Python Testing](testing.md#python)** - Backend testing with pytest

## 🔧 Development

### Code Standards
- **[Coding Standards](contributing.md#coding-standards)** - Code style and conventions
- **[TypeScript Guidelines](contributing.md#typescript)** - TypeScript best practices
- **[Python Guidelines](contributing.md#python)** - Python code standards
- **[Component Guidelines](contributing.md#components)** - React component patterns

### Tools and Utilities
- **[Development Scripts](getting-started.md#scripts)** - Available npm and development scripts
- **[Debugging](debugging.md)** - Debugging techniques and tools
- **[Performance Profiling](performance.md)** - Performance analysis and optimization

## 🏗️ Modules

### Core Modules
- **[Air Duct Sizer](modules/air-duct-sizer/)** - Air duct sizing module documentation
- **[Authentication System](modules/authentication/)** - Authentication and authorization
- **[Project Management](modules/project-management/)** - Project and data management

### Module Development
- **[Creating New Modules](modules/creating-modules.md)** - Module development guidelines
- **[Module Architecture](modules/architecture.md)** - Standard module structure
- **[Module Testing](modules/testing.md)** - Module-specific testing approaches

## 🤝 Contributing

### Getting Involved
- **[Contributing Guidelines](contributing.md)** - How to contribute to the project
- **[Code of Conduct](contributing.md#code-of-conduct)** - Community guidelines
- **[Issue Reporting](contributing.md#issues)** - How to report bugs and request features

### Development Process
- **[Git Workflow](contributing.md#git-workflow)** - Branch naming and commit conventions
- **[Pull Request Process](contributing.md#pull-requests)** - PR guidelines and review process
- **[Code Review](contributing.md#code-review)** - Review standards and checklist

## 🔒 Security

### Security Guidelines
- **[Security Overview](security/overview.md)** - Security architecture and principles
- **[Authentication Security](security/authentication.md)** - Secure authentication practices
- **[Data Protection](security/data-protection.md)** - Data security and privacy
- **[Vulnerability Reporting](security/reporting.md)** - How to report security issues

## 📦 Deployment

### Development Deployment
- **[Local Development](getting-started.md#local-development)** - Running locally
- **[Docker Development](../operations/docker/development.md)** - Docker-based development
- **[Testing Environments](../operations/deployment/testing.md)** - Setting up test environments

### Production Deployment
- **[Production Guide](../operations/deployment/production.md)** - Production deployment
- **[Docker Production](../operations/docker/production.md)** - Production Docker setup
- **[Monitoring](../operations/monitoring.md)** - Production monitoring

## 📚 Resources

### Documentation
- **[Documentation Standards](contributing.md#documentation)** - Documentation guidelines
- **[API Documentation](api-reference/)** - Complete API reference
- **[Code Examples](examples/)** - Code examples and snippets

### External Resources
- **[HVAC Standards](../reference/standards/)** - Industry standards reference
- **[Technology Documentation](resources/external-docs.md)** - Links to framework documentation
- **[Community Resources](resources/community.md)** - Developer community links

---

## 🔄 Staying Updated

### Development Updates
- **[Changelog](../reference/changelog.md)** - Development changelog
- **[Migration Guides](migration/)** - Version migration guides
- **[Breaking Changes](migration/breaking-changes.md)** - Important breaking changes

### Communication
- **[Developer Discussions](https://github.com/engryamato/SizeWise_Suite_App/discussions)** - GitHub discussions
- **[Issue Tracking](https://github.com/engryamato/SizeWise_Suite_App/issues)** - Bug reports and feature requests

---

*This developer guide is continuously updated to reflect the current state of the SizeWise Suite codebase and development practices.*
