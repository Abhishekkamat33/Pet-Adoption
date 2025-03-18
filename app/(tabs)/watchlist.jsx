import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext'; // Import the useTheme hook
import { LoginUser } from '../../contexprovider/UserContextProvider';
import { db } from '../../FirebaseConfig';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAnimalsContext } from '@/contexprovider/AnimalsContextProvider';

const FavoritePage = () => {
  const { result, loading } = useAnimalsContext();
  const { user } = LoginUser(); // Assuming user is an array with user data (e.g., )

  const { isDarkMode } = useTheme(); // Get the current theme (dark mode or light mode)
  const [watchList, setWatchList] = useState([]); // Track items added to the watchlist

  useEffect(() => {
    const fetchData = async () => {
      const userDocRef = doc(db, "watchlist", user.uid); // Reference to user's watchlist

      try {
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const animalsInwatchlist = userDocSnapshot.data().animals_id;
          // Handle animals in watchlist here
          const watchlistAnimals = result.filter(animal =>
            animalsInwatchlist.includes(animal.key)
          );
          setWatchList(watchlistAnimals);
        } else {
          setWatchList([]); // No watchlist, set to empty array
        }

        // Subscribe to real-time updates for the user's watchlist (if necessary)
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
          const animalsInwatchlist = docSnapshot.data()?.animals_id || [];
          const watchlistAnimals = result.filter(animal =>
            animalsInwatchlist.includes(animal.key)
          );
          setWatchList(watchlistAnimals);
        });

        return () => unsubscribe(); // Cleanup function to stop the listener
      } catch (error) {
        console.error("Error fetching user document:", error);
      }
    };

    fetchData();
  }, [result, user ,watchList]); // Trigger the effect when result or user changes

  const toggleHeart = async (id) => {
    const updatedWatchList = watchList.some(item => item.key === id)
      ? watchList.filter(item => item.key !== id) // Remove from watchlist if exists
      : [...watchList, result.find(animal => animal.key === id)]; // Add to watchlist if doesn't exist

    setWatchList(updatedWatchList);

    const userDocRef = doc(db, "watchlist", user.uid); // Reference to user's watchlist document

    try {
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists()) {
        const currentWatchlist = userDocSnapshot.data().animals_id || [];
        const updatedFirestoreWatchlist = updatedWatchList.map(item => item.key); // Get the keys


        await updateDoc(userDocRef, {
          animals_id: updatedFirestoreWatchlist, // Update Firestore with new list
        });

        Alert.alert("Animal removed successfully! from watchlist");
      } else {
        await setDoc(userDocRef, {
          animals_id: updatedWatchList.map(item => item.key), // Use animal keys as the list of IDs
        });
    

        Alert.alert("Watchlist created and updated successfully!");
      }
    } catch (error) {
      console.error("Error updating or creating watchlist:", error);
    }
  };
  //write  me a   code for 

  const renderAnimalCard = ({ item }) => {
    return (
      <View style={[styles.card, { backgroundColor: isDarkMode ? '#333' : '#f8f8f8' }]}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <Text style={[styles.name, { color: isDarkMode ? '#fff' : '#000' }]}>{item.name}</Text>
        <TouchableOpacity onPress={() => toggleHeart(item.key)}>
          <View style={styles.hearticonContainer}>
            {watchList.some(animal => animal.key === item.key) ? (
              <AntDesign size={28} name="heart" color="red" />
            ) : (
              <AntDesign size={28} name="hearto" color="red" />
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: isDarkMode ? '#FF6347' : '#FF6347' }]}>
          <Text style={styles.buttonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#fff' }]}>
    <Text style={[styles.header, { color: isDarkMode ? '#fff' : '#000' }]}>Favorite Animals</Text>
    
    {watchList.length === 0 ? (
      <Text style={{ textAlign:'center',marginTop:'80%', fontSize:20,color: isDarkMode ? '#fff' : '#000' }}>No animals in your watchlist.</Text> // Message when empty
    ) : (
      <FlatList
        data={watchList}
        showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
        renderItem={renderAnimalCard}
        keyExtractor={(item) => item.key} // KeyExtractor properly set
      />
    )}
  
  </View>
  
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  name: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  hearticonContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default FavoritePage;
