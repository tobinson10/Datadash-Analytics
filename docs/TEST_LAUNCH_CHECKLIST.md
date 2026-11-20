# DataDash testing launch checklist

## Already implemented

- Responsive public landing page, navigation sections, and complete footer
- CSV/XLS/XLSX parsing, data quality checks, charts, filters, insights, and clean-data table
- Supabase email/password account flow
- Private Supabase uploads bucket with per-user path protections
- Protected account, workspace, dashboard, subscription, and usage schema
- Authenticated Vercel API route for saving dashboard snapshots
- Security advisor checks with no active Supabase warnings

## Required environment variables in Vercel

Set these in Vercel > DataDash project > Settings > Environment Variables for Production and Preview:

- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY

Do not add service-role or Paystack secret values to GitHub, browser code, or chat.

## Required Supabase dashboard setup

1. In Authentication > URL Configuration, set the Site URL to the Vercel URL.
2. Add the Vercel URL as an approved Redirect URL.
3. Keep email confirmation enabled.
4. For production, configure a custom SMTP sender before inviting customers.

## Test flow

1. Create a new account and confirm the email.
2. Sign in and upload a CSV or XLSX file.
3. Create two Free dashboards and confirm the limit message on the third.
4. Sign out, sign in again, and check that the saved dashboard snapshot is available once the dashboard-list UI is enabled.
5. Test with a phone-sized browser view.
6. Repeat the above in a Vercel Preview deployment before every production change.

## Billing is intentionally not live yet

Before enabling Starter or Pro checkout, create and verify a Paystack account, create the four plans, configure Vercel secrets, and test verified webhook events in Paystack test mode.
