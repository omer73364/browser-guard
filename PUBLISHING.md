# Publishing Browser Guard

`browser-guard@1.0.1` is published on npm. Its version-pinned CDN build is https://cdn.jsdelivr.net/npm/browser-guard@1.0.1/guard.js. Never republish an existing version; future package changes require a new version.

## Checks

```sh
npm test
npm run test:types
npm run check
npm run test:browser
npm run test:integration:prepare
npm run test:integration
npm run build:site
```

## Website

`npm run build:site` prepares public assets in `dist/`, including the favicon. Publish only this directory, never the workspace or local credentials.

The public Sites project is identified in `.openai/hosting.json`. Keep that identity when updating it.

## GitHub Pages

Source lives on `main`; static website assets live on `gh-pages`. Configure Pages to deploy from the `gh-pages` branch at `/`. Relative links support the repository subpath.

An optional Actions workflow template is at `.github/pages-workflow.example.yml`. To use it later, move it into `.github/workflows/pages.yml` with a credential permitted to manage workflows and select GitHub Actions in Pages settings.

## Package updates

Review the package file list with `npm pack --dry-run`, update the version, then publish with `npm publish --access public`. Complete npm authentication directly; never commit tokens.
