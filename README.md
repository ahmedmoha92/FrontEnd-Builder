# GenUI Builder

> Lightweight Vite + React + TypeScript UI builder for composing, generating, and previewing UI components.

This repository contains everything you need to run and develop the GenUI Builder app locally and deploy it.

## Quick Links
- View the running demo in AI Studio: https://ai.studio/apps/drive/1ayFz6mnkumaaqYcdBbVELlgrRzO_2z1Q

## Features
- Fast development using `vite` and TypeScript
- Component rendering utilities in `components/Renderers.tsx`
- Generation/integration helpers in `services/geminiService.ts`
- Minimal, extensible scaffold for building UI generators or component libraries

## Run Locally

### Prerequisites
- Node.js 16+ and npm (or yarn / pnpm)

### Setup
1. Install dependencies:
```bash
npm install
```
2. Add `.env.local` and set the `GEMINI_API_KEY` to your Gemini API key (if using generation features):

```.env.local
GEMINI_API_KEY=your_api_key_here
```
3. Run the development server:

```bash
npm run dev
```

### Build and Preview (production)
```bash
npm run build
npm run preview
```

## Project Structure
- `App.tsx` — main app component
- `index.tsx` — app entry
- `components/Renderers.tsx` — renderer components
- `services/geminiService.ts` — generation/integration service
- `metadata.json`, `netlify.toml` — project metadata / deployment hints
- `package.json`, `vite.config.ts`, `tsconfig.json` — build & config

## Usage
- Use the UI to compose components and preview outputs.
- Extend `components/Renderers.tsx` to add new renderers.
- Integrate generation workflows via `services/geminiService.ts`.

## Contributing
- Fork the repository and create a feature branch.
- Add tests where applicable and keep changes focused.
- Open a pull request describing your change and rationale.

## License
MIT — change to your preferred license if needed.

## Topics
react, vite, typescript, ui-builder, component-library, codegen
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ayFz6mnkumaaqYcdBbVELlgrRzO_2z1Q

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
