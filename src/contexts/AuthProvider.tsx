import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useDb } from '../hooks/useDb';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const { auth, api } = useDb();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth || !api) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await api.getUserProfile(firebaseUser.uid);
        setUser({ ...firebaseUser, ...userProfile });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, api]);

  const logout = () => signOut(auth);

  const value = { user, logout, isAuthenticated: !!user, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
