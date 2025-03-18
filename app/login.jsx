import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { LoginUser } from '../contexprovider/UserContextProvider';

const { width } = Dimensions.get('window'); // Get the screen width for responsive layout

const Login = () => {
  const router = useRouter();
  const { user, setUserAndUpdateContext } = LoginUser();

  useEffect(() => {
    if (user) {
      router.push('(tabs)');
    }
  }, [user]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Simple validation function
  const handleLogin = () => {

    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    // Email validation regex (basic check for email format)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    // Password validation (check if it is at least 6 characters long)
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      await setUserAndUpdateContext(user);
      router.replace('(tabs)');
      Alert.alert('Login successful!');
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Error Code:', errorCode); // Log error code for debugging
      console.error('Error Message:', errorMessage); // Log error message for debugging
  
      if (errorCode === 'auth/invalid-email') {
        Alert.alert('Error', 'The email address is not valid.');
      } else if (errorCode === 'auth/user-not-found') {
        Alert.alert('Error', 'No user found with this email.');
      } else if (errorCode === 'auth/wrong-password') {
        Alert.alert('Error', 'Incorrect password.');
      } else if (errorCode === 'auth/invalid-credential') {
        Alert.alert('Error', 'Invalid credentials. Please check the email and password.');
      } else {
        Alert.alert('Error', 'An unknown error occurred. Please try again.');
      }
      console.log('Error logging in:', errorMessage);
    });
  
  };
        
        // Signed in 
       
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Login Button */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* Sign Up Link */}
      <TouchableOpacity onPress={() => router.push('singup')}>
        <Text style={styles.signupText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: width * 0.9, // Use 90% of the screen width
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    width: width * 0.9,
    height: 50,
    backgroundColor: '#f4511e',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupText: {
    marginTop: 15,
    color: '#007bff',
    fontSize: 16,
  },
});

export default Login;
