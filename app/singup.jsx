import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../FirebaseConfig';
import { useRouter } from 'expo-router';
import { Entypo } from '@expo/vector-icons';
import { setLocalstorage } from '../Localstorage/localstorageService';
import { doc, setDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window'); // Get the screen width for responsive layout

const SignUp = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [confirmPasswordVisibility, setConfirmPasswordVisibility] = useState(true);
  const [passwordIcon, setPasswordIcon] = useState('eye');
  const [confirmPasswordIcon, setConfirmPasswordIcon] = useState('eye');

  // Simple validation function for sign-up
  const handleSignUp = () => {
    // Check if all fields are filled
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields.');
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

    // Confirm password validation (check if passwords match)
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true); // Show loading indicator while the process is ongoing

    // Sign up user with Firebase
    createUserWithEmailAndPassword(auth, email, password)
      .then(async(userCredential) => {
        // Signed up 
        const user = userCredential.user;

           const docId = Date.now().toString();
            await setDoc(doc(db, "users", docId), {
              id: docId,
              email: user.email
            });
  
        await setLocalstorage('user', user); // Save the user data to local storage

        // Redirect to the home screen
        router.push('(tabs)');
        
        // Alert for success
        Alert.alert('Success', 'Account created successfully!');
        setLoading(false); // Hide loading indicator
      })
      .catch((error) => {
        setLoading(false); // Hide loading indicator
        const errorCode = error.code;
        const errorMessage = error.message;
        Alert.alert('Error', errorMessage); // Show error message
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Password Input */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={passwordVisibility}
        />
        <Entypo
          name={passwordIcon}
          size={24}
          color="black"
          style={styles.icon}
          onPress={() => {
            setPasswordVisibility(!passwordVisibility);
            setPasswordIcon(passwordIcon === 'eye' ? 'eye-with-line' : 'eye');
          }}
        />
      </View>

      {/* Confirm Password Input */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={confirmPasswordVisibility}
        />
        <Entypo
          name={confirmPasswordIcon}
          size={24}
          color="black"
          style={styles.icon}
          onPress={() => {
            setConfirmPasswordVisibility(!confirmPasswordVisibility);
            setConfirmPasswordIcon(confirmPasswordIcon === 'eye' ? 'eye-with-line' : 'eye');
          }}
        />
      </View>

      {/* Sign-Up Button */}
      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      {/* Login Link */}
      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.loginText}>Already have an account? Login</Text>
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
  passwordContainer: {
    width: width * 0.9,
    position: 'relative',
    marginBottom: 15,
  },
  passwordInput: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 15,
    backgroundColor: '#fff',
  },
  icon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
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
  loginText: {
    marginTop: 15,
    color: '#007bff',
    fontSize: 16,
  },
});

export default SignUp;
