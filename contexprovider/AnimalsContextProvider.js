import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../FirebaseConfig'; // Import db from your Firebase config
import { collection, onSnapshot } from 'firebase/firestore'; // Modular imports for Firestore functions

// Create a context to manage animals data
const animalContext = createContext();

// Provider component that will provide animals data to the entire app
export const AnimalProvider = ({ children }) => {
  const [result, setResult] = useState([]); // State to store Firestore data
  const [loading, setLoading] = useState(true); // State to track loading
  const [error, setError] = useState(null); // State to track errors

  useEffect(() => {
    // Reference the "Animals" collection in Firestore
    const unsubscribe = onSnapshot(
      collection(db, 'Animals'),
      (querySnapshot) => {
        try {
          const Animals = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            key: doc.id, // Firestore document ID as key
          }));
          
          setResult(Animals); // Set the fetched data to state
          setLoading(false); // Data is fetched, set loading to false
        } catch (err) {
          console.error('Error fetching animals data:', err);
          setError('Failed to fetch animals data');
          setLoading(false); // Stop loading if there's an error
        }
      },
      (err) => {
        console.error('Error in Firestore snapshot listener:', err);
        setError('Failed to fetch animals data');
        setLoading(false); // Stop loading if there's an error
      }
    );

    // Unsubscribe from Firestore listener on cleanup
    return () => unsubscribe();
  }, []); // Empty dependency array to run this once when component mounts

  // Provide the data and loading state to children components
  return (
    <animalContext.Provider value={{ result, loading, error }}>
      {children}
    </animalContext.Provider>
  );
};

// Custom hook to use the AnimalContext in other components
export const useAnimalsContext = () => useContext(animalContext);
