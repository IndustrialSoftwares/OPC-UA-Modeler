# Security Policy

## Supported Versions

We release security updates for the following versions of OPC UA Modeler:

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take the security of OPC UA Modeler seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **GitHub Security Advisories** (Preferred)
   - Navigate to the [Security tab](https://github.com/IndustrialSoftwares/OPC-UA-Modeler/security/advisories) of this repository
   - Click "Report a vulnerability"
   - Fill out the form with details about the vulnerability

2. **Email**
   - Send an email to the repository maintainers through GitHub
   - Include "SECURITY" in the subject line
   - Provide detailed information about the vulnerability

### What to Include

When reporting a vulnerability, please include:

- Type of vulnerability (e.g., XSS, XML injection, dependency vulnerability)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Status Updates**: We will provide updates on the investigation every 5-7 days
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days, and other vulnerabilities within 90 days

### What to Expect

If we accept the vulnerability report:
- We will work on a fix and keep you informed of progress
- You will be credited in the security advisory (unless you prefer to remain anonymous)
- We will coordinate with you on the disclosure timeline
- A CVE ID will be requested if applicable

If we decline the vulnerability report:
- We will provide a detailed explanation of why we don't consider it a security issue
- We may suggest alternative ways to address your concern
- You are welcome to discuss our decision

## Security Best Practices

When using OPC UA Modeler:

1. **Keep Dependencies Updated**
   - Regularly run `npm audit` to check for known vulnerabilities
   - Update dependencies promptly when security patches are available

2. **File Upload Security**
   - Only upload OPC UA nodeset XML files from trusted sources
   - Be cautious with files from unknown origins
   - Review file contents before uploading when possible

3. **Browser Security**
   - Use the latest version of modern browsers (Chrome, Firefox, Safari, Edge)
   - Keep your browser updated with the latest security patches

4. **Deployment Security**
   - If self-hosting, use HTTPS
   - Implement appropriate authentication if needed
   - Follow security best practices for your deployment environment

## Known Security Considerations

### XML Processing
- This application parses XML files. Only upload XML files from trusted sources
- Large or maliciously crafted XML files could impact browser performance
- File size limits are enforced to prevent resource exhaustion

### Client-Side Application
- This is a client-side web application - all processing happens in the browser
- No data is transmitted to external servers by default
- Uploaded files are processed locally in your browser

## Security Updates

Security updates will be:
- Released as patch versions (e.g., 0.2.1)
- Documented in the [CHANGELOG.md](CHANGELOG.md)
- Announced through GitHub Security Advisories
- Tagged with the `security` label in releases

## Scope

This security policy applies to:
- The OPC UA Modeler web application code
- Dependencies explicitly bundled with the application
- Official deployment documentation

This policy does not cover:
- Third-party integrations or deployments
- User-created content or configurations
- Infrastructure where the application is hosted (unless part of official deployment)

## Questions

If you have questions about this security policy, please open a discussion in the GitHub repository or contact the maintainers.

Thank you for helping keep OPC UA Modeler and its users safe!
