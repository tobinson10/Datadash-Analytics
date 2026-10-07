# DataDash production setup

## Provider accounts required

1. Create and verify a Supabase project.
2. Create and verify a Paystack business account; enable international payments.
3. Create a Vercel project and connect this GitHub repository.
4. Register a domain and add it to the Vercel project.

## Supabase

1. Run `supabase/schema.sql` in the SQL editor.
2. Create a private Storage bucket named `uploads`.
3. Configure email/password authentication and email verification.
4. Set the production site URL and approved redirect URLs to the final HTTPS domain.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values to Vercel.

## Paystack

1. Create Starter monthly/annual and Pro monthly/annual plans.
2. Create a webhook endpoint at `https://your-domain/api/paystack/webhook`.
3. Store Paystack secret values only in Vercel environment variables.
4. Verify webhook signatures before changing subscription access.
5. Test payments and renewals in test mode before activating live mode.

## Non-negotiable security rules

- Never collect or store a card number or CVV in DataDash.
- Never expose Paystack secret keys or Supabase service-role keys in the browser or GitHub.
- Grant plan access only after a verified payment-provider webhook.
- Store customer uploads in a private bucket and authorize every download.
- Enforce Free-plan limits in a server-side endpoint/database transaction, not local storage.
