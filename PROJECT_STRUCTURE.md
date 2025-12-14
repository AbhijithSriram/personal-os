# Project Structure

Overview of the Personal OS codebase organization.

## Directory Structure

```
personal-os/
├── public/                  # Static assets
├── src/                     # Source code
│   ├── components/          # Reusable React components
│   │   ├── Navigation.jsx   # Main navigation bar
│   │   └── Navigation.css
│   ├── contexts/            # React Context providers
│   │   └── AuthContext.jsx  # Authentication state management
│   ├── pages/               # Main application pages
│   │   ├── Login.jsx        # Login page with Google auth
│   │   ├── Login.css
│   │   ├── Onboarding.jsx   # Initial setup wizard
│   │   ├── Onboarding.css
│   │   ├── Dashboard.jsx    # Main dashboard with statistics
│   │   ├── Dashboard.css
│   │   ├── DailyTracker.jsx # Hour-by-hour activity tracking
│   │   ├── DailyTracker.css
│   │   ├── HealthMetrics.jsx # Physical health tracking
│   │   ├── HealthMetrics.css
│   │   ├── Reminders.jsx    # Task and deadline management
│   │   ├── Reminders.css
│   │   ├── Profile.jsx      # User settings
│   │   └── Profile.css
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # Application entry point
│   ├── firebase.js          # Firebase configuration
│   └── index.css            # Global styles
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── .gitignore               # Git ignore rules
├── README.md                # Main documentation
├── FIREBASE_SETUP.md        # Detailed Firebase setup guide
└── QUICKSTART.md            # Quick setup guide
```

## Key Files Explained

### Configuration Files

**package.json**
- Dependencies: React, Firebase, date-fns, react-router-dom
- Scripts: dev, build, preview

**vite.config.js**
- Vite configuration for fast development
- React plugin setup

**src/firebase.js**
- Firebase initialization
- Auth and Firestore setup
- **YOU MUST EDIT THIS FILE** with your Firebase config

### Core Application

**src/main.jsx**
- Entry point
- Renders root component
- Wraps app in React StrictMode

**src/App.jsx**
- Main app component
- React Router setup
- Route definitions with authentication guards
- Onboarding check logic

**src/index.css**
- Global CSS variables
- Base styles for forms, buttons, inputs
- Utility classes
- Animations
- Responsive design

### Authentication

**src/contexts/AuthContext.jsx**
- Manages authentication state
- Provides user and userProfile to all components
- Handles sign in/out
- Updates user profile in Firestore
- Used throughout the app via `useAuth()` hook

### Components

**src/components/Navigation.jsx**
- Main navigation bar
- Shows on all authenticated pages
- Active route highlighting
- Sign out functionality

### Pages

**Login.jsx**
- Google sign-in button
- Redirects to onboarding or dashboard after login
- Simple, clean design

**Onboarding.jsx** ⭐ Complex
- 4-step wizard for initial setup
- Step 1: Daily schedule configuration
- Step 2: Activity categories (productive/unproductive)
- Step 3: Semester dates
- Step 4: Subjects with units
- Saves complete profile to Firestore
- Only shows once, then redirects to dashboard

**Dashboard.jsx**
- Overview of productivity statistics
- Today, week, and month metrics
- Recent activity feed
- Quick action cards
- Queries multiple Firestore collections

**DailyTracker.jsx** ⭐ Most Complex
- Hour-by-hour activity logging
- Supports two day types: college and non-college
- Dynamic hour slots based on user schedule
- For college hours:
  - Subject selection
  - Unit tracking
  - Attendance marking (present/absent/onduty/cancelled)
- For all hours:
  - Activity selection from user's configured lists
  - Productivity level (1x, 2x, 5x, 10x)
  - Notes field
- Daily reflection
- Saves to Firestore with user ID

**HealthMetrics.jsx**
- Daily health data entry
- Morning weight, water, steps, calories
- 7-day averages calculation
- History table
- Simple numeric inputs

**Reminders.jsx**
- Task/reminder creation and management
- Deadline tracking
- Status badges (overdue, today, upcoming)
- Completion toggling
- Filtering (all, active, completed)
- Edit and delete functionality

