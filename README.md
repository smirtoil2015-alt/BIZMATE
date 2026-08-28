# BIZMATE

**The Intelligent Operating System for Business**

BIZMATE is a multi-tenant business workspace designed to bring CRM, projects, people, finance, knowledge, reporting, automation and business intelligence into one operating layer.

## Product architecture

`Authentication → Organization → Role → Workspace → Business Data → Intelligence → Approval → Automation → Audit`

Core modules:

- Overview / Executive Command Center
- Intelligence
- Customers / CRM
- Projects
- People
- Finance
- Automations
- Knowledge
- Reports
- Settings

## Stack

- Next.js 15
- React 19
- TypeScript
- Firebase Authentication
- Firestore

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add the Firebase web configuration from your Firebase project.
4. Enable Email/Password in Firebase Authentication.
5. Deploy or apply `firestore.rules` to the Firebase project.
6. Run `npm run dev`.

## Quality checks

`npx tsc --noEmit`

`npm run build`

A GitHub Actions workflow runs the TypeScript check and production build on pushes and pull requests to `main`.

## Security notes

Real secrets must stay in Vercel/GitHub/Firebase environment or secret stores and must never be committed to this repository. Firestore access is organization-scoped and the application uses role-aware approval policies for high-impact AI actions.

## Branding

See `BRAND.md` for the full BIZMATE design system and use `public/logo.svg` / `public/bizmate-icon.svg` for product branding.

## CI status verification

The repository is configured to validate every new push to `main` through GitHub Actions. Treat a green TypeScript check and green production build as the release gate for BIZMATE.
