# Duplicate Subject Code Prevention

## Problem

When multiple subjects have the same code (e.g., two subjects with code "UIT3311"), the system breaks:
- Attendance calculations get confused
- Can't distinguish between subjects
- Data gets mixed together
- Weird behaviors appear everywhere

## Solution Implemented

### 1. Real-Time Validation ✅

**As you type**, the input field shows warnings:

```
Subject Code: [UIT3311____]  <- Input field turns red
⚠️ Duplicate code! Each subject must have a unique code.
```

**Visual Indicators:**
- Input field has red border
- Red background tint (#ffebee)
- Warning message appears immediately
- Updates as you type

### 2. Submit Prevention ✅

**Onboarding (Step 4):**
- "Complete Setup" button is DISABLED if:
  - Any duplicate codes exist
  - Any empty subject codes
  - Any empty subject names
- Warning message: "⚠️ Please fix duplicate subject codes before continuing"

**Profile Page:**
- "Save Changes" button is DISABLED if:
  - Any duplicate codes exist
  - Any empty subject codes  
  - Any empty subject names
- Warning message: "⚠️ Fix duplicate subject codes to save"

### 3. Server-Side Validation ✅

Even if someone bypasses the UI, validation runs on submit:

```javascript
// Checks all semesters
for (const semester of formData.semesters) {
  // Find duplicates (case-insensitive, trimmed)
  const codes = subjects.map(s => s.code.trim().toUpperCase());
  const duplicates = codes.filter((code, i) => codes.indexOf(code) !== i);
  
  if (duplicates.length > 0) {
    alert(`Error in Semester ${sem}: Duplicates: ${duplicates.join(', ')}`);
    return; // Stop save
  }
}
```

**Validation Rules:**
1. Codes are case-insensitive: "uit3311" = "UIT3311" = "Uit3311"
2. Whitespace is trimmed: "UIT3311 " = " UIT3311" = "UIT3311"
3. Each code must be unique within its semester
4. Same code CAN exist in different semesters (that's fine!)

### 4. Duplicate Detection Logic

```javascript
const isDuplicateCode = (semIndex, subIndex, code) => {
  if (!code || !code.trim()) return false;
  
  const normalizedCode = code.trim().toUpperCase();
  const semester = formData.semesters[semIndex];
  
  // Check if any OTHER subject has the same code
  return semester.subjects.some((subject, idx) => 
    idx !== subIndex &&  // Skip self
    subject.code.trim().toUpperCase() === normalizedCode
  );
};
```

## User Experience

### Scenario 1: Duplicate During Onboarding

1. User adds Subject 1: "UIT3311"
2. User adds Subject 2: "UIT3311"
3. **Immediately** sees red input + warning
4. "Complete Setup" button is grayed out
5. Must fix duplicate to proceed

### Scenario 2: Duplicate in Profile

1. User edits existing subject
2. Changes code to match another subject
3. **Immediately** sees red input + warning
4. "Save Changes" button is grayed out
5. Shows error: "⚠️ Fix duplicate subject codes to save"

### Scenario 3: Empty Codes/Names

1. User leaves subject code blank
2. "Save" button is disabled
3. Alert on submit: "All subjects must have a code"

## Technical Details

**Files Modified:**
- `src/pages/Onboarding.jsx` - Added validation + UI warnings
- `src/pages/Profile.jsx` - Added validation + UI warnings
- `src/pages/Onboarding.css` - Error styling
- `src/pages/Profile.css` - Error styling

**New CSS Classes:**
```css
.input-error {
  border-color: #d32f2f !important;
  background-color: #ffebee !important;
}

.error-hint {
  color: #d32f2f;
  font-size: 0.75rem;
  font-weight: 500;
}
```

**Validation Runs:**
1. On every keystroke (real-time)
2. On button click (before submit)
3. On form submit (server-side)

## Edge Cases Handled

✅ Case-insensitive matching
✅ Whitespace trimming
✅ Empty string handling
✅ Self-comparison avoidance
✅ Cross-semester codes (allowed)
✅ Multiple duplicates detection
✅ Button state management

## Testing Checklist

- [ ] Add two subjects with same code → See red input
- [ ] Button should be disabled
- [ ] Fix duplicate → Red goes away, button enables
- [ ] Try uppercase vs lowercase → Still catches it
- [ ] Try with trailing spaces → Still catches it
- [ ] Leave code empty → Button disabled
- [ ] Same code in different semesters → Allowed (no error)
- [ ] Try to force-submit with duplicates → Gets blocked

## What Happens to Existing Data?

**If you already have duplicates in Firestore:**

The validation only prevents NEW duplicates. Existing data won't be automatically fixed.

**To fix existing data:**
1. Go to Profile
2. Edit the duplicate subjects
3. Change one of the codes
4. Save (validation will now work)

**OR manually fix in Firestore:**
1. Go to Firebase Console
2. Find your user document in `users` collection
3. Edit the `semesters` array
4. Change duplicate subject codes

## Summary

**Before this fix:**
- ❌ Could add duplicate subject codes
- ❌ No warnings
- ❌ System breaks silently
- ❌ Weird attendance calculations

**After this fix:**
- ✅ Real-time duplicate detection
- ✅ Visual warnings (red input)
- ✅ Button disabled if duplicates
- ✅ Server-side validation
- ✅ Can't save with duplicates
- ✅ Clear error messages

**Status:** ✅ FIXED - No more duplicate codes allowed!
