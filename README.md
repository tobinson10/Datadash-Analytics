# DataDash Analytics

A responsive spreadsheet-to-dashboard web app for turning CSV and Excel files into clear business dashboards.

## Run locally

1. Install a current Node.js LTS release (20+ recommended).
2. Run `npm install`.
3. Run `npm run dev` and open the address shown.

Use `npm run test` for unit tests and `npm run build` for a production build.

## Included today

- Landing page and spreadsheet upload flow
- CSV/XLS/XLSX parsing (first worksheet), data profiling, blank-row removal
- Data quality summary, safe value trimming, column/type detection
- Data-driven KPIs, filters, charts, deterministic insights, and a clean-data table
- A landing page with product, pricing, privacy, terms, and contact sections
- A local demo account experience with Free, Starter, and Pro plans; the Free plan allows two dashboard creations

## Before public launch

The plan picker and account screens are currently a local demonstration only. Before accepting real customers, connect Supabase for secure authentication and data storage, Paystack for hosted card checkout and subscriptions, and Vercel with a domain you own. See [the production setup guide](docs/PRODUCTION_SETUP.md).

No uploaded spreadsheet is sent to a server in the current version. Authentication, billing, persistence, and multi-sheet selection are not yet connected to live services.
