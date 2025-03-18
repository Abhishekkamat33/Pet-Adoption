import { View, Text, Image, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';  // Import the useRouter hook
import {LoginUser} from '../contexprovider/UserContextProvider'

// Get the screen width and height using Dimensions API
const { width, height } = Dimensions.get('window');

const Index = () => {
  const router = useRouter(); // Initialize router

 const {user}= LoginUser();

 
 useEffect(() => {
  if (user) {
    router.push('(tabs)');
  }
}, [user, router]); // Depend on user and router to trigger the effect when user changes


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('../assets/images/pexels-impact-dog-crates-1789722873-29040394.jpg')}
        style={[styles.image, { width: width * 0.99, height: height * 0.60 }]}  // 99% of the screen width and 75% of the screen height
      />
      <Text style={styles.title}>Adopt a Pet, Change a Life</Text>
      <Text style={styles.description}>
        Adopting a pet is one of the most rewarding experiences you can have.
        Pets provide companionship, affection, and unconditional love to their
        owners. They also teach responsibility, empathy, and compassion.
      </Text>
      
      {/* Button to navigate to /tabs/index */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('login')}  // Use router.push to navigate to the tabs/index screen
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    resizeMode: 'cover', // Ensures the image fills the container and respects the aspect ratio
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#f4511e',
    width: width * 0.9, // 90% of the screen width
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',  // Centers the text vertically
    alignItems: 'center',  // Centers the text horizontally
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default Index;
