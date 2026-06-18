# QRdose

Tap-to-notify. A user sets up an account, adds up to 10 contacts and one
notification message (e.g. _"Murt has taken his medication"_), and receives a
QR + NFC card. When anyone taps the card or scans the QR with a plain phone
camera (no app), QRdose texts all the user's contacts. Everything is managed
through a web portal.

**US-only.** All AWS services run in **us-east-1**; SMS goes to **+1** numbers.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **AWS DynamoDB** — single-table design (`@aws-sdk/lib-dynamodb`)
- **AWS SNS** — transactional SMS (`@aws-sdk/client-sns`)
- **Auth.js (NextAuth v5)** — email + password, JWT sessions, bcrypt

## Project layout

```
src/
  app/
    page.tsx                  landing page
    signup/ login/            auth pages
    t/[cardId]/               public trigger confirm page ("Notify my contacts")
    dashboard/                portal: overview, contacts, message, card, history, billing
    api/
      auth/[...nextauth]/     Auth.js handler
      signup/                 create account
      contacts/[id]/          contact CRUD (max 10 enforced)
      message/                update notification message
      card/regenerate/        rotate the QR/NFC link
      history/                trigger log
      trigger/[cardId]/       PUBLIC: resolve card -> fan out SMS via SNS
  lib/
    dynamo.ts sns.ts qrcode.ts auth.ts phone.ts ids.ts validation.ts
    repositories/             users, contacts, cards, history
  middleware.ts               protects /dashboard/*
scripts/create-table.ts       one-time DynamoDB provisioning
```

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Configure environment** — copy `.env.example` to `.env.local` and fill in:

   ```
   APP_BASE_URL=http://localhost:3000
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   DYNAMODB_TABLE=QRdose
   SNS_SENDER_ID=                 # optional origination/sender ID
   AUTH_SECRET=                   # openssl rand -base64 32
   AUTH_TRUST_HOST=true
   TRIGGER_COOLDOWN_SECONDS=60
   RESET_CODE_TTL_SECONDS=900
   # Stripe — leave blank until ready (billing stays disabled):
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   STRIPE_PRICE_ID=
   ```

3. **Create the DynamoDB table** (once, against AWS us-east-1):

   ```bash
   npm run create-table
   ```

4. **Run**

   ```bash
   npm run dev
   ```

## AWS provisioning

1. **DynamoDB** — `npm run create-table` creates table `QRdose` (PK/SK) with
   `GSI1` for email login lookup, in `us-east-1`, pay-per-request.
2. **IAM** — the credentials need:
   - `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query` on the
     table and its `GSI1` index.
   - `sns:Publish`.
3. **SNS (us-east-1)** — a production SMS account is already in place, so SMS
   can be sent to any valid US number. Confirm the monthly SMS spend limit and,
   if desired, set `SNS_SENDER_ID` to a registered origination number / sender
   ID for delivery to US (+1) numbers. SNS sends both the trigger notifications
   and the password-reset codes.
4. **DynamoDB TTL** — `npm run create-table` also enables TTL on the `ttl`
   attribute (auto-expires rate-limit counters and password-reset codes).

## Billing (Stripe) — enable when ready

Billing is fully pre-wired but **disabled until all three Stripe env vars are
set**. While disabled, the billing page shows "coming soon" and no subscription
is required to use the app.

To turn it on:

1. Create a recurring **Price** in Stripe and copy its id → `STRIPE_PRICE_ID`.
2. Set `STRIPE_SECRET_KEY` (from the Stripe dashboard).
3. Add a webhook endpoint pointing at `https://<your-domain>/api/stripe/webhook`
   for events `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`; copy its signing secret → `STRIPE_WEBHOOK_SECRET`.

Once set, the billing page shows a **Subscribe** button (Stripe Checkout), the
webhook syncs `subscriptionStatus` onto the user, and the trigger endpoint
requires an active subscription. No code changes needed.

## Password reset

Passwordless reset over SMS: a user requests a code by email, QRdose texts a
6-digit code to the phone on the account (via SNS), and the code is verified to
set a new password. Codes are single-active, hashed, expire after
`RESET_CODE_TTL_SECONDS`, allow 5 attempts, and auto-purge via DynamoDB TTL.

## Rate limiting

A DynamoDB-backed fixed-window limiter protects `signup`, `forgot-password`,
`reset-password`, and the public `trigger` endpoint (per IP). It fails open so
infra issues never block legitimate use; the per-card cooldown still guards
repeat taps.

## Deployment

The app builds as a self-contained server (`output: "standalone"`).

- **AWS Amplify Hosting** — use `amplify.yml`; set all env vars in the Amplify
  console.
- **AWS ECS / Fargate (or any container host)** — build the included
  `Dockerfile` (`docker build -t qrdose .`), push to ECR, run with the env vars
  set on the task definition. Container listens on port 3000.

Set `APP_BASE_URL` and `AUTH_TRUST_HOST=true` for the deployed domain.

## How the trigger works

- The QR code and the NFC card both encode the same URL:
  `${APP_BASE_URL}/t/<cardId>`. `cardId` is a high-entropy random token — the
  URL itself is the capability, so the card is not guessable.
- Tapping/scanning opens a **confirmation page** with a single
  **"Notify my contacts"** button (prevents accidental sends and link
  prefetching). On confirm, the app resolves the card to its owner, formats the
  message with the current time in the owner's timezone, and sends the SMS to
  all contacts in parallel via SNS. A per-card cooldown
  (`TRIGGER_COOLDOWN_SECONDS`) blocks rapid repeat taps.

## Out of scope (initial version)

GPS/location, email notifications, mobile app, scheduled reminders, more than 10
contacts. **Stripe** billing is a placeholder until the Stripe account is ready.
Physical card production / NFC programming is an operational step — the app
provides the QR image and the trigger URL.
