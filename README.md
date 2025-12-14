# Personal OS

A comprehensive life tracking system to monitor your time, health, productivity, and academic progress.

## Features

- **Daily Time Tracker**: Log every hour of your day with activities, productivity levels, and notes
- **Attendance Tracking**: Track college attendance with subject-wise records and unit coverage
- **Health Metrics**: Monitor weight, water intake, steps, and calories
- **Reminders & Tasks**: Manage deadlines and assignments with email notifications
- **Productivity Index**: Self-assessed productivity scoring with detailed analytics
- **Academic Notes**: Searchable notes for each class with unit-wise organization

## Tech Stack

- **Frontend**: React 18 with Vite
- **Backend**: Firebase (Firestore + Authentication)
- **Styling**: Custom CSS with minimalist black/white aesthetic
- **Fonts**: JetBrains Mono + Newsreader

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- A Google account for Firebase
- Git

### 2. Clone the Repository

```bash
git clone <your-repo-url>
cd personal-os
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Firebase Setup

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "personal-os")
4. Disable Google Analytics (optional)
5. Click "Create Project"

#### Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable **Google** sign-in method
4. Add your domain to authorized domains (for deployment)

#### Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create Database"
3. Start in **Production Mode**
4. Choose a location close to you
5. Click "Enable"

#### Set Up Firestore Security Rules

Go to **Firestore Database** → **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /dailyEntries/{entryId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    match /healthMetrics/{metricId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Click **Publish**.

#### Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname
5. Copy the `firebaseConfig` object

### 5. Configure Environment

1. Open `src/firebase.js`
2. Replace the placeholder config with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 6. Create Firestore Indexes

Some queries require composite indexes. Firebase will prompt you to create them when needed, or you can create them manually:

1. Go to **Firestore Database** → **Indexes** tab
2. Click **Add Index**
3. Create these indexes:

**Collection**: `dailyEntries`
- Fields: `userId` (Ascending), `date` (Descending)

**Collection**: `healthMetrics`
- Fields: `userId` (Ascending), `date` (Descending)

**Collection**: `reminders`
- Fields: `userId` (Ascending), `deadline` (Ascending)

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Build for Production

```bash
npm run build
```

The optimized build will be in the `dist` folder.

## Deployment

### Deploy to Firebase Hosting

Your app can be fully hosted on Firebase (database, authentication, and hosting all in one place):

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init hosting
```

Select:
- Use existing project (select your project)
- Public directory: `dist`
- Single-page app: Yes
- Set up automatic builds: No

4. Build and deploy:
```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at:
- `https://your-project-name.web.app`
- `https://your-project-name.firebaseapp.com`

**For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Deploy to Other Platforms

#### Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

Follow the prompts to link your project.

## Usage Guide

### First Time Setup

1. **Sign in** with your Google account
2. **Complete onboarding** by configuring:
   - Your daily schedule (bus times, college hours, etc.)
   - Productive and unproductive activities
   - Current semester details with subjects and units

### Daily Tracking

1. Go to **Daily Tracker**
2. Select the date you want to log
3. Choose day type (College Day or Non-College Day)
4. For each hour:
   - Select the activity from your configured list
   - Rate productivity (1x, 2x, 5x, 10x)
   - Add notes about what you did
   - For college hours: mark attendance and units covered
5. Write a daily reflection at the end
6. Click **Save Day**

### Health Metrics

1. Go to **Health**
2. Enter daily metrics:
   - Morning weight
   - Glasses of water
   - Steps walked
   - Calories burnt
3. View 7-day averages and history

### Reminders & Tasks

1. Go to **Reminders**
2. Click **+ New Reminder**
3. Fill in:
   - Task name and description
   - Estimated duration
   - Deadline
   - Reminder period (when to notify you)
4. Check off tasks as you complete them

### Profile Settings

1. Go to **Profile**
2. Edit your schedule, activities, or semester information
3. Click **Save Changes**

## Data Structure

### Collections

**users**
```javascript
{
  userId: string,
  busToCollegeStart: string,
  busToCollegeEnd: string,
  productiveActivities: string[],
  unproductiveActivities: string[],
  semesters: [{
    semesterNumber: number,
    startDate: string,
    endDate: string,
    subjects: [{
      code: string,
      name: string,
      facultyInitials: string,
      units: [{ number: number, name: string }]
    }]
  }],
  onboardingComplete: boolean
}
```

**dailyEntries**
```javascript
{
  userId: string,
  date: Timestamp,
  dayType: 'college' | 'non-college',
  hours: [{
    time: string,
    activity: string,
    productivityLevel: number,
    notes: string,
    subject?: string,
    unit?: number,
    attendance?: 'present' | 'absent' | 'onduty' | 'cancelled'
  }],
  dailyReflection: string
}
```

**healthMetrics**
```javascript
{
  userId: string,
  date: Timestamp,
  morningWeight: number,
  glassesOfWater: number,
  steps: number,
  caloriesBurnt: number
}
```

**reminders**
```javascript
{
  userId: string,
  name: string,
  description: string,
  duration: number,
  deadline: Timestamp,
  reminderPeriod: string,
  completed: boolean
}
```

## Future Enhancements

- [ ] Email notifications for reminders
- [ ] Data export (CSV/JSON)
- [ ] Advanced analytics and charts
- [ ] Mobile app (React Native)
- [ ] Collaboration features for group projects
- [ ] Integration with calendar apps
- [ ] Automated attendance calculation
- [ ] GPA tracking
- [ ] Study time recommendations based on patterns

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT License - feel free to use this for your own tracking system.

## Support

For issues or questions, create an issue in the repository.
