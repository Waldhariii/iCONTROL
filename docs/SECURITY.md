# Security Policy — iCONTROL

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |

## Reporting a Vulnerability

**DO NOT** open a public issue. Report via:
- Email: [security contact]
- Private security advisory

## Security Best Practices

### Authentication
- Never hardcode passwords or credentials
- Use environment variables for sensitive configuration
- Use proper password hashing (bcrypt, argon2) in production
- Secure session management (JWT with httpOnly cookies)

### Secrets Management
- Store secrets in environment variables
- Use `.env.local` for local development (not committed)
- Rotate credentials regularly

### Code Security
- Sanitize all user inputs
- Prefer `textContent` over `innerHTML`
- Use DOMPurify for dynamic HTML
- Implement Content Security Policy (CSP)

### Dependencies
- Keep dependencies up to date
- Run `npm audit` regularly
- Review new dependencies

## Security Checklist (pre-production)

- [ ] No hardcoded credentials
- [ ] Input validation and sanitization
- [ ] XSS protections (DOMPurify/textContent)
- [ ] HTTPS enabled
- [ ] Dependencies audited
- [ ] Security headers (CSP, HSTS)

---

**Last Updated**: 2026-01-20. See also LICENSE and NOTICE.
