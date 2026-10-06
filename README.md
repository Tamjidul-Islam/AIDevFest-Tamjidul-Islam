# Tender Package Builder

Frontend-only web app (AI DevFest) that helps office staff turn PDF files into one checked, ordered tender PDF package. Runs fully in the browser; no files are uploaded anywhere.

## Install
```bash
npm install
```

## Run locally
```bash
npm run dev       # development server
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Technologies
React 18, Vite, pdf-lib (page counting now; merging and footers later). English and Bangla UI.

## Implemented so far
- Iteration 2: match files to documents (one-to-one, undo any time), expiry dates, live status engine (Missing / Expiry date needed / Expired / Not provided / OK), SHA-256 duplicate detection (duplicates marked and cannot be matched to different documents), Generate button disabled with reasons

### Iteration 1
- Loads `requirements.json` (file picker; a copy in `public/` auto-loads as a sample) and shows all tender fields dynamically
- Required documents sorted by `order`, with Mandatory/Optional and expiry info
- English/Bangla switch for the whole interface and document names
- Multi-PDF upload (button or drag-and-drop): rejects non-PDFs, max 30 files, max 50 MB total
- Shows file name, page count, size; remove files; unreadable PDFs flagged without crashing
- "What to do next" step guide

## Remaining for later iterations
Cover page, footers, package generation/download, and bonus features.

## AI tool used
Claude (Anthropic)
