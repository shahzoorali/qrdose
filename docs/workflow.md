# QRdose — Official Workflow

---

## Overview

QRdose is a one-tap notification service. A single tap of a card — or a scan of a QR code — instantly sends a text message to everyone who needs to know. No smartphones required for the people receiving the message. No apps to install. Nothing complicated.

---

## The Three Actors

| Who | Role |
|---|---|
| **Account Holder** | The person who owns the card and sends the notification |
| **Contacts** | Up to 10 people who receive the text message |
| **QRdose System** | Handles everything in between |

---

## Workflow A — One-Time Setup

This happens once when a new account is created.

```
Account Holder
      │
      ▼
┌─────────────────────────────────────┐
│  1. Create Account                  │
│     • Name                          │
│     • Email address                 │
│     • Phone number                  │
│     • Password                      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  2. Add Contacts                    │
│     • Name + US phone number        │
│     • Up to 10 contacts             │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  3. Write Your Notification Message │
│     • One message for all contacts  │
│     • Example:                      │
│       "Murt has taken his           │
│        medication"                  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  4. Receive Your Card               │
│     • A unique QR code is generated │
│     • Linked to your account only   │
│     • Can be placed anywhere        │
│       (fridge, pill box, desk)      │
└─────────────────────────────────────┘

                SETUP COMPLETE
```

---

## Workflow B — Daily Use (The Tap)

This happens every time the card is tapped or scanned.

```
                  ┌──────────────────────────┐
                  │  Card is Tapped or       │
                  │  QR Code is Scanned      │
                  │  (by anyone, any phone)  │
                  └────────────┬─────────────┘
                               │
                               ▼
                  ┌──────────────────────────┐
                  │  Confirmation Screen     │
                  │  appears on the phone    │
                  │                          │
                  │  "Murt has taken his     │
                  │   medication"            │
                  │                          │
                  │  [ Notify My Contacts ]  │
                  └────────────┬─────────────┘
                               │
                    Button tapped / clicked
                               │
                               ▼
                  ┌──────────────────────────┐
                  │  QRdose sends a text     │
                  │  message to all contacts │
                  │  simultaneously          │
                  └────────────┬─────────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
        ┌────────────┐  ┌────────────┐  ┌────────────┐
        │ Contact 1  │  │ Contact 2  │  │ Contact 3  │
        │ Receives   │  │ Receives   │  │ Receives   │
        │ SMS        │  │ SMS        │  │ SMS        │
        └────────────┘  └────────────┘  └────────────┘

                               │
                               ▼
                  ┌──────────────────────────┐
                  │  Screen shows:           │
                  │                          │
                  │  "Your contacts have     │
                  │   been notified."        │
                  └──────────────────────────┘
                               │
                               ▼
                  ┌──────────────────────────┐
                  │  Account holder receives │
                  │  a confirmation text as  │
                  │  a personal receipt      │
                  │  (optional)              │
                  └──────────────────────────┘
```

---

## Workflow C — What a Contact Receives

No action is required from a contact. They simply receive a text.

```
Contact's Phone
       │
       ▼
┌──────────────────────────────────────────┐
│                                          │
│  Text message received:                  │
│                                          │
│  "Murt has taken his medication          │
│   at 2:34 PM."                           │
│                                          │
│  ✓  No reply needed                      │
│  ✓  No app to download                   │
│  ✓  No link to click                     │
│                                          │
└──────────────────────────────────────────┘
```

---

## Workflow D — Account Management

At any time, the account holder can log in to the web portal to:

```
Log In to Portal
       │
       ├──▶  Update Contacts
       │         Add, edit, or remove any of the 10 contacts
       │
       ├──▶  Change the Message
       │         Edit the notification text sent to everyone
       │
       ├──▶  View Trigger History
       │         See a log of every time the card was tapped,
       │         including date, time, and how many contacts
       │         were notified
       │
       ├──▶  Manage the Card
       │         View the QR code
       │         Get the link to program an NFC card
       │         Regenerate a new card (disables the old one)
       │
       └──▶  Billing
                 Manage the subscription (via Stripe)
```

---

## Safety Features

| Feature | What it does |
|---|---|
| **Confirm before sending** | The tap shows a preview screen — a button must be pressed before any texts are sent. Accidental taps do nothing. |
| **60-second cooldown** | After a successful notification, the card cannot send again for 60 seconds. Prevents duplicate messages from multiple quick taps. |
| **Card regeneration** | If a card is lost, the account holder can instantly generate a new one. The old card stops working immediately. |
| **Private links** | Each card has a unique, unguessable link. It cannot be guessed by outsiders. |

---

## Scope — What QRdose Does and Does Not Do

### ✅ What QRdose Does
- Sends SMS text messages to up to 10 US phone numbers
- Works with any smartphone camera (no app required)
- Works with NFC tap cards
- Provides a web portal for account management
- Logs every notification with a timestamp

### ❌ What QRdose Does Not Do
- Track location or GPS
- Send emails
- Require contacts to download anything
- Send reminders or scheduled messages
- Support more than 10 contacts per account
- Work outside the United States (US numbers only)
