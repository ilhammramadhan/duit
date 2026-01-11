# Duit - Simple Financial Tracker

A dead-simple personal finance tracker PWA with AI-powered categorization.

## Features

- Quick entry: Type naturally "bakso 15rb" → auto-categorized
- Smart categorization: Keyword matching + Gemini AI fallback
- Budget tracking with visual warnings
- Daily/weekly/monthly spending views
- AI-generated savings insights
- Offline-first PWA
- Data export/import

## Tech Stack

- SvelteKit (Svelte 5 with runes)
- Tailwind CSS
- Dexie.js (IndexedDB)
- Gemini API
- vite-plugin-pwa

## Development

```bash
npm install
npm run dev
```

## Environment Variables

```
VITE_GEMINI_API_KEY=your_api_key_here
```
