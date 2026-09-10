# SEBI Compliance Manager

Reference / demo frontend for tracking SEBI LODR, PIT and SAST-style filing
obligations for a fictional listed company.

**This is not a production compliance system.**

## What this repo is

- A Vite + React + TypeScript UI built with shadcn/ui and Zustand.
- A **reference implementation** of registers, calendars, risk views, a document
  vault, and simulated agent / chatbot screens.
- Seeded with **synthetic** users, emails, PAN / ISIN / CIN values, notice
  numbers, and filing records.

## What this repo is not

- It does **not** call live OpenAI, Anthropic, Gemini, Perplexity, Supabase,
  Stripe, SMTP, or AWS APIs.
- The chatbot, web-scrape panel, agent run, and Admin "API key" fields are UI
  simulations. There are **no live API keys** in the codebase.
- Mock identities use `@example.com`. Any resemblance to a real company or
  person is coincidental.

## Run locally

Requires Node.js and npm.

```sh
git clone https://github.com/d33pm3/sebi-compliance-manager.git
cd sebi-compliance-manager
npm i
npm run dev
```

The app serves on port `8080` by default.

## Hosted preview

A Lovable-hosted preview may exist at `https://sebi-compliance-manager.lovable.app`.
Treat it as a demo surface, not a production deployment.

This project was originally scaffolded with [Lovable](https://lovable.dev).

## License

MIT — see [LICENSE](LICENSE).

## Security

See [SECURITY.md](SECURITY.md). Do not commit `.env` files or credentials.
