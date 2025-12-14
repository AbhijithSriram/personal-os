# Firebase Setup Guide

This guide will walk you through setting up Firebase for Personal OS.

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Enter project name: `personal-os` (or your choice)
4. Click **Continue**
5. Disable Google Analytics (optional, not needed for this app)
6. Click **Create project**
7. Wait for project creation, then click **Continue**

## Step 2: Enable Google Authentication

1. In the Firebase Console, click **Authentication** in the left sidebar
2. Click **Get started**
3. Click on the **Sign-in method** tab
4. Click **Google** from the list of providers
5. Toggle the **Enable** switch
6. Select a **Project support email** from the dropdown
7. Click **Save**

### For Production (when deploying):
- Add your production domain to **Authorized domains**
- For Firebase Hosting: it's added automatically
- For other hosting: manually add your domain

## Step 3: Create Firestore Database

1. Click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Select **Start in production mode**
4. Choose a location closest to you (e.g., asia-south1 for India)
5. Click **Enable**

## Step 4: Set Up Firestore Security Rules

1. In **Firestore Database**, click on the **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profiles - users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Daily entries - users can only access their own entries
    match /dailyEntries/{entryId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Health metrics - users can only access their own metrics
    match /healthMetrics/{metricId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Reminders - users can only access their own reminders
    match /reminders/{reminderId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Click **Publish**

## Step 5: Create Firestore Indexes

For optimal query performance, create these composite indexes:

### Method 1: Create Manually

1. Go to **Firestore Database** → **Indexes** tab
2. Click **Add Index**

**Index 1: dailyEntries**
- Collection ID: `dailyEntries`
- Fields to index:
  - `userId` - Ascending
  - `date` - Descending
- Query scope: Collection
- Click **Create**

**Index 2: healthMetrics**
- Collection ID: `healthMetrics`
- Fields to index:
  - `userId` - Ascending
  - `date` - Descending
- Query scope: Collection
- Click **Create**

**Index 3: reminders**
- Collection ID: `reminders`
- Fields to index:
  - `userId` - Ascending
  - `deadline` - Ascending
- Query scope: Collection
- Click **Create**

### Method 2: Automatic Creation

Alternatively, Firebase will automatically prompt you to create indexes when you run queries that need them. Just click the link in the error message.

## Step 6: Set Up Firebase Hosting

Since you want everything on Firebase, let's set up hosting:

1. In Firebase Console, click **Hosting** in the left sidebar
2. Click **Get started**
3. You'll see setup instructions - we'll do this via CLI in a moment
4. Click through the tutorial (we'll follow different steps)

## Step 7: Get Your Firebase Configuration

1. Click on the **⚙️ Settings** icon → **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **Web** icon (`</>`)
4. Register your app:
   - App nickname: `Personal OS`
   - **Check "Also set up Firebase Hosting"** ✅
   - Click **Register app**
5. Copy the `firebaseConfig` object

It will look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 8: Add Configuration to Your App

1. Open `src/firebase.js` in your project
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

## Step 9: Test Your Setup Locally

1. Run the development server:
```bash
npm run dev
```

2. Open http://localhost:3000
3. Click "Sign in with Google"
4. Complete the onboarding process
5. Try logging some data

If everything works locally, proceed to deployment! 🎉

## Step 10: Deploy to Firebase Hosting

Now let's deploy your app to Firebase so it's accessible from anywhere:

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Login to Firebase

```bash
firebase login
```

This will open your browser to authenticate.

### Initialize Firebase Hosting

```bash
firebase init hosting
```

You'll be asked several questions:

1. **"Please select an option"**
   - Choose: **Use an existing project**

2. **"Select a default Firebase project"**
   - Choose your project (the one you created earlier)

3. **"What do you want to use as your public directory?"**
   - Type: `dist`

4. **"Configure as a single-page app (rewrite all urls to /index.html)?"**
   - Type: `y` (yes)

5. **"Set up automatic builds and deploys with GitHub?"**
   - Type: `n` (no) - we'll deploy manually

6. **"File dist/index.html already exists. Overwrite?"**
   - Type: `n` (no)

### Build Your App

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Deploy to Firebase

```bash
firebase deploy --only hosting
```

Wait for deployment to complete. You'll see output like:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT/overview
Hosting URL: https://YOUR_PROJECT.web.app
```

### Access Your App

Your Personal OS is now live at:
- `https://YOUR_PROJECT.web.app`
- `https://YOUR_PROJECT.firebaseapp.com`

Both URLs work - share either one!

### Future Deployments

Whenever you make changes:

```bash
npm run build
firebase deploy --only hosting
```

That's it! Your app is now fully hosted on Firebase.

## Step 11: Test Your Deployed App

## Step 11: Test Your Deployed App

1. Open your hosting URL in a browser
2. Sign in with Google (should work automatically)
3. Complete onboarding
4. Test all features

**Note**: Your production domain is automatically added to Firebase Auth's authorized domains, so Google sign-in will work immediately.

## Common Issues

### "Firebase: Error (auth/unauthorized-domain)"

**Solution**: Add `localhost` to authorized domains:
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add `localhost` if it's not already there

### "Missing or insufficient permissions"

**Solution**: Check your Firestore security rules. Make sure they match the rules in Step 4.

### "The query requires an index"

**Solution**: Click the link in the error message to automatically create the required index, or follow Step 5 to create them manually.

## Security Best Practices

1. **Never commit your Firebase config to public repositories**
   - The API key is safe to expose in client-side code
   - But keep your project ID private if possible
   
2. **Always use proper security rules**
   - Users should only access their own data
   - Never set rules to `allow read, write: if true;` in production

3. **Enable App Check** (optional, for production)
   - Go to **App Check** in Firebase Console
   - Register your app
   - Protects against abuse and unauthorized clients

## Monitoring & Maintenance

### View Usage

1. Go to **Usage and billing** to monitor:
   - Firestore reads/writes/deletes
   - Authentication users
   - Storage usage

### Free Tier Limits (Spark Plan)

- **Firestore**: 50K reads, 20K writes, 20K deletes per day
- **Authentication**: Unlimited users
- **Storage**: 1 GB

For a single user, this is more than enough. If you plan to share with friends, consider upgrading to the Blaze (pay-as-you-go) plan.

## Backup Your Data

### Export Firestore Data

Use the Firebase CLI:

```bash
firebase firestore:export gs://your-bucket-name/backups/$(date +%Y%m%d)
```

Or set up **automatic backups** in the Firebase Console (requires Blaze plan).

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
