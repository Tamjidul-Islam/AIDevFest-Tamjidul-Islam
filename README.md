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

- Iteration 3: package generation and download as `<tender_id>_Package.pdf`
  - Page 1: English cover (tender ID, title, entity, bidder, deadline, date made, included documents in order)
  - Then every page of each matched file in `order`, original page order; optional documents without a file are skipped
  - Footer `<tender_id> | Page X of Y` on every page including the cover. Each document page is placed on a slightly taller page so the footer never covers content
  - Matched files that cannot be read (damaged / password-protected) block generation with a clear message
  - Bonus: checklist export to CSV (document, file name, pages, expiry date, status)

## Known problems
- Bangla text is not drawn on the PDF cover (standard Latin font); non-Latin characters in tender fields appear as `?`
- Links/form fields inside source PDFs are flattened into the package pages

## Not implemented (bonus)
Index page, seal/signature, save/reopen, auto-match, AI help.

## Submission checklist
Add `output/<tender_id>_Package.pdf` (generate it in the app from the sample pack) and a `screenshots/` folder with a screenshot of the status table. Add your name, registration number and live link above.

## AI tool used
Claude (Anthropic)
