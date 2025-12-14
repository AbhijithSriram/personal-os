# Firebase Hosting Setup Guide

## Overview

This guide will walk you through deploying your Personal OS to Firebase Hosting step-by-step.

---

## Prerequisites

✅ You already have:
- Firebase project created
- Firestore database set up
- Google Authentication enabled
- Firebase config in `src/firebase.js`

⚠️ You need:
- Node.js installed (check with `node --version`)
- npm installed (check with `npm --version`)

---

## Step-by-Step Setup

### Step 1: Install Firebase CLI

Open your terminal and run:

```bash
npm install -g firebase-tools
```

**Verify installation:**
```bash
firebase --version
```

You should see something like: `13.0.0` or higher

---

### Step 2: Login to Firebase

In your terminal, run:

```bash
firebase login
```

**What happens:**
1. Opens browser window
2. Select your Google account (same one used for Firebase)
3. Click "Allow"
4. See "Success! You're logged in" in terminal

**Troubleshoot:**
- If already logged in, you'll see: "Already logged in as your-email@gmail.com"
- If stuck, try: `firebase login --reauth`

---

### Step 3: Navigate to Project Folder

```bash
cd path/to/personal-os
```

**Example:**
```bash
# Windows
cd C:\Users\YourName\Downloads\personal-os

# Mac/Linux
cd ~/Downloads/personal-os
```

**Verify you're in the right place:**
```bash
ls
# Should see: package.json, src/, index.html, etc.
```

---

### Step 4: Initialize Firebase Hosting

Run:
```bash
firebase init hosting
```

**You'll see a series of questions. Here's exactly what to choose:**

#### Question 1: "Please select an option"
```
? Please select an option:
  ❯ Use an existing project
    Create a new project
    Add Firebase to an existing Google Cloud Platform project
```
**Choose:** `Use an existing project` (press Enter)

---

#### Question 2: "Select a default Firebase project"
```
? Select a default Firebase project for this directory:
  ❯ personal-os-10a45 (personal-os)
    other-project-123 (other-project)
```
**Choose:** Your project (the one you created earlier)
**How:** Use arrow keys, press Enter

---

#### Question 3: "What do you want to use as your public directory?"
```
? What do you want to use as your public directory? (public)
```
**Type:** `dist` (then press Enter)

**Important:** NOT "public" - we use "dist" because Vite builds to the `dist` folder.

---

#### Question 4: "Configure as a single-page app?"
```
? Configure as a single-page app (rewrite all urls to /index.html)? (y/N)
```
**Type:** `y` (then press Enter)

**Why:** React apps need this for routing to work properly.

---

#### Question 5: "Set up automatic builds and deploys with GitHub?"
```
? Set up automatic builds and deploys with GitHub? (y/N)
```
**Type:** `N` (then press Enter)

**Why:** We'll deploy manually for now. You can set this up later if you want.

---

#### Question 6: "File dist/index.html already exists. Overwrite?"
```
? File dist/index.html already exists. Overwrite? (y/N)
```
**Type:** `N` (then press Enter)

**Important:** DON'T overwrite! We need our own index.html.

---

**Success Message:**
```
✔  Firebase initialization complete!
```

---

### Step 5: Verify Firebase Configuration

Check that these files were created:

```bash
ls -la
```

You should see:
- `.firebaserc` - Project configuration
- `firebase.json` - Hosting configuration

**Check firebase.json contents:**
```bash
cat firebase.json
```

Should look like:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**If different, manually edit `firebase.json` to match above.**

---

### Step 6: Install Project Dependencies

```bash
npm install
```

**What this does:**
- Installs React, Vite, Firebase SDK, etc.
- Creates `node_modules/` folder
- Takes 1-2 minutes

**Success indicator:**
```
added 234 packages in 45s
```

---

### Step 7: Build Your App

```bash
npm run build
```

**What this does:**
- Compiles React code
- Bundles JavaScript
- Optimizes for production
- Creates `dist/` folder

**Success indicator:**
```
✓ built in 3.45s
dist/index.html                   0.45 kB
dist/assets/index-a1b2c3d4.css   12.34 kB
dist/assets/index-a1b2c3d4.js    567.89 kB
```

**Troubleshoot:**
- Error about Firebase config? → Check `src/firebase.js` has your credentials
- Build fails? → Make sure all npm packages installed in Step 6

---

### Step 8: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

**What happens:**
1. Uploads files from `dist/` folder
2. Deploys to Firebase CDN
3. Takes 30-60 seconds

