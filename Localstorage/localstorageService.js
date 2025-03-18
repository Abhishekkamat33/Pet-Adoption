import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to set data in AsyncStorage
export const setLocalstorage = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    // console.log('setLocalstorage - Key:', key, 'Value:', jsonValue);
    
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.log('Error saving user data:', e);
  }
}

// Function to get data from AsyncStorage
export const getLocalstorage = async (key) => {
  try {
    const result = await AsyncStorage.getItem(key);
    if (result != null) {
      try {
        return JSON.parse(result); // Safe parsing
      } catch (parseError) {
        console.log('Error parsing JSON:', parseError);
        return null; // Return null if parsing fails
      }
    }
    return null; // Return null if no data found
  } catch (e) {
    console.log('Error getting user data:', e);
    return null; // Return null if error occurs
  }
};

// Function to remove specific data from AsyncStorage
export const removeLocalstorage = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log('Removed data with key:', key);
  } catch (e) {
    console.log('Error removing user data:', e);
  }
}

// Function to clear all data from AsyncStorage
export const clearLocalstorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('Cleared all data in AsyncStorage');
  } catch (e) {
    console.log('Error clearing all user data:', e);
  }
}
