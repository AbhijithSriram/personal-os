# Email Reminders Setup Guide

## Overview

Firebase doesn't have built-in email reminder functionality. We need to use **Firebase Cloud Functions** + **Cloud Scheduler** to send email reminders.

## Architecture

```
User creates reminder → Stored in Firestore
                    ↓
Cloud Scheduler (runs every hour) → Checks for due reminders
                    ↓
Cloud Function → Sends emails via SendGrid/Mailgun
                    ↓
User receives email reminder
```

## Setup Steps

### 1. Install Firebase CLI & Initialize Functions

```bash
cd personal-os
npm install -g firebase-tools
firebase login
firebase init functions
```

Select:
- JavaScript (or TypeScript if you prefer)
- Install dependencies: Yes

### 2. Install Email Service (SendGrid recommended)

```bash
cd functions
npm install @sendgrid/mail
npm install node-cron
```

### 3. Get SendGrid API Key

1. Go to https://sendgrid.com/
2. Sign up for free account (100 emails/day free)
3. Go to Settings → API Keys
4. Create API Key with "Mail Send" permission
5. Copy the key

### 4. Set Environment Variable

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
firebase functions:config:set app.email="noreply@your personal-os.com"
```

### 5. Create Cloud Function

Create `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
const db = admin.firestore();

// Set SendGrid API Key
sgMail.setApiKey(functions.config().sendgrid.key);

// This function runs every hour
exports.checkReminders = functions.pubsub
  .schedule('every 1 hour')
  .onRun(async (context) => {
    const now = new Date();
    
    try {
      // Query all active reminders
      const remindersSnapshot = await db.collection('reminders')
        .where('completed', '==', false)
        .get();
      
      const emailPromises = [];
      
      remindersSnapshot.forEach(doc => {
        const reminder = doc.data();
        
        // Check if we should send a reminder
        if (shouldSendReminder(reminder, now)) {
          emailPromises.push(sendReminderEmail(reminder, doc.id));
        }
      });
      
      await Promise.all(emailPromises);
      console.log(`Processed ${emailPromises.length} reminders`);
      
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
    
    return null;
  });

function shouldSendReminder(reminder, now) {
  if (!reminder.reminderStartTime || !reminder.deadline) {
    return false;
  }
  
  const reminderStart = reminder.reminderStartTime.toDate();
  const deadline = reminder.deadline.toDate();
  const recurringInterval = reminder.recurringInterval || 24; // hours
  
  // Check if we're past reminder start time and before deadline
  if (now < reminderStart || now > deadline) {
    return false;
  }
  
  // Check if we should send based on recurring interval
  const lastSent = reminder.lastReminderSent ? 
    reminder.lastReminderSent.toDate() : 
    new Date(0);
  
  const hoursSinceLastSent = (now - lastSent) / (1000 * 60 * 60);
  
  return hoursSinceLastSent >= recurringInterval;
}

async function sendReminderEmail(reminder, reminderId) {
  try {
    // Get user email
    const userDoc = await db.collection('users').doc(reminder.userId).get();
    const userData = userDoc.data();
    
    if (!userData || !userData.email) {
      console.error(`No email found for user ${reminder.userId}`);
      return;
    }
    
    const msg = {
      to: userData.email,
      from: functions.config().app.email,
      subject: `Reminder: ${reminder.name}`,
      text: `
Hello,

This is a reminder for: ${reminder.name}

Description: ${reminder.description || 'No description'}

Deadline: ${reminder.deadline.toDate().toLocaleString('en-GB')}

Duration: ${reminder.duration || 'Not specified'} hours

---
Personal OS
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a0a0a;">Reminder: ${reminder.name}</h2>
          <p>${reminder.description || 'No description'}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;"><strong>Deadline:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${reminder.deadline.toDate().toLocaleString('en-GB')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;"><strong>Duration:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e5e5;">${reminder.duration || 'Not specified'} hours</td>
            </tr>
          </table>
          
          <p style="color: #666; font-size: 12px;">This is an automated reminder from Personal OS</p>
        </div>
      `
    };
    
    await sgMail.send(msg);
    
    // Update lastReminderSent timestamp
    await db.collection('reminders').doc(reminderId).update({
      lastReminderSent: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Sent reminder email to ${userData.email} for "${reminder.name}"`);
    
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
```

### 6. Update Firestore Security Rules

Add to your `firestore.rules`:

```javascript
match /reminders/{reminderId} {
  allow read, write: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.userId;
  
  // Allow cloud functions to update lastReminderSent
  allow update: if request.auth != null && 
    (request.auth.uid == resource.data.userId ||
     request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['lastReminderSent']));
}
```

### 7. Deploy Functions

```bash
firebase deploy --only functions
```

### 8. Enable Cloud Scheduler

1. Go to Firebase Console → Functions
2. Find `checkReminders` function
3. It will automatically create a Cloud Scheduler job
4. Or manually create in GCP Console → Cloud Scheduler

### 9. Upgrade to Blaze Plan (Required)

Cloud Functions require the Blaze (pay-as-you-go) plan:
- First 2 million invocations/month: FREE
- First 400,000 GB-seconds/month: FREE
- For this app: ~$0-1/month typical usage

## Updated Reminder Data Structure

```javascript
{
  userId: "user123",
  name: "Project Deadline",
  description: "Submit final project",
  duration: 10, // hours
  deadline: Timestamp, // December 10, 2025 17:00
  reminderStartTime: Timestamp, // December 9, 2025 07:00
  recurringInterval: 6, // hours (1-24)
  completed: false,
  lastReminderSent: Timestamp, // Last time email was sent
  createdAt: Timestamp
}
```

## Alternative: Mailgun

If you prefer Mailgun over SendGrid:

```bash
npm install mailgun-js
```

```javascript
const mailgun = require('mailgun-js')({
  apiKey: functions.config().mailgun.key,
  domain: functions.config().mailgun.domain
});

const data = {
  from: 'Personal OS <noreply@your-domain.com>',
  to: userData.email,
  subject: `Reminder: ${reminder.name}`,
  html: htmlContent
};

await mailgun.messages().send(data);
```

## Testing

### Test Locally

```bash
firebase emulators:start --only functions,firestore
```

### Test in Production

1. Create a reminder with deadline in next hour
2. Set reminderStartTime to current time
3. Wait for next hourly check
4. Check Firebase Console → Functions logs

## Troubleshooting

**Emails not sending:**
1. Check SendGrid dashboard for errors
2. Verify API key is correct
3. Check Cloud Functions logs
4. Verify user has email in Firestore

**Function not triggering:**
1. Check Cloud Scheduler in GCP Console
2. Verify function deployed correctly
3. Check quotas and billing

**Rate limiting:**
- SendGrid free: 100 emails/day
- Minimum recurring interval: 1 hour (enforced in UI)
- If many users: upgrade SendGrid plan

## Costs

**SendGrid:**
- Free: 100 emails/day
- Essentials: $19.95/month = 50,000 emails

**Firebase Functions (Blaze plan):**
- checkReminders runs 24 times/day
- ~720 invocations/month
- Cost: $0 (within free tier)

**Total cost for personal use:** $0/month

## Next Steps

1. Deploy functions
2. Test with a reminder
3. Check email inbox
4. Monitor Firebase Console logs
5. Adjust recurring intervals as needed

---

**Note:** Email delivery can take 1-5 minutes. If testing, check spam folder!
