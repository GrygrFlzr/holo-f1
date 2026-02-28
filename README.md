# holocord F1 Predictions

This is a community-oriented prediction tournament where users predict Formula 1 weekend outcomes, earn scores per correct question-answer pair, and compete on both individual and team leaderboards.

## Developing

Install dependencies using `pnpm install`, then, you will need to apply database migrations both initially, and every time you add migrations.

```bash
# for dev
pnpm exec wrangler d1 migrations apply holo-f1 --local
# for prod
pnpm exec wrangler d1 migrations apply holo-f1 --remote
```

Conventionally, prefer backwards-compatible schema changes so that any existing workers dealing with newer schema do not behave unexpectedly.

## Building

```bash
pnpm run build
```
