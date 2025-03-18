import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert, TextInput, Button, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../../ThemeContext'; // Import the useTheme hook
import { signOut } from 'firebase/auth';
import { LoginUser } from '../../contexprovider/UserContextProvider';
import { auth, db } from '../../FirebaseConfig';
import { Link, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { AntDesign } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { set } from 'date-fns';

const SettingsPage = () => {
  const router = useRouter();
  const { user, clearUserAndReload } = LoginUser(); // Fetch current user from context
  const { isDarkMode, toggleDarkMode } = useTheme(); // Consume the theme context
  const [isSigningOut, setIsSigningOut] = useState(false); // Track if signing out
  const [isdisabled, setIsDisabled] = useState(false);

  // User Info Form States
  const [name, setName] = useState(user?.displayName);
  const [address, setAddress] = useState(user?.updatedUserData?.address);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber);
  const [formError, setFormError] = useState('');
  const [image, setImage] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Phone number validation regex (10 digits)
  const isValidPhoneNumber = (number) => /^[0-9]{10}$/.test(number);

  // Handle user image
  const pickImage = async () => {
    try {
      // Open the image picker to select an image
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      // Check if the user canceled or didn't select an image
      if (!result.assets || result.assets.length === 0) {
        alert('No image selected.');
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileExtension = fileUri.split('.').pop().toLowerCase();

      // Validate file extension
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
      if (!validExtensions.includes(fileExtension)) {
        alert('Invalid image type! Only JPG, JPEG, PNG, and GIF are allowed.');
        return;
      }

      const mimeType = fileExtension === 'png' ? 'image/png' :
        fileExtension === 'jpeg' || fileExtension === 'jpg' ? 'image/jpeg' :
          fileExtension === 'gif' ? 'image/gif' : 'image/jpeg';

      // Set the selected image URI in state
      setImage(fileUri);

      // Get file info to check if the file exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        alert('Selected file does not exist!');
        return;
      }

      // Manipulate the image (resize and compress)
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        fileUri,
        [{ resize: { width: 800, height: 600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Prepare the image data for uploading
      const formData = new FormData();
      formData.append('file', {
        uri: manipulatedImage.uri,
        type: 'image/jpeg',
        name: `pet_image.${fileExtension}`,
      });
      formData.append('upload_preset', 'animaladoption'); // Cloudinary upload preset
      formData.append('cloud_name', 'drrcvdeb3'); // Cloudinary cloud name

      // Set uploading state to true
      setIsUploading(true);

      // Upload image to Cloudinary
      const response = await fetch(`https://api.cloudinary.com/v1_1/drrcvdeb3/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to upload image: ' + errorData.error.message);
      }

      const data = await response.json();
      setIsUploading(false); // Reset uploading state
      setMediaUrl(data.secure_url); // Store the uploaded image URL

      // Log the uploaded image URL
      console.log('Image uploaded successfully:', data.secure_url);
    } catch (error) {
      setIsUploading(false); // Reset uploading state
      alert('Error uploading image. Please try again.');
      console.error(error); // Log error for debugging purposes
    }
  };

  useEffect(() => {
    setName(user?.displayName);
    setAddress(user?.updatedUserData?.address);
    setPhoneNumber(user?.phoneNumber);
    setImage(user?.photoURL);
  }, [isdisabled])


  
  // Handle logout action
  const handleSignOut = async () => {
    try {
      await signOut(auth); // Sign out from Firebase
      await clearUserAndReload(); // Clear user data from context and AsyncStorage

      Alert.alert('Sign-out successful!');
      console.log('Sign-out successful.');
      setIsSigningOut(true);
    } catch (error) {
      console.error('Error signing out:', error.message);
      Alert.alert('Error', 'An error occurred while signing out.');
    } finally {
      setIsSigningOut(false); // Reset signing out state
    }
  };

  // Navigate to login page after signing out
  useEffect(() => {
    if (isSigningOut) {
      router.replace('/login');
    }
  }, [isSigningOut]);



  // Handle form submission
  const handleSubmit = async () => {
    if (!isValidPhoneNumber(phoneNumber)) {
      setFormError('Please enter a valid phone number.');
    } else {
      setFormError('');

      const userInfo = {
        name,
        address,
        phoneNumber,
        mediaUrl: image,
      };
     

      try {
        // Query the 'users' collection for the document with the matching email
        const userQuery = query(
          collection(db, 'users'),
          where('email', '==', user?.email)
        );

        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
          // If the document is found
          const userDocRef = doc(db, 'users', querySnapshot.docs[0].id);



          // Prepare the user data to update
          const updatedUserData = {
            address: userInfo.address,
          };

          // Update the document
          await updateDoc(userDocRef, {
            phoneNumber: userInfo?.phoneNumber,
            displayName: userInfo?.name,
            photoURL: mediaUrl,
            updatedUserData,
          });

          setIsDisabled(false);
          console.log('User data updated successfully');
          setName('');
          setAddress('');
          setPhoneNumber('');
          setImage(null);
        } else {
          console.log('No user found with this email!');
        }
      } catch (error) {
        console.error('Error updating user info:', error.message);
      }

      // // Proceed with submitting the form
      // console.log('Form submitted with:', { name, address, phoneNumber });
    }
  };

  const isFormValid = name && address && phoneNumber && isValidPhoneNumber(phoneNumber);

  return (
    <SafeAreaView style={styles.Areacontainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.container, isDarkMode ? styles.darkMode : styles.lightMode]}>
          <Text style={[styles.header, isDarkMode ? styles.darkText : styles.lightText]}>Settings <AntDesign name="setting" size={24} color="black" /> </Text>

          {/* Dark Mode Toggle */}
          <View style={styles.hero}>
            <View style={[styles.settingItem]}>
              <Text style={[styles.settingLabel, isDarkMode ? styles.darkText : styles.lightText]}>
                Dark Mode
              </Text>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
            <Link href="/Animal_History/animal_history">
              <View style={styles.animalhistory}>
                <Text style={[styles.userInfo, isDarkMode ? styles.darkText : styles.lightText]}>Your  Animals</Text>
              </View>
            </Link>

            {/* User Information */}
            <View style={styles.settingUser}>
              <TouchableOpacity onPress={() => setIsDisabled(!isdisabled)}>
                <Text style={[styles.userInfo, isDarkMode ? styles.darkText : styles.lightText]}>Update your Information</Text>
              </TouchableOpacity>
              {isdisabled ? (
                <View style={[styles.formContainer, isDarkMode && styles.darkFormContainer]}>
                  <Text style={{ fontSize: 20, marginBottom: 10 }}>Edit User Information</Text>

                  {/* Image Upload Section */}
                  <View style={[styles.imageContainer]}>
                    <Button title="Pick an image from camera roll" onPress={pickImage} />
                    {isUploading && <ActivityIndicator size="large" color="#2f4f4f" />}
                    {image && !isUploading && (
                      <Image
                        source={{ uri: image }} // Display the selected image
                        style={styles.image}    // Apply styles to the image
                      />
                    )}
                  </View>

                  {/* User Information Form Fields */}
                  <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Name</Text>
                  <TextInput
                    style={[styles.input, isDarkMode && styles.darkInput]}
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                  />

                  <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Address</Text>
                  <TextInput
                    style={[styles.input, isDarkMode && styles.darkInput]}
                    placeholder="Enter your address"
                    value={address}
                    onChangeText={setAddress}
                  />

                  <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Phone number</Text>
                  <TextInput
                    style={[styles.input, isDarkMode && styles.darkInput]}
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="numeric"
                  />

                  {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                  <TouchableOpacity
                    style={[styles.submitButton, isDarkMode && styles.darkSubmitButton]}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.submitButtonText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({

  Areacontainer: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    padding: 20,
  },
  hero: {
    marginTop: 20,
  },
  settingUser: {
    marginTop: 10,
    paddingBottom: 30,
  },

  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  settingLabel: {
    fontSize: 18,
  },
  formContainer: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#ccc',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  submitButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },

  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  signOutButton: {
    backgroundColor: '#d9534f',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  darkMode: {
    backgroundColor: '#121212',
  },
  lightMode: {
    backgroundColor: '#fff',
  },
  darkText: {
    color: '#fff',
  },
  lightText: {
    color: '#000',
  },
  darkFormContainer: {
    backgroundColor: '#2e2e2e',
  },
  darkInputLabel: {
    color: '#fff',
  },
  darkInput: {
    backgroundColor: '#444',
    color: '#fff',
  },
  darkSubmitButton: {
    backgroundColor: '#4e4e4e',
  },
});

export default SettingsPage;
