# Security Policy

InsidCode takes the security and integrity of our platform and user community seriously. If you have discovered a security vulnerability or potential weakness in InsidCode, we appreciate your help in disclosing it to us responsibly.

## Supported Versions

Only the latest version deployed on production and the `main` branch are actively supported for security fixes:

| Version / Branch | Supported          |
| ---------------- | ------------------ |
| `main`           | :white_check_mark: |
| < 1.4.0          | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or social media.**

To report a vulnerability:
1. **GitHub Private Vulnerability Reporting**: Open a private report through the [Security Advisories tab](https://github.com/namish-yadav/insidcode/security/advisories) on our GitHub repository.
2. **Email**: If private advisories are unavailable, send details to `security@insidcode.com` (or submit via the platform feedback form selecting "Bug Report").

### What to Include
To help us triage and remediate the issue promptly, please include:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Affected endpoints, parameters, or components.
- Any suggested remediations or mitigations.

## Responsible Disclosure & Safe Harbor

We ask that security researchers:
- Act in good faith to avoid privacy violations, destruction of data, and interruption or degradation of our services.
- Never execute denial-of-service (DoS/DDoS) attacks or automated brute-force attacks against production infrastructure.
- Never access, modify, or download data belonging to other users. Use your own test accounts for verification.
- Give us reasonable time (at least 90 days) to investigate and deploy a fix before publicly disclosing any details.

If you conduct your research in adherence to these guidelines, we will not pursue legal action or report your activities to law enforcement.

## Response SLA

- **Initial Acknowledgment**: Within 48 hours of receipt.
- **Triage & Assessment**: Within 5 business days.
- **Remediation**: Priority patches deployed according to severity (Critical: < 7 days, High: < 14 days).
