# QRdose — AWS Deployment

Minimal-budget architecture. The app is a full-stack **Next.js 15** project, so
Amplify Hosting runs both the frontend and the backend (API routes / server
actions). No separate backend service is needed.

## Components

| Layer            | Service                          | Notes                                              |
| ---------------- | -------------------------------- | -------------------------------------------------- |
| Frontend + API   | **Amplify Hosting** (Next.js SSR)| One deploy covers UI and `src/app/**` API routes.  |
| Database         | **DynamoDB** (single table)      | `PAY_PER_REQUEST`; free tier covers low traffic.   |
| SMS              | **SNS**                          | Pay-per-message; no fixed cost.                    |
| Auth             | **NextAuth (Auth.js v5)**        | No AWS service required.                            |
| Billing          | **Stripe**                       | External; per-transaction only.                    |
| Secrets/config   | **Amplify env vars**             | Set in console, not in `amplify.yml`.              |

Estimated fixed cost at low traffic: **~$0–5/mo** (plus per-SMS and per-Stripe-txn).

## IAM — use an Amplify service role (no access keys)

Because we attach an IAM role to the Amplify app, **do not set
`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`** in Amplify. The AWS SDK picks up
the role credentials automatically. (Those keys are only for local dev in
`.env.local`.)

1. Create the DynamoDB table once (locally or via CloudShell):
   `npm run create-table`  (region `us-east-1`, table `QRdose`).
2. Create an IAM role for Amplify compute and attach this least-privilege policy
   (replace `<ACCOUNT_ID>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDB",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:<ACCOUNT_ID>:table/QRdose",
        "arn:aws:dynamodb:us-east-1:<ACCOUNT_ID>:table/QRdose/index/*"
      ]
    },
    {
      "Sid": "SNSPublishSMS",
      "Effect": "Allow",
      "Action": ["sns:Publish"],
      "Resource": "*"
    }
  ]
}
```

3. In the Amplify console: **App settings → IAM roles → Compute role** → select
   the role above.

> Note: `sns:Publish` for SMS goes to phone numbers, not a topic ARN, so it
> requires `"Resource": "*"`. Scope it down with a condition if desired.

## Environment variables (Amplify console)

Required:

| Variable             | Value / how to get it                                  |
| -------------------- | ------------------------------------------------------ |
| `APP_BASE_URL`       | Your live URL, e.g. `https://app.qrdose.com`           |
| `AWS_REGION`         | `us-east-1`                                             |
| `DYNAMODB_TABLE`     | `QRdose`                                                |
| `AUTH_SECRET`        | `openssl rand -base64 32`                               |
| `AUTH_TRUST_HOST`    | `true`                                                  |

Optional / feature-gated:

| Variable                  | Notes                                             |
| ------------------------- | ------------------------------------------------- |
| `SNS_SENDER_ID`           | Leave blank to let SNS pick a default identity.   |
| `TRIGGER_COOLDOWN_SECONDS`| Default `60`.                                     |
| `RESET_CODE_TTL_SECONDS`  | Default `900`.                                    |
| `STRIPE_SECRET_KEY`       | Billing stays disabled until all three are set.   |
| `STRIPE_WEBHOOK_SECRET`   | From the Stripe webhook endpoint.                 |
| `STRIPE_PRICE_ID`         | The subscription price.                           |
| `SES_FROM_EMAIL`          | Verified sender. Blank disables reminder emails.  |
| `CRON_SECRET`             | Blank leaves the reminder cron disabled.          |
| `DEFAULT_REMINDER_GRACE_MINUTES` | Default `30`.                              |
| `DOSE_MATCH_WINDOW_MINUTES`      | Default `180`.                             |

Do **not** set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — the service role
supplies them.

## Medication reminders (SES + EventBridge)

Reminders need two AWS pieces beyond the app itself.

### 1. SES — sending the emails

The `qrdose.com` domain identity is verified, which lets SES send **as**
that domain. Sending **to** arbitrary addresses also requires production
access: while the account is in the SES sandbox, mail is only delivered to
verified recipients, so contact escalation emails will be silently dropped.

- [ ] Request SES production access for `us-east-1` (Account dashboard →
      "Request production access"). Approval is typically under 24 hours.
- [ ] Set `SES_FROM_EMAIL` to a sender on the verified domain.
- [ ] Grant the Amplify service role `ses:SendEmail`.

SMS reminders work without any of this — email is additive, and the app
no-ops email cleanly when `SES_FROM_EMAIL` is blank.

### 2. EventBridge — running the sweep

`POST /api/cron/reminders` does one pass: it walks every account with
reminders on and sends whatever is due. It is idempotent (all state lives in
per-dose records), so running it early, twice, or concurrently sends no
duplicates.

Create an **EventBridge Scheduler** schedule:

- Schedule: `rate(5 minutes)`
- Target: **API destination** pointing at
  `https://<domain>/api/cron/reminders`, method `POST`
- Header: `x-cron-secret: <the CRON_SECRET value>`

The endpoint returns `401` unless the header matches `CRON_SECRET`, and stays
disabled entirely while `CRON_SECRET` is blank — so nothing fires until you
deliberately turn it on.

Reminder cadence is per account: the user is texted and emailed at
(dose time + their grace window), and contacts are notified only if the dose
is still unconfirmed at double that. A dose stops being actionable roughly 6
hours after the escalation point.

## Post-deploy checklist

- [ ] Point your domain at the Amplify app and set `APP_BASE_URL` to match.
- [ ] Add the Stripe webhook endpoint `https://<domain>/api/...` and paste the
      signing secret into `STRIPE_WEBHOOK_SECRET`.
- [ ] Verify SNS is out of the SMS sandbox for production sending.
- [ ] Confirm DynamoDB TTL is enabled on the `ttl` attribute (the create-table
      script does this).
- [ ] Request SES production access, then set `SES_FROM_EMAIL`.
- [ ] Set `CRON_SECRET` and create the EventBridge schedule for
      `/api/cron/reminders`.
