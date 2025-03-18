import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { db } from '../../FirebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { LoginUser } from '../../contexprovider/UserContextProvider';
import { useTheme } from '../../ThemeContext'; // Use the useTheme hook to manage dark mode

const PetForm = () => {
  const { user } = LoginUser();
  const { isDarkMode } = useTheme(); // Use theme context for dark mode

  const [petName, setPetName] = useState('');
  const [petAge, setPetAge] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petLocation, setPetLocation] = useState('');
  const [image, setImage] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isdatasaved, setisdatasaved] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.assets && result.assets[0].uri) {
      const fileUri = result.assets[0].uri;
      const fileExtension = fileUri.split('.').pop().toLowerCase();

      const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
      if (!validExtensions.includes(fileExtension)) {
        alert('Invalid image type! Only JPG, JPEG, PNG, and GIF are allowed.');
        return;
      }

      const mimeType = fileExtension === 'png' ? 'image/png' :
        fileExtension === 'jpeg' || fileExtension === 'jpg' ? 'image/jpeg' :
          fileExtension === 'gif' ? 'image/gif' : 'image/jpeg';

      setImage(fileUri);

      try {
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (!fileInfo.exists) {
          alert('Selected file does not exist!');
          return;
        }

        const manipulatedImage = await ImageManipulator.manipulateAsync(
          fileUri,
          [{ resize: { width: 800, height: 600 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        const formData = new FormData();
        formData.append('file', {
          uri: manipulatedImage.uri,
          type: 'image/jpeg',
          name: `pet_image.${fileExtension}`,
        });
        formData.append('upload_preset', 'animaladoption');
        formData.append('cloud_name', 'drrcvdeb3');

        setIsUploading(true);

        const response = await fetch(`https://api.cloudinary.com/v1_1/drrcvdeb3/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        setIsUploading(false);
        setMediaUrl(data.secure_url);
      } catch (error) {
        setIsUploading(false);
        alert('Error uploading image. Please try again.');
      }
    }
  };


  const handleFormSubmit = async () => {
    if (!petName || !petAge || !petBreed) {
      alert('Please fill out all fields!');
      return;
    }

    if (!mediaUrl) {
      alert('Please upload an image!');
      return;
    }

    const createduser = {
      user_id: user.uid,
      user_email: user.email,
      user_Name: user.displayName,
      user_image: user.photoURL
    };

    try {
      setisdatasaved(true);
      const docId = Date.now().toString();
      await setDoc(doc(db, "Animals", docId), {
        name: petName,
        age: petAge,
        breed: petBreed,
        location: petLocation,
        image: mediaUrl,
        createduser,
        created_at: new Date().toISOString()
      });
      setPetName('');
      setPetAge('');
      setPetBreed('');
      setPetLocation('');
      setImage(null);
      setMediaUrl(null);
      setisdatasaved(false);
      alert('New pet added successfully!');
    } catch (error) {
      alert('Error adding pet. Please try again.');
    }
  };

  return (
    <ScrollView style={[styles.scrollView, isDarkMode && styles.darkScrollView]}>
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <Text style={[styles.title, isDarkMode && styles.darkTitle]}>Add a New Pet for Adoption</Text>

        <View style={[styles.imageContainer, isDarkMode && styles.darkImageContainer]}>
          <Button title="Pick an image from camera roll" onPress={pickImage} />
          {image && <Image source={{ uri: image }} style={styles.image} />}
          {isUploading && <ActivityIndicator size="large" color="#2f4f4f" />}
        </View>

        <View style={[styles.formContainer, isDarkMode && styles.darkFormContainer]}>
          <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Pet's Name</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.darkInput]}
            placeholder="Enter pet's name"
            value={petName}
            onChangeText={setPetName}
          />

          <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Pet's Age</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.darkInput]}
            placeholder="Enter pet's age"
            value={petAge}
            onChangeText={setPetAge}
            keyboardType="numeric"
          />

          <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Pet's Breed</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.darkInput]}
            placeholder="Enter pet's breed"
            value={petBreed}
            onChangeText={setPetBreed}
          />

          <Text style={[styles.inputLabel, isDarkMode && styles.darkInputLabel]}>Add Location</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.darkInput]}
            placeholder="Enter pet's location"
            value={petLocation}
            onChangeText={setPetLocation}
          />

          {isdatasaved && isUploading ? (
            <ActivityIndicator size="large" color="#2f4f4f" />
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, isdatasaved && isUploading ? styles.disabledButton : styles.enabledButton]}
              onPress={handleFormSubmit}
              disabled={isdatasaved}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkScrollView: {
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  darkContainer: {
    backgroundColor: '#333',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2f4f4f',
    marginBottom: 20,
  },
  darkTitle: {
    color: '#fff',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  darkImageContainer: {
    backgroundColor: '#333',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginTop: 10,
  },
  formContainer: {
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  darkInputLabel: {
    color: '#fff',
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingLeft: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  darkInput: {
    backgroundColor: '#555',
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#2f4f4f',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#888',
  },
  enabledButton: {
    backgroundColor: '#2f4f4f',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PetForm;