**Profile.jsx**
- Edit user settings
- Three tabs: Schedule, Activities, Semesters
- Updates userProfile in Firestore
- Read-only semester display (can be enhanced)

## Data Flow

### Authentication Flow
```
1. User clicks "Sign in with Google" (Login.jsx)
2. Firebase handles OAuth flow
3. onAuthStateChanged triggered (AuthContext.jsx)
4. User profile loaded from Firestore
5. If no profile → redirect to Onboarding
6. If profile exists → redirect to Dashboard
```

### Data Saving Flow
```
1. User enters data in any page
2. Form state managed with React useState
3. Click "Save" button
4. Data sent to Firestore with user.uid
5. Success message displayed
6. Local state updated
```

### Data Loading Flow
```
1. Page component mounts (useEffect)
2. Query Firestore with user.uid filter
3. Set local state with data
4. Component re-renders with data
5. Loading spinner shown during fetch
```

## Firebase Collections

### users/{userId}
- User profile data
- Schedule configuration
- Activity lists
- Semester information
- Created during onboarding

### dailyEntries/{userId}_{date}
- One document per day per user
- Array of hour objects
- Daily reflection
- Document ID ensures uniqueness

### healthMetrics/{userId}_{date}
- One document per day per user
- Numeric health metrics
- Queried for averages and history

### reminders/{reminderId}
- Auto-generated document IDs
- Filtered by userId
- Ordered by deadline
- Supports CRUD operations

## Security

All Firestore queries include `where('userId', '==', user.uid)` to ensure:
- Users only see their own data
- Queries are efficient
- Security rules are enforced

Security rules in Firestore ensure:
- Read/write only if authenticated
- Can only access own documents
- userId must match auth.uid

## Styling Approach

**Design Philosophy**: Minimalist, functional, non-AI aesthetic

**Color Scheme**:
- Black and white primary
- No bright colors or gradients
- Clean borders and shadows

**Typography**:
- JetBrains Mono for code/system text
- Newsreader for body text
- Clear hierarchy

**Components**:
- Cards with subtle shadows
- Hover effects with transforms
- Smooth transitions
- Responsive grid layouts

## Development Tips

### Adding a New Page

1. Create component in `src/pages/YourPage.jsx`
2. Create styles in `src/pages/YourPage.css`
3. Add route in `src/App.jsx`
4. Add navigation link in `src/components/Navigation.jsx`

### Adding a New Feature to Existing Page

1. Add state variables with `useState`
2. Add input fields to form
3. Update save handler to include new data
4. Update Firestore document structure
5. Update loading logic to fetch new data

### Querying Firestore

Always include:
- User ID filter
- Error handling
- Loading state
- Empty state handling

Example:
```javascript
const loadData = async () => {
  try {
    setLoading(true);
    const q = query(
      collection(db, 'collectionName'),
      where('userId', '==', user.uid)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setData(data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};
```

## Testing Locally

1. `npm run dev` - Start development server
2. Open http://localhost:3000
3. Sign in with your Google account
4. Test features
5. Check Firebase Console to verify data

## Building for Production

1. `npm run build` - Creates optimized build
2. `npm run preview` - Preview production build
3. Deploy `dist` folder to hosting

## Common Customizations

**Change Colors**: Edit CSS variables in `src/index.css`

**Add Activity Categories**: Update Profile page to allow editing

**Add New Metrics**: Add fields in HealthMetrics or create new page

**Change Schedule**: Edit in Profile, reflected in DailyTracker

**Add Search**: Implement in DailyTracker to search notes by unit

## Performance Considerations

- Firestore queries are indexed
- Date filtering uses timestamps
- Pagination with `limit()` for large datasets
- Lazy loading with React.lazy() if needed
- Vite optimizes bundle size

## Future Enhancements

Ideas for expanding the system:
- Charts and visualizations (Chart.js or Recharts)
- Export data to CSV/JSON
- Email notifications for reminders
- Mobile app version
- Collaboration features
- AI insights from patterns
- Integration with calendar apps
- Automated backups

---

This structure provides a solid foundation for a personal tracking system. The code is organized, documented, and ready for customization!
