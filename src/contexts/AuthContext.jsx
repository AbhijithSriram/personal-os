import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthContext] Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setUser(user);
      
      if (user) {
        try {
          // Check if user profile exists
          const profileRef = doc(db, 'users', user.uid);
          console.log('[AuthContext] Fetching profile for:', user.uid);
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            const profile = profileSnap.data();
            console.log('[AuthContext] Profile loaded:', {
              onboardingComplete: profile.onboardingComplete,
              hasSemesters: !!profile.semesters
            });
            setUserProfile(profile);
          } else {
            // New user - create minimal profile with onboardingComplete: false
            console.log('[AuthContext] No profile found, creating new profile');
            const newProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              onboardingComplete: false,
              createdAt: new Date()
            };
            await setDoc(profileRef, newProfile);
            console.log('[AuthContext] New profile created with onboardingComplete: false');
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('[AuthContext] Error loading profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      
      console.log('[AuthContext] Setting loading to false');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateUserProfile = async (data) => {
    if (!user) return;
    
    try {
      const profileRef = doc(db, 'users', user.uid);
      
      // Save to Firestore with explicit merge
      await setDoc(profileRef, { 
        ...data, 
        updatedAt: new Date() 
      }, { merge: true });
      
      // Fetch the complete updated profile from Firestore
      const updatedProfileSnap = await getDoc(profileRef);
      if (updatedProfileSnap.exists()) {
        const completeProfile = updatedProfileSnap.data();
        setUserProfile(completeProfile);
        
        // Log for debugging
        console.log('Profile updated:', {
          onboardingComplete: completeProfile.onboardingComplete,
          hasData: !!completeProfile.semesters
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signOut,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