**Success Message:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/personal-os-10a45/overview
Hosting URL: https://personal-os-10a45.web.app
```

**Your app is now LIVE! 🎉**

---

### Step 9: Access Your App

Open the Hosting URL in your browser:

```
https://personal-os-10a45.web.app
```

**Replace `personal-os-10a45` with YOUR project ID**

You should see:
1. Login page
2. Click "Sign in with Google"
3. Authenticate
4. Go through onboarding
5. Start using your app!

---

## Quick Reference: Deploy Commands

**Build and deploy in one go:**
```bash
npm run build && firebase deploy --only hosting
```

**View deployment history:**
```bash
firebase hosting:channel:list
```

**Rollback to previous version:**
```bash
firebase hosting:clone personal-os-10a45:live personal-os-10a45:previous
```

---

## Folder Structure After Setup

```
personal-os/
├── .firebaserc          ← NEW: Firebase project config
├── firebase.json        ← NEW: Hosting configuration
├── dist/                ← NEW: Built files (created by npm run build)
│   ├── index.html
│   ├── assets/
│   │   ├── index-[hash].js
│   │   └── index-[hash].css
│   └── favicon.ico
├── src/                 ← Your source code
│   ├── pages/
│   ├── components/
│   └── firebase.js
├── public/              ← Static assets
├── package.json
├── vite.config.js
└── index.html          ← Template (NOT deployed directly)
```

**Important:**
- `dist/` is auto-generated - DON'T edit files here
- Edit files in `src/` then rebuild
- `dist/` is gitignored - not committed to git

---

## Custom Domain Setup (Optional)

### Step 1: Add Custom Domain

In Firebase Console:
1. Go to Hosting
2. Click "Add custom domain"
3. Enter domain: `yoursite.com`
4. Follow DNS setup instructions

### Step 2: Update DNS Records

Add these to your domain registrar (GoDaddy, Namecheap, etc.):

**For root domain (yoursite.com):**
```
Type: A
Name: @
Value: [IP provided by Firebase]
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: [URL provided by Firebase]
```

### Step 3: Verify

Wait 24-48 hours for DNS propagation.

Check status in Firebase Console → Hosting.

---

## Environment Variables

If you want different configs for development vs production:

### Step 1: Create .env files

```bash
# .env.development
VITE_FIREBASE_API_KEY=dev-api-key
VITE_FIREBASE_PROJECT_ID=dev-project

# .env.production
VITE_FIREBASE_API_KEY=prod-api-key
VITE_FIREBASE_PROJECT_ID=prod-project
```

### Step 2: Update firebase.js

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ...
};
```

### Step 3: Build with environment

```bash
npm run build  # Uses .env.production
```

---

## Continuous Deployment with GitHub Actions (Advanced)

If you want auto-deploy on git push:

### Step 1: Generate CI Token

```bash
firebase login:ci
```

Copy the token shown.

### Step 2: Add GitHub Secret

1. Go to your GitHub repo
2. Settings → Secrets → Actions
3. New repository secret:
   - Name: `FIREBASE_TOKEN`
   - Value: [paste token]

### Step 3: Create Workflow File

Create `.github/workflows/firebase-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_TOKEN }}'
          channelId: live
          projectId: personal-os-10a45
```

Now every push to `main` auto-deploys!

---

## Troubleshooting

### Problem: "Firebase command not found"
**Solution:**
```bash
npm install -g firebase-tools
```

### Problem: "Permission denied"
**Solution:**
```bash
# Mac/Linux
sudo npm install -g firebase-tools

# Windows: Run terminal as Administrator
```

### Problem: "Build failed"
**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problem: "Blank page after deploy"
**Solution:**
1. Check browser console for errors
2. Verify Firebase config in `src/firebase.js`
3. Check Firestore security rules
4. Clear browser cache: Ctrl+Shift+R

### Problem: "Authentication not working"
**Solution:**
1. Firebase Console → Authentication
2. Add your hosting domain to authorized domains:
   - `https://personal-os-10a45.web.app`
   - `https://personal-os-10a45.firebaseapp.com`

### Problem: "Routing not working (404 on refresh)"
**Solution:**
Check `firebase.json` has:
```json
"rewrites": [
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

---

## Cost & Limits

**Firebase Hosting Free Tier:**
- ✅ 10 GB storage
- ✅ 360 MB/day bandwidth
- ✅ SSL certificate (HTTPS)
- ✅ Global CDN
- ✅ Custom domain

**Typical Personal OS Usage:**
- App size: ~2 MB
- User visits: ~100/month
- Bandwidth used: ~200 MB/month
- **Cost: $0/month** ✅

**If you exceed free tier:**
- Blaze plan: Pay-as-you-go
- Hosting: $0.026/GB storage + $0.15/GB bandwidth
- Typical cost even with heavy use: $1-3/month

---

## Deployment Checklist

Before each deploy:

- [ ] All code changes committed
- [ ] `npm install` run (if dependencies changed)
- [ ] `npm run build` successful
- [ ] Test locally: `npm run dev`
- [ ] Firebase config correct
- [ ] Firestore rules updated (if needed)
- [ ] Run: `firebase deploy --only hosting`
- [ ] Visit live URL to verify
- [ ] Test login flow
- [ ] Test key features

---

## Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Build
echo "📦 Building app..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful"
  
  # Deploy
  echo "🌐 Deploying to Firebase..."
  firebase deploy --only hosting
  
  if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🎉 App is live at your Hosting URL"
  else
    echo "❌ Deployment failed"
  fi
else
  echo "❌ Build failed"
fi
```

**Make it executable:**
```bash
chmod +x deploy.sh
```

**Use it:**
```bash
./deploy.sh
```

---

## What to Do After First Deploy

1. **Test Everything:**
   - Login with Google
   - Complete onboarding
   - Add daily entries
   - Check attendance
   - Test reminders
   - Verify profile editing

2. **Share Your App:**
   - URL works on any device
   - Share with friends/family
   - Works on mobile browsers
   - Can add to home screen (PWA)

3. **Monitor Usage:**
   - Firebase Console → Hosting
   - See visitor stats
   - Check bandwidth usage
   - View error logs

4. **Set Up Analytics (Optional):**
   ```bash
   firebase init analytics
   firebase deploy --only hosting,analytics
   ```

---

## Next Steps

✅ App is now live and accessible worldwide!

**Possible enhancements:**
1. Add custom domain
2. Set up GitHub Actions for auto-deploy
3. Enable Analytics
4. Add Performance Monitoring
5. Set up Cloud Functions (for email reminders)

---

**Your app is deployed! 🎉**

**Live URL:** `https://your-project-id.web.app`

**Happy tracking!** 📊
