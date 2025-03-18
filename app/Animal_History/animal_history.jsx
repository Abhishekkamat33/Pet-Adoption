import React, { useState } from 'react';
import { View, Text, FlatList, Button, TextInput, TouchableOpacity, Alert, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useAnimalsContext } from '../../contexprovider/AnimalsContextProvider';
import { LoginUser } from '../../contexprovider/UserContextProvider';
import { useRouter } from 'expo-router';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
 



// Dummy data for animals (you can replace this with actual API data)


const AnimalHistory = () => {
  const router = useRouter();
  const { result, loading } = useAnimalsContext();
  const { user, loadingUser } = LoginUser();
  const [animals, setAnimals] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAnimal, setCurrentAnimal] = useState(null);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [location, setLocation] = useState('');
  const [age, setAge] = useState('');
  const [image, setImage] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  if(!user){
    router.push('login');
  }


  //handle Image
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

   

  // Handle Edit Button
  const handleEdit = (animal) => {
 
    setIsEditing(true);
    setCurrentAnimal(animal);
    setName(animal.name);
    setBreed(animal.breed);
    setLocation(animal.location);
    setAge(animal.age.toString());
    setImage(animal.image);
  };

  // check the animal which is created by user
  const userAnimals = result.filter(animal => animal.createduser.user_id === user.uid);



  if(userAnimals.length === 0){
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>No Animals Found</Text>
      </View>
    );  
  }
  

  // Handle Save
  const handleSave = async (key) => {

try {
  await updateDoc(doc(db, "Animals", key), {
    name: name,
    breed: breed,
    location: location,
    age: age,
    image: mediaUrl,
    updated_at: new Date().toISOString()
  })
 
}catch (error) {
  console.log(error);
}
    setIsEditing(false);
    setCurrentAnimal(null);
    setName('');
    setBreed('');
    setLocation('');
    setAge('');
  };

  // Handle Cancel
  const handleCancel = () => {
    setIsEditing(false);
    setCurrentAnimal(null);
    setName('');
    setBreed('');
    setLocation('');
    setAge('');
    setImage(null);
    setMediaUrl(null);
  };

  // Handle Delete
  const handleDelete = (id) => {
    console.log('id',id);
    
    Alert.alert(
      "Delete Animal",
      "Are you sure you want to delete this animal?",
      [
        { text: "Cancel" },
        { text: "OK", onPress: () => {
          deleteAnimal(id);
        }},
      ]
    );
  };

  const deleteAnimal = async (id) => {
    try {
      await deleteDoc(doc(db, "Animals", id));
      alert("Animal deleted successfully!");
    } catch (error) {
      console.error("Error deleting animal:", error);
    }
  }
  
  const timeFormated = (time) => {
    const date = new Date(time);
    return date.toLocaleString();
  }


  // Render Item for FlatList
  const renderItem = ({ item }) => (
    
    <View style={{ padding: 10, marginBottom: 10, borderWidth: 1, borderRadius: 5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' , marginBottom: 10 }}>
      <View style={{  justifyContent: 'space-between' }}>
      <Text><Text style={{ fontWeight: 'bold' }}>Name:</Text> {item?.name}</Text>
      <Text><Text style={{ fontWeight: 'bold' }}>Breed:</Text> {item?.breed}</Text>
      <Text><Text style={{ fontWeight: 'bold' }}>Location:</Text> {item?.location}</Text>
      <Text><Text style={{ fontWeight: 'bold' }}>Age:</Text> {item?.age}</Text>
      </View>
      <View style={{justifyContent: 'space-between' }}>
        <Text><Text style={{fontSize: 12, fontWeight: 'bold' }}>Created At:</Text> {timeFormated(item?.created_at) || 'N/A'}</Text> 
        <Image source={{ uri: item?.image || 'https://via.placeholder.com/150' }} style={{ width: 150, height: 100 ,marginLeft: 40 }} /> 
      </View>
      </View>

      <Button title="Edit"  onPress={() => handleEdit(item)} />
      <Button title="Delete" onPress={() => handleDelete(item.key)} color="red" />
    </View>
  );
 

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Animal History</Text>

      {/* Animal List */}
      <FlatList
        data={userAnimals}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
      />

      {/* Edit Form */}
      {isEditing && currentAnimal && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 20, marginBottom: 10 }}>Edit Animal</Text>
         <View style={[styles.imageContainer]}>
                   <Button  title="Pick an image from camera roll" onPress={pickImage} />
                   {isUploading && <ActivityIndicator size="large" color="#2f4f4f" />}
                   {
                   mediaUrl ? (<Image source={{ uri: mediaUrl }} style={styles.image} />): (<Image source={{ uri: image }} style={styles.image} />)
                 }
           </View>
              
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />
          <TextInput
            value={breed}
            onChangeText={setBreed}
            placeholder="Breed"
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Location"
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />
          <TextInput
            value={age}
            onChangeText={setAge}
            placeholder="Age"
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title="Cancel" onPress={handleCancel} />
            <Button title="Save" onPress={()=> handleSave(currentAnimal.key)} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'coloumn',
    gap: 10,
  },
  
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  darkImageContainer: {
    backgroundColor: '#333',
  },
  darkImage: {
    borderColor: '#fff',
  },
});

export default AnimalHistory;
