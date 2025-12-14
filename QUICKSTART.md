# Quick Start Guide - Personal OS

Get up and running in 10 minutes!

## Prerequisites

- Node.js 18+ installed ([Download](https://nodejs.org/))
- A Google account
- Basic terminal/command line knowledge

## Setup Steps

### 1. Get the Code

```bash
# Navigate to the personal-os folder
cd personal-os

# Install dependencies
npm install
```

### 2. Set Up Firebase (5 minutes)

Follow these quick steps or see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Google Authentication**
4. Create a **Firestore Database** (production mode)
5. Copy your Firebase config from Project Settings

### 3. Configure Your App

Edit `src/firebase.js` and replace with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Set Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /dailyEntries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /healthMetrics/{metricId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 5. Run the App

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 6. First Time Use

1. **Sign in** with your Google account
2. **Complete onboarding**:
   - Set your daily schedule (college hours, bus times, etc.)
   - Add productive activities (LeetCode, Reading, Assignments, etc.)
   - Add unproductive activities (Social Media, Gaming, etc.)
   - Configure your current semester with subjects

3. **Start tracking**!
   - Go to Daily Tracker to log your hours
   - Go to Health to record daily metrics
   - Go to Reminders to manage tasks

### 7. Deploy to Firebase Hosting (Optional)

Want to access your app from anywhere? Deploy it to Firebase!

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting
# Choose: existing project, dist folder, SPA: yes

# Build and deploy
npm run build
firebase deploy --only hosting
```

Your app will be live at `https://your-project-name.web.app` 🚀

**For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## Key Features

### Daily Tracker
- Log every hour with activity, productivity level (1x-10x), and notes
- Track college attendance and units covered
- Write daily reflections
- Switch between college and non-college days

### Health Metrics
- Morning weight, water intake, steps, calories
- View 7-day averages
- Track trends over time

### Reminders & Tasks
- Create tasks with deadlines
- Set reminder periods
- Mark as complete when done

### Profile
- Edit your schedule anytime
- Update activity lists
- Manage semester information

## Tips for Success

1. **Log daily** - Set a reminder to fill out your tracker every evening
2. **Be honest** - Self-assessment only works if you're truthful
3. **Review weekly** - Check your productivity trends every Sunday
4. **Adjust activities** - Update your activity lists as your habits change
5. **Use notes** - The more detail you add, the more useful it becomes for revision

## Need Help?

- **Setup issues**: See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **General questions**: See [README.md](./README.md)
- **Firebase errors**: Check Firebase Console for quota/permissions

## What's Next?

Once you're comfortable with the basics:

1. **Explore patterns** - Look for productivity trends in your dashboard
2. **Set goals** - Use the data to identify areas for improvement
3. **Share** - Invite friends to use it (update Firebase config for multiple users)
4. **Customize** - Modify the code to fit your specific needs

## Common First-Time Issues

**"Error: Missing or insufficient permissions"**
→ Check your Firestore security rules are set correctly

**"Error: The query requires an index"**
→ Click the link in the error to create the required index

**"Can't sign in with Google"**
→ Make sure Google auth is enabled in Firebase Authentication

**"localhost not authorized"**
→ Add localhost to authorized domains in Firebase Authentication settings

---

**That's it!** You're now ready to take control of your productivity with Personal OS. 🚀
