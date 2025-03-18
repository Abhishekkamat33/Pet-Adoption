import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LoginUser } from '../../contexprovider/UserContextProvider';
import { db } from '../../FirebaseConfig';
import { query, collection, onSnapshot, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../../ThemeContext';

const ChatListScreen = () => {
  const router = useRouter();
  const { user } = LoginUser(); // Get the logged-in user data
  const { isDarkMode } = useTheme();
  const [chats, setChats] = useState([]); // State to store the fetched chats
  const [titleCollection, setTitleCollection] = useState([]); // State for title collection
  const [searchQuery, setSearchQuery] = useState([]); // State for user data

  
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]); // Ensure this runs only when `user` is available


  const userId = user?.email;

  // Function to fetch all chats
  const getAllChats = () => {
    const userChatsQuery = query(collection(db, "Chats"), where("userId", "==", userId));
    const ownerChatsQuery = query(collection(db, "Chats"), where("OwnerID", "==", userId));

    setChats([]); // Clear the chats state before fetching

    // Handle userChats
    const unsubscribeUserChats = onSnapshot(userChatsQuery, (snapshot) => {
      const userChatsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(prevChats => [...prevChats, ...userChatsData]);
    });

    // Handle ownerChats
    const unsubscribeOwnerChats = onSnapshot(ownerChatsQuery, (snapshot) => {
      const ownerChatsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(prevChats => [...prevChats, ...ownerChatsData]);
    });

    // Cleanup listeners
    return () => {
      unsubscribeUserChats();
      unsubscribeOwnerChats();
    };
  };

  // Re-fetch chats whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setChats([]); // Clear previous chats
      const unsubscribe = getAllChats();
      return () => unsubscribe();
    }, [])
  );

  // Fetch user data for each title in titleCollection
  useEffect(() => {
    const fetchUserDocs = async () => {
      const updatedSearchQuery = [];

      for (const title of titleCollection) {
        const userQuery = query(
          collection(db, 'users'), // Reference to the users collection
          where('email', '==', title) // Query to match the user's email
        );

        try {
          // Execute the query to find the user document
          const querySnapshot = await getDocs(userQuery);

          if (!querySnapshot.empty) {
            // If the document is found
            const userDocRef = doc(db, 'users', querySnapshot.docs[0].id); // Get the document reference

            // Get the initial user data
            const userDocSnapshot = await getDoc(userDocRef);
            if (userDocSnapshot.exists()) {
              const userData = userDocSnapshot.data();
              updatedSearchQuery.push(userData);
            } else {
              console.log('User document not found');
            }
          }
        } catch (error) {
          console.error("Error fetching user document:", error);
        }
      }

      // Update searchQuery state after all user docs are fetched
      setSearchQuery(updatedSearchQuery);
    };

    fetchUserDocs();
  }, [titleCollection]); // Run this effect when titleCollection changes

  useEffect(() => {
    // Collect titles from chats and update the state in one go
    const newTitleCollection = [];

    chats.forEach(chat => {
      const title = chat.OwnerID === userId ? chat.userId : chat.OwnerID;
      if (!newTitleCollection.includes(title)) {
        newTitleCollection.push(title);
      }
    });

    // Update titleCollection after chats are fetched
    setTitleCollection(newTitleCollection);
  }, [chats]); // Run this effect when chats change

  // Helper function to truncate the message to 7 words
  const truncateMessage = (message) => {
    if (!message) return 'No message'; // If message is undefined, null, or empty, return a default message
    const words = message.split(' ');
    if (words.length > 7) {
      return words.slice(0, 7).join(' ') + '...'; // Truncate after 7 words and add "..."
    }
    return message; // Return the message if it's less than or equal to 7 words
  };

  const renderItem = ({ item }) => {
    const isUserMessage = item.OwnerID === userId;
    let title = isUserMessage ? item.userId : item.OwnerID;

    const user = searchQuery.find(user => user.email === title);
    if (user) {
      title = user.displayName;

    }

    const description = isUserMessage ? item.messages : item.messages;
    description.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const recentMessageText = description[0]?.text ? truncateMessage(description[0]?.text) : "No messages yet";
    const formatTimestamp = (timestamp) => {
      const hours = timestamp.getHours();
      const minutes = timestamp.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12; // Convert 24-hour to 12-hour format
      const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    };

    const recentMessageTime = description[0]?.createdAt || new Date();

    return (
      <View style={[styles.chatContainer, isDarkMode && styles.darkChatContainer]}>
      <TouchableOpacity
        style={[styles.chatItem, isDarkMode && styles.darkChatItem]}
        onPress={() => router.push(`/directMessage/${item.id}`)}
      >
        <Image
          source={{ uri:user?.photoURL || "https://randomuser.me/api/portraits/men/1.jpg" }}
          style={styles.avatar}
        />
        <View style={styles.chatDetails}>
          <Text style={[styles.chatName, { color: isDarkMode ? '#fff' : '#000' }]}>{title}</Text>
          <Text style={[styles.chatMessage, { color: isDarkMode ? '#ccc' : '#666' }]}>{recentMessageText}</Text>
        </View>
        <Text style={styles.chatTime}>{formatTimestamp(new Date(recentMessageTime))}</Text>
      </TouchableOpacity>
      </View>
    );
  };

  if (!chats || chats.length === 0) {
    return <Text style={{ fontSize: 20, marginTop: 100, alignSelf: 'center' }}>No chat yet</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#333' : '#fff' }}>
    <FlatList
      data={chats}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  darkChatContainer: {
    backgroundColor: '#333',
  },

  chatItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  chatDetails: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatMessage: {
    fontSize: 14,
  },
  chatTime: {
    fontSize: 12,
    color: '#888',
  },
  darkChatItem: {
    backgroundColor: '#333',
  },
});

export default ChatListScreen;
