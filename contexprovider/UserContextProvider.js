import React, { createContext, useState, useContext, useEffect } from 'react';
import { getLocalstorage, setLocalstorage, clearLocalstorage } from '../Localstorage/localstorageService'; // Importing helpers
import { collection, doc, getDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';

// Create the context
const userContext = createContext();

// Provider component to wrap around your application
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Set user as null initially
  const [loadingUser, setLoadingUser] = useState(true); // Add a loading state to manage the loading process

  // Function to check user data from AsyncStorage
  const checkUserData = async () => {
    try {
      const data = await getLocalstorage('user');
      // console.log('User data from AsyncStorage:', data);

      if (data && data.providerData) {
        const userQuery = query(
          collection(db, 'users'),  // Reference to the users collection
          where('email', '==', data.providerData[0].email)  // Query to match the user's email
        );

        // Execute the query to find the user document
        const querySnapshot = await getDocs(userQuery);
        // console.log('querySnapshot:', querySnapshot);

        if (!querySnapshot.empty) {
          // If the document is found
          const userDocRef = doc(db, 'users', querySnapshot.docs[0].id);  // Get the document referenc
          // Set up a real-time listener for updates to the user document
          onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const userData = docSnapshot.data();
              setUser(userData);
            }
          });

          // Get the initial user data
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            // console.log('Initial User data from Firestore:', userData);
            setUser(userData);
          }
        }
      } else {
        setUser(null); // If no data found, set user to null
      }
    } catch (error) {
      console.error("Error fetching user data from AsyncStorage:", error);
      setUser(null); // Clear the user on error
    } finally {
      setLoadingUser(false); // Set loading to false after check
    }
  };

  useEffect(() => {
    checkUserData(); // Check for user data when the component is mounted
  }, []);

  // Function to set user and immediately update the context
  const setUserAndUpdateContext = async (userData) => {
    try {
      await setLocalstorage('user', userData); // Save to AsyncStorage
      setLoadingUser(true);
      await checkUserData();
    } catch (error) {
      console.error("Error saving user data to AsyncStorage:", error);
    }
  };

  // Function to clear the storage and reset the user in context
  const clearUserAndReload = async () => {
    try {
      await clearLocalstorage(); // Clear AsyncStorage
      setUser(null); // Reset the user in context immediately
      setLoadingUser(true); // Set loading to true while reloading
      await checkUserData(); // Reload the user data (it should be null after clearing)
    } catch (error) {
      console.error("Error clearing user data:", error);
    }
  };

  return (
    <userContext.Provider value={{ user, loadingUser, setUserAndUpdateContext, clearUserAndReload }}>
      {children}
    </userContext.Provider>
  );
};

// Hook to access the context value
export const LoginUser = () => useContext(userContext);
