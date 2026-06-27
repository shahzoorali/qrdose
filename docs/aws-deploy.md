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

Do **not** set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — the service role
supplies them.

## Post-deploy checklist

- [ ] Point your domain at the Amplify app and set `APP_BASE_URL` to match.
- [ ] Add the Stripe webhook endpoint `https://<domain>/api/...` and paste the
      signing secret into `STRIPE_WEBHOOK_SECRET`.
- [ ] Verify SNS is out of the SMS sandbox for production sending.
- [ ] Confirm DynamoDB TTL is enabled on the `ttl` attribute (the create-table
      script does this).
