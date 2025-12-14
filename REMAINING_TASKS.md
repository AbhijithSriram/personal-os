# Remaining Tasks & Enhancements

## ✅ COMPLETED (in this update):

1. ✅ **Semester Isolation** - Subjects only show for active semester based on selected date
2. ✅ **Date Range Validation** - Can't mark attendance outside semester dates  
3. ✅ **Attendance Filtering** - Filter by semester first, then subject
4. ✅ **Date Format Hints** - Shows DD/MM/YYYY confirmation when selecting dates
5. ✅ **Active Semester Detection** - Automatically finds current semester

---

## 🔧 TO BE IMPLEMENTED:

### 1. Enhanced Reminders (HIGH PRIORITY)

**Current State:**
- Deadline date only (no time)
- Simple "days before" reminder
- No recurring reminders
- No email notifications

**Needed Changes:**

#### A. Update Reminder Data Model

```javascript
{
  name: string,
  description: string,
  duration: number, // hours
  
  // NEW FIELDS:
  deadline: Timestamp, // Full datetime: "2025-12-10T17:00:00"
  reminderStartTime: Timestamp, // When to START sending reminders: "2025-12-09T07:00:00"
  recurringInterval: number, // Hours between reminders (1-24, default 24)
  lastReminderSent: Timestamp, // Track when last email was sent
  
  // EXISTING:
  completed: boolean,
  userId: string,
  createdAt: Timestamp
}
```

#### B. Update Reminders UI (`src/pages/Reminders.jsx`)

**Form Fields Needed:**

```javascript
// 1. Deadline - Date + Time
<input type="datetime-local" 
  min={new Date().toISOString().slice(0, 16)} // Can't be in past
  value={formData.deadline}
  onChange={...}
/>

// 2. Reminder Start Time
<input type="datetime-local"
  min={new Date().toISOString().slice(0, 16)} // Can't be in past
  max={formData.deadline} // Can't be after deadline
  value={formData.reminderStartTime}
  onChange={...}
/>

// 3. Recurring Interval
<select value={formData.recurringInterval}>
  <option value="1">Every 1 hour</option>
  <option value="3">Every 3 hours</option>
  <option value="6">Every 6 hours</option>
  <option value="12">Every 12 hours</option>
  <option value="24">Every 24 hours (daily)</option>
</select>
```

**Validation Rules:**
- deadline must be in future
- reminderStartTime must be >= now and < deadline
- recurringInterval: 1-24 hours
- If reminderStartTime + recurringInterval > deadline, warn user

#### C. Set Up Email System

See `EMAIL_REMINDERS_SETUP.md` for complete guide.

**Quick Summary:**
1. Enable Firebase Blaze plan ($0-1/month for personal use)
2. Install SendGrid (100 free emails/day)
3. Deploy Cloud Function that runs every hour
4. Function checks for due reminders and sends emails

**Files to Create:**
```
personal-os/
└── functions/
    ├── package.json
    ├── index.js (Cloud Function code)
    └── .firebaserc
```

---

### 2. Date Format Display (MEDIUM PRIORITY)

**Issue:**
Browser date inputs always use YYYY-MM-DD internally, but we want to DISPLAY DD/MM/YYYY to users.

**Solution:**
Add format hints (partially done in onboarding), extend to all date fields.

```javascript
// Show selected date in DD/MM/YYYY format
{selectedDate && (
  <small className="date-display">
    Selected: {new Date(selectedDate + 'T00:00').toLocaleDateString('en-GB')}
  </small>
)}
```

**Files to Update:**
- `src/pages/Reminders.jsx` - Add date display
- `src/pages/Profile.jsx` - Add date display
- `src/pages/DailyTracker.jsx` - Already has date picker

---

### 3. User Email Storage (REQUIRED FOR REMINDERS)

**Current Issue:**
User email not stored in Firestore `users` collection.

**Solution:**
Update `AuthContext.jsx` to store email on signup:

```javascript
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Store user email in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date()
    }, { merge: true });
    
    return user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};
```

---

### 4. Firestore Security Rules Update

Add rule to allow Cloud Functions to update lastReminderSent:

```javascript
match /reminders/{reminderId} {
  allow read, write: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.userId;
  
  // NEW: Allow cloud functions to update lastReminderSent
  allow update: if request.auth != null && 
    (request.auth.uid == resource.data.userId ||
     request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['lastReminderSent']));
}
```

---

## 📝 Implementation Checklist

When implementing reminders enhancement:

- [ ] Update Reminder data model in Firestore
- [ ] Modify `Reminders.jsx` form with datetime-local inputs
- [ ] Add validation for datetime fields
- [ ] Add recurring interval selector
- [ ] Update `AuthContext.jsx` to store user email
- [ ] Set up SendGrid account
- [ ] Create Firebase Functions folder
- [ ] Write Cloud Function (see EMAIL_REMINDERS_SETUP.md)
- [ ] Deploy functions
- [ ] Update Firestore security rules
- [ ] Test with a reminder due in 1 hour
- [ ] Verify email received
- [ ] Test recurring reminders

---

## 🎯 Priority Order:

1. **User Email Storage** (5 minutes) - Required for everything else
2. **Enhanced Reminders UI** (1-2 hours) - New form fields
3. **Email Setup** (30 minutes) - SendGrid + Cloud Functions
4. **Testing** (1 hour) - End-to-end verification

---

## 💡 Future Enhancements (Post-MVP):

- [ ] SMS reminders (via Twilio)
- [ ] In-app notifications (Firebase Cloud Messaging)
- [ ] Snooze reminders
- [ ] Reminder templates
- [ ] Batch operations (mark multiple as complete)
- [ ] Calendar integration (Google Calendar, iCal)
- [ ] Desktop notifications (PWA)
- [ ] Mobile app (React Native)

---

## 📚 Resources:

- [SendGrid Node.js Quick Start](https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs)
- [Firebase Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Cloud Scheduler](https://cloud.google.com/scheduler/docs)
- [MDN datetime-local](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local)

---

**Status:** Ready for implementation
**Estimated Time:** 3-4 hours total
**Difficulty:** Medium
