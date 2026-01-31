# Deploy

## Netlify (recommended)

1. Connect your Git repository to Netlify (GitHub/GitLab/Bitbucket).
2. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables in Netlify UI (Project → Site settings → Build & deploy → Environment):
   - `API_KEY` — used by `vite.config.ts`

Optional: We added a GitHub Actions workflow at `.github/workflows/deploy-netlify.yml`. To use it:

- Add these GitHub Secrets in your repository: `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`.
- Push to the `main` branch to trigger the workflow which builds and deploys `dist` to Netlify.

## Local verification

```bash
npm install
npm run build
npx serve dist
```

## Vercel (alternative)

1. Connect your repository to Vercel.
2. Use build command `npm run build` and output directory `dist`.
3. Set `API_KEY` in Vercel Project → Settings → Environment Variables.
