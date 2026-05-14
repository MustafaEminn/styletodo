# Agents Guide

This file is the working contract for AI/human agents contributing to this repository.

## Project

- Name: `styletodov3`
- Stack: React + TypeScript + Vite + Tailwind CSS
- Package manager: npm (`package-lock.json` present)

## Setup

```bash
npm install
```

## Common Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run format
npm run preview
```

## Working Rules

1. Keep changes scoped and minimal.
2. Prefer reusable UI components over duplicated markup.
3. Preserve TypeScript strictness and fix type errors instead of silencing them.
4. Run `npm run lint` and `npm run typecheck` before finalizing non-trivial changes.
5. Avoid large visual/style shifts unless explicitly requested.

## App Structure (high level)

- `src/App.tsx`: main app composition
- `src/components/`: reusable UI and providers
- `public/`: static assets

## Notes

- If you introduce new conventions, update this file in the same PR.
