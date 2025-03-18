import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, Animated, TextInput, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '../../ThemeContext';
import { useRouter } from 'expo-router';
import { LoginUser } from '../../contexprovider/UserContextProvider';
import { useAnimalsContext } from '@/contexprovider/AnimalsContextProvider';
import { db } from '../../FirebaseConfig';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useOwner } from '@/ChatContext/OwnerContextProvider';

const { width, height } = Dimensions.get('window');

const categoriesData = [
  { id: '1', name: 'Dog' },
  { id: '2', name: 'Cow' },
  { id: '3', name: 'Cat' },
  { id: '4', name: 'Bird' },
  { id: '5', name: 'Reptile' },
  { id: '6', name: 'Fish' },
  { id: '7', name: 'Farm Animal' },
];

const Home = () => {
  const { setOwnerID } = useOwner(); // Get the setOwnerID function from context
  const router = useRouter();
  const { result, loading } = useAnimalsContext();
  const { user, loadingUser } = LoginUser();
  const { isDarkMode } = useTheme();
  const [watchList, setWatchList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const animations = useRef(result.map(() => new Animated.Value(0))).current;


  const Adopt = (item) => {


    if (item?.createduser?.user_id !== user.uid) {
      console.log('OwnerID is not the same as user ID');
      const user_id = item?.createduser?.user_id;

      router.push(`/singleChatScreen/${user_id}`);
    } else {
      router.push('/');

      Alert.alert('You cannot chat with yourself.');
    }

  };
  // Handle animation once when the component is mounted
  useEffect(() => {
    Animated.stagger(100, animations.map((animation) =>
      Animated.timing(animation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    )).start();
  }, [animations]);

  // Check if user is loading
  useEffect(() => {
    if (loadingUser) {
      return; // Early return if loading
    }

    if (!user) {
      router.replace('/login'); // Navigate to login if no user
    }
  }, [loadingUser, user, router]);

  // Fetch watchlist data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || user === undefined) {
        console.log("No user data available.");
        return;
      }

      const userDocRef = doc(db, "watchlist", user.uid); // User-specific document for watchlist

      try {
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const animalIds = userDocSnapshot.data().animals_id || [];
          const watchlistAnimals = result.filter(animal => animalIds.includes(animal.key));
          setWatchList(watchlistAnimals);
        } else {
          setWatchList([]); // No watchlist, set to empty array
        }
      } catch (error) {
        console.error("Error fetching user document:", error);
      }
    };

    fetchData();
  }, [result, user]);



  const toggleHeart = async (id) => {
    // Check if the item is in the watchlist (local state)
    const updatedWatchList = watchList.some(item => item.key === id)
      ? watchList.filter(item => item.key !== id) // Remove id if it's already in the watchlist
      : [...watchList, { key: id }]; // Add id if it's not already in the watchlist

    // console.log("updatedWatchList", updatedWatchList);

    // Set the updated watchlist locally (state)
    setWatchList(updatedWatchList);

    const userDocRef = doc(db, "watchlist", user.uid); // User-specific document for watchlist
    try {
      // Fetch the current watchlist from Firestore
      const userDocSnapshot = await getDoc(userDocRef);



      if (userDocSnapshot.exists()) {
        // If the document exists, update it with the new watchlist
        const currentWatchlist = userDocSnapshot.data().animals_id || [];

        // Modify the current watchlist based on the action (add/remove)
        const updatedFirestoreWatchlist = updatedWatchList.map(item => item.key);

        // Update Firestore with the new list of animal IDs
        await updateDoc(userDocRef, {
          animals_id: updatedFirestoreWatchlist, // Set the updated watchlist in Firestore
        });

        Alert.alert("Watchlist updated successfully!");
        console.log("Watchlist updated successfully!");
      } else {
        // If the document does not exist, create a new one with the initial animal ID
        await setDoc(userDocRef, {
          animals_id: updatedWatchList.map(item => item.key), // Use animal keys as the list of IDs
          user: user, // Store user data as needed
        });

        Alert.alert("Watchlist created successfully!");
        console.log("Watchlist created successfully!");
      }
    } catch (error) {
      console.error("Error updating or creating watchlist:", error);
    }
  };

  const filteredAnimals = result.filter(animal => {
    // If selectedCategory is provided, filter by breed
    const matchesCategory = selectedCategory
      ? animal.breed.toLowerCase() === selectedCategory.toLowerCase()
      : true;

    // If searchTerm is provided, filter by breed name
    const matchesSearchTerm = searchTerm
      ? animal.breed.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    // Only return the animal if it matches the selectedCategory and/or searchTerm
    return matchesCategory && matchesSearchTerm;
  });


  const renderAnimalCard = ({ item, index }) => {
    const isInWatchList = watchList.some(animal => animal.key === item.key);

    return (
      <Animated.View
        style={[styles.animalCard, { opacity: animations[index] }, isDarkMode && styles.darkCard]}
      >
        <Image source={{ uri: item.image }} style={styles.animalImage} />
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 20 }}>
          <Text style={[styles.animalName, isDarkMode && styles.darkText]}>{item.name}</Text>
          <Text style={[styles.animalDetails, isDarkMode && styles.darkText]}>Age: {item.age}</Text>
          <Text style={[styles.animalDetails, isDarkMode && styles.darkText]}>Breed: {item.breed}</Text>
        </View>
        <Text style={[styles.animalDetails, isDarkMode && styles.darkText]}>Location: {item.location}</Text>

        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => toggleHeart(item.key)}>
            <View style={styles.hearticonContainer}>
              <AntDesign
                size={28}
                name={isInWatchList ? "heart" : "hearto"}
                color="red"
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, isDarkMode && styles.darkButton]}
            onPress={() => {
              Adopt(item)
            }}
          >
            <Text style={[styles.buttonText, isDarkMode && styles.darkButtonText]}>Adopt</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  useEffect(() => {
    // If searchTerm is provided, clear selectedCategory
    if (searchTerm && selectedCategory) {
      setSelectedCategory('');
    }

    // If selectedCategory is provided, clear searchTerm
    if (selectedCategory && searchTerm) {
      setSearchTerm('');
    }
  }, [selectedCategory, searchTerm]);



  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryButton, selectedCategory === item.name && styles.selectedCategoryButton, isDarkMode && selectedCategory === item.name && styles.darkSelectedCategoryButton]}
      onPress={() => setSelectedCategory(item.name === selectedCategory ? '' : item.name)}
    >
      <Text style={[styles.categoryButtonText, isDarkMode && styles.darkText]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.headerContainer, isDarkMode && styles.darkHeaderContainer]}>
          <Text style={[styles.headerText, isDarkMode && styles.darkHeaderText]}>Welcome to the Animal App</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, isDarkMode && styles.darkSearchInput]}
            placeholder="Search animal by name"
            value={searchTerm}
            onChangeText={(text) => setSearchTerm(text)}
          />
        </View>

        <Text style={[{ fontSize: 20, fontWeight: 'bold', marginLeft: 10 }, isDarkMode && styles.darkText]}>Categories</Text>
        <View style={styles.categoryContainer}>
          <FlatList
            data={categoriesData}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        <View style={styles.container}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={[styles.noResultsText, isDarkMode && styles.darkText]}>
                Loading...
              </Text>
            </View>
          )}



          {(filteredAnimals.length === 0 && !loading && selectedCategory) && (
            <View style={styles.loadingContainer}>
              <Text style={[styles.noResultsText, isDarkMode && styles.darkText]}>
                No animals found in this category
              </Text>
            </View>
          )}

          {(result.length === 0 && !loading) && (
            <View style={styles.loadingContainer}>
              <Text style={[styles.noResultsText, isDarkMode && styles.darkText]}>
                No animals found
              </Text>
            </View>
          )}


          <FlatList
            data={filteredAnimals}
            renderItem={renderAnimalCard}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      </ScrollView>
      <View style={styles.footerContainer}>
        <Text style={[styles.footerText, isDarkMode && styles.darkText]}>© 2023 Animal App. All rights reserved.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkSafeArea: {
    backgroundColor: '#333',
  },
  headerContainer: {
    height: 100,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkHeaderContainer: {
    backgroundColor: '#444',
  },
  headerText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
  },
  darkHeaderText: {
    color: '#f5f5f5',
  },
  animalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  animalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    width: 300,
    height: 350,
  },
  darkCard: {
    backgroundColor: '#444',
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  animalDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  iconContainer: {
    height: 50,
    width: '100%',
    display: 'flex',
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hearticonContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#f4511e',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  darkButton: {
    backgroundColor: '#888',
  },
  darkButtonText: {
    color: '#333',
  },
  searchContainer: {
    padding: 20,
    marginBottom: 50,
    alignItems: 'center',
  },
  searchInput: {
    width: width * 0.9,
    height: 50,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    paddingLeft: 15,
    fontSize: 16,
  },
  darkSearchInput: {
    backgroundColor: '#444',
    color: 'white',
    borderColor: '#888',
  },
  categoryContainer: {
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryButton: {
    backgroundColor: '#444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedCategoryButton: {
    backgroundColor: '#f4511e', // Highlight selected category
  },
  darkSelectedCategoryButton: {
    backgroundColor: '#f4511e',
  },
  categoryButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  darkCategoryButton: {
    backgroundColor: '#555',
  },
  darkText: {
    color: '#fff',
  },
  noResultsText: {
    marginTop: 80,
    textAlign: 'center',
    fontSize: 18,
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  footerContainer: {
    bottom: 0,
    height: 'auto',
    marginTop: 20,
    backgroundColor: '#333',
    paddingVertical: 10,
    alignItems: 'center',
  },
  darkFooterContainer: {
    backgroundColor: '#444',
  },
  footerText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Home;
