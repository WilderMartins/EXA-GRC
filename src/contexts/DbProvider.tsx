import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { firebaseApiClient } from '../lib/firebase';
import { DbContext } from './DbContext';

export const DbProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [functions, setFunctions] = useState(null);
  const [api, setApi] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let config;
    const configString = localStorage.getItem('firebaseConfig');

    if (configString) {
      try {
        config = JSON.parse(configString);
      } catch (error) {
        console.error("Failed to parse firebaseConfig from localStorage:", error);
        localStorage.clear();
      }
    }

    if (!config) {
      config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };
    }

    const isConfigComplete = config && Object.values(config).every(value => value);

    if (isConfigComplete) {
      try {
        const app = initializeApp(config);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);
        const firebaseFunctions = getFunctions(app);
        setDb(firestore);
        setAuth(firebaseAuth);
        setFunctions(firebaseFunctions);
        setApi(firebaseApiClient(firestore));
      } catch (error) {
        console.error("Failed to initialize Firebase:", error);
      }
    } else {
        console.warn("Firebase configuration is incomplete. Please check your environment variables.");
    }

    setIsReady(true);
  }, []);

  return <DbContext.Provider value={{ db, auth, functions, api, isDbReady: isReady }}>{children}</DbContext.Provider>;
};
