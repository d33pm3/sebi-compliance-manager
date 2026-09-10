# Security Policy

## This repository

This project is a **reference / demo implementation**. It ships with synthetic
compliance data and simulated workflows. It is not a production compliance
system and does not include live third-party credentials.

## Reporting a vulnerability

Please **do not** open a public issue for suspected secrets or security flaws.

1. Use GitHub Security Advisories on this repository, or
2. Contact the maintainer privately via the profile listed on the GitHub account.

## Secrets

- Never commit API keys, tokens, passwords, private keys, or connection strings.
- Use a local `.env` file (ignored by git) or GitHub Actions secrets.
- Placeholder values in the Admin UI (`••••••••`) are decorative. They are not
  real credentials.
- If a real secret is found in git history, rotate it at the provider **before**
  rewriting history.

## Automated scanning

When this repository is public, GitHub secret scanning is expected to run on
the default branch and on push. Please treat any high/critical alert as
blocking until it is classified as a false positive or remediated.
