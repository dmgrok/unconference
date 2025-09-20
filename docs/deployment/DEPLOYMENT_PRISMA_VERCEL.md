# Vercel Deployment with Prisma

This project uses Nuxt 3 + Prisma. Vercel builds sometimes fail if Prisma client engines are not generated correctly or if the wrong build command is used. This guide documents the split between local builds and Vercel builds.

## Environment Variables

Required (Vercel Project Settings -> Environment Variables):

| Name | Description |
| ---- | ----------- |
| DATABASE_URL | Production database URL (PostgreSQL recommended – do not use local sqlite in production) |
| GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET | GitHub OAuth |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google OAuth |
| LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET | LinkedIn OAuth |
| APP_ENV | Set to `production` on Vercel |

Optional:

| Name | Description |
| ---- | ----------- |
| NUXT_MAX_VOTES_PER_TOPIC | Override default votes |

## Local Development

```
npm install
cp environment.template .env   # set DATABASE_URL to local sqlite or dockerized db
npm run dev
```

Local build (for testing production bundle):

```
npm run build:local && npm run preview
```

## Vercel Deployment

`vercel.json` sets:

```
buildCommand: npm run build:vercel
```

The script `build:vercel` runs a specialized Prisma generate suitable for serverless. Ensure the Prisma Client is bundled by Nitro via `externals.inline`.

## Scripts Overview

| Script | Purpose |
| ------ | ------- |
| build:local | Standard build with prisma generate |
| build:vercel | Vercel build (no extra engines) |
| prisma:generate | Generic prisma generate |
| prisma:generate:vercel | Uses Data Proxy flags for smaller bundle |

## Common Issues

1. Prisma Client Not Found
   - Ensure `postinstall` ran (`npm install` triggers prisma generate)
   - Run `npm run prisma:generate` manually to verify
2. Edge Runtime Errors
   - Avoid deploying Prisma on the edge; current config forces Node (Nitro default). Do not set `edge: true` for API routes using Prisma.
3. Binary Mismatch
   - Remove custom `binaryTargets` if using Data Proxy. If deploying with direct database access on Vercel (not Data Proxy), set `binaryTargets` to `native` only.

## Adjusting for PostgreSQL

Switch datasource in `prisma/schema.prisma`:

```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Run:

```
npm run prisma:generate
npx prisma migrate deploy
```

Add a migration workflow (optional) using a `vercel build` hook if you adopt migrations instead of `db push`.

---
Keep this file updated when deployment steps change.