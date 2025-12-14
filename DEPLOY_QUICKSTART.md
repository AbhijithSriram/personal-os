# Deploy Quickstart - 5 Minutes ⚡

## For the Impatient 😄

Already have Firebase project? Just want to deploy fast? Here you go:

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login

```bash
firebase login
```

### 3. Update Project ID

Edit `.firebaserc` file:
```json
{
  "projects": {
    "default": "personal-os-10a45"  ← Change this to YOUR project ID
  }
}
```

Find your project ID:
- Firebase Console → Project Settings → Project ID
- Example: `personal-os-10a45` or `my-awesome-app-12345`

### 4. Deploy!

**Option A: Use Deploy Script (Easiest)**

Mac/Linux:
```bash
chmod +x deploy.sh
./deploy.sh
```

Windows:
```bash
deploy.bat
```

**Option B: Manual Commands**

```bash
npm install        # Install dependencies
npm run build      # Build for production
firebase deploy --only hosting   # Deploy!
```

### 5. Done! 🎉

Your app will be live at:
```
https://YOUR-PROJECT-ID.web.app
```

---

## If Something Breaks

### "Firebase command not found"
```bash
npm install -g firebase-tools
```

### "Not logged in"
```bash
firebase login
```

### "Build failed"
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### "Wrong project"
Edit `.firebaserc` with correct project ID

### "Blank page after deploy"
1. Check `src/firebase.js` has correct config
2. Clear browser cache (Ctrl+Shift+R)
3. Check Firebase Console → Authentication → Settings → Authorized domains

---

## Full Guide

For detailed step-by-step with screenshots and troubleshooting:
👉 See `HOSTING_SETUP_COMPLETE.md`

---

## Every Time You Update Code

```bash
npm run build
firebase deploy --only hosting
```

Or just run:
```bash
./deploy.sh     # Mac/Linux
deploy.bat      # Windows
```

That's it! 🚀
