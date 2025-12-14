# Deployment Guide - Firebase Hosting

Complete guide to deploy Personal OS to Firebase Hosting.

## Prerequisites

- Completed Firebase setup (Authentication, Firestore, Security Rules)
- Firebase config added to `src/firebase.js`
- App tested locally with `npm run dev`
- Firebase CLI installed globally

## Step-by-Step Deployment

### 1. Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

### 2. Login to Firebase

```bash
firebase login
```

This opens your browser for authentication. Sign in with the same Google account you used for Firebase Console.

### 3. Initialize Firebase Hosting

Navigate to your project directory:
```bash
cd personal-os
```

Initialize Firebase:
```bash
firebase init hosting
```

**Answer the prompts:**

```
? Please select an option: 
  ❯ Use an existing project

? Select a default Firebase project for this directory: 
  ❯ your-project-name (Your Project Name)

? What do you want to use as your public directory? 
  ❯ dist

? Configure as a single-page app (rewrite all urls to /index.html)? 
  ❯ Yes

? Set up automatic builds and deploys with GitHub? 
  ❯ No

? File dist/index.html already exists. Overwrite? 
  ❯ No
```

This creates two files:
- `firebase.json` - Hosting configuration
- `.firebaserc` - Project configuration

### 4. Build Your App

Create an optimized production build:

```bash
npm run build
```

This creates a `dist` folder with your compiled app.

### 5. Preview Before Deploying (Optional)

Test the production build locally:

```bash
firebase serve
```

Open http://localhost:5000 to preview.

Press `Ctrl+C` to stop the preview.

### 6. Deploy to Firebase

Deploy your app:

```bash
firebase deploy --only hosting
```

You'll see output like:

```
=== Deploying to 'your-project-name'...

i  deploying hosting
i  hosting[your-project-name]: beginning deploy...
i  hosting[your-project-name]: found 15 files in dist
✔  hosting[your-project-name]: file upload complete
i  hosting[your-project-name]: finalizing version...
✔  hosting[your-project-name]: version finalized
i  hosting[your-project-name]: releasing new version...
✔  hosting[your-project-name]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-name/overview
Hosting URL: https://your-project-name.web.app
```

### 7. Access Your Live App

Your app is now live at:
- **Primary URL**: `https://your-project-name.web.app`
- **Alternative URL**: `https://your-project-name.firebaseapp.com`

Both URLs point to the same app. Share either one!

## Custom Domain (Optional)

Want to use your own domain like `personal-os.com`?

### 1. Add Custom Domain in Firebase Console

1. Go to **Hosting** in Firebase Console
2. Click **Add custom domain**
3. Enter your domain (e.g., `personal-os.com`)
4. Follow the verification steps

### 2. Update DNS Records

Add the DNS records shown by Firebase to your domain registrar:

- **A record** pointing to Firebase IPs
- **TXT record** for verification

### 3. Wait for SSL Certificate

Firebase automatically provisions an SSL certificate. This can take up to 24 hours.

### 4. Done!

Your app will be accessible at your custom domain with HTTPS.

## Making Updates

When you make changes to your app:

### 1. Build

```bash
npm run build
```

### 2. Deploy

```bash
firebase deploy --only hosting
```

That's it! Changes are live in seconds.

## Deployment Checklist

Before deploying, verify:

- [ ] Firebase config in `src/firebase.js` is correct
- [ ] App works locally (`npm run dev`)
- [ ] All features tested
- [ ] No console errors
- [ ] Firestore security rules are set
- [ ] Google Authentication is enabled
- [ ] Composite indexes created (or will be created automatically)

## Firebase Hosting Features

### Automatic HTTPS

Firebase Hosting automatically provisions SSL certificates. Your app is always served over HTTPS.

### Global CDN

Your app is served from Firebase's global CDN for fast load times worldwide.

### Versioning

Every deployment creates a new version. You can:
- View all versions in Firebase Console
- Rollback to previous versions if needed
- Compare versions

### Custom Headers

Edit `firebase.json` to add custom headers:

```json
{
  "hosting": {
    "public": "dist",
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=7200"
          }
        ]
      }
    ]
  }
}
```

### Redirects

Add redirects in `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "redirects": [
      {
        "source": "/old-path",
        "destination": "/new-path",
        "type": 301
      }
    ]
  }
}
```

## Monitoring

### View Hosting Metrics

1. Go to **Hosting** in Firebase Console
2. Click on your deployed site
3. View metrics:
   - Bandwidth usage
   - Number of requests
   - Storage used
   - SSL certificate status

### Performance

Firebase Hosting is very fast:
- Serves static files from global CDN
- Automatic compression (gzip/brotli)
- HTTP/2 support

## Free Tier Limits

Firebase Hosting free tier (Spark plan):
- **10 GB** storage
- **360 MB/day** transfer (10 GB/month)
- Free SSL certificates
- Free custom domains

This is more than enough for personal use and sharing with friends.

## Troubleshooting

### "Command not found: firebase"

Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

### "Permission denied" when installing Firebase CLI

Use sudo (macOS/Linux):
```bash
sudo npm install -g firebase-tools
```

Or use npx (no installation needed):
```bash
npx firebase-tools login
npx firebase-tools init hosting
npx firebase-tools deploy --only hosting
```

### "No project active"

Initialize Firebase:
```bash
firebase use --add
```

Select your project from the list.

### Changes not showing after deployment

Hard refresh your browser:
- Chrome/Firefox: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Try incognito/private window

### Build errors

Make sure all dependencies are installed:
```bash
npm install
```

Check for syntax errors in your code.

## CI/CD (Optional)

Want automatic deployments on git push?

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

## Best Practices

1. **Always test locally first**
   ```bash
   npm run dev
   ```

2. **Preview production build**
   ```bash
   npm run build
   firebase serve
   ```

3. **Deploy only when ready**
   ```bash
   firebase deploy --only hosting
   ```

4. **Use version control**
   - Commit code to git before deploying
   - Tag releases
   - Never deploy untested code

5. **Monitor usage**
   - Check Firebase Console regularly
   - Set up budget alerts if needed

## Summary

**Quick Deploy Commands:**

```bash
# First time setup
firebase login
firebase init hosting
# Choose: existing project, dist folder, SPA: yes

# Every time you make changes
npm run build
firebase deploy --only hosting

# Your app is live!
```

That's it! Your Personal OS is now hosted on Firebase with:
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Free SSL certificate
- ✅ 99.95% uptime SLA
- ✅ Instant updates

Enjoy your fully deployed Personal Operating System! 🚀
