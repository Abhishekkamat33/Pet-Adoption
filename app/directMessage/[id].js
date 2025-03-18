import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, FlatList, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import uuid from 'react-native-uuid';
import { AntDesign } from '@expo/vector-icons';
import { useOwner } from '../../ChatContext/OwnerContextProvider';
import { LoginUser } from '../../contexprovider/UserContextProvider';
import { db } from '../../FirebaseConfig';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useTheme } from '../../ThemeContext'; // Import the useTheme hook

const DirectMessage = () => {
  const { id } = useLocalSearchParams(); // Access the id from the URL parameters
  const { user } = LoginUser(); // Access logged-in user data
  const Owner = useOwner(); // Get the ownerID from context
  const router = useRouter();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState(null); // Initialize with null
  const userId = user.uid; // The userId from the user data
  const { isDarkMode } = useTheme(); // Access the theme state (dark mode or light mode)

  useEffect(() => {
    listenToChatById(id); // Listen for chat updates when `id` changes or user changes
  }, [id, user]); // Re-run when either `id` or `user` changes

  const listenToChatById = (chatId) => {
    const chatDocRef = doc(db, 'Chats', chatId);

    const unsubscribe = onSnapshot(chatDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setChats(docSnapshot.data());
      } else {
        console.log('No chat found with this ID');
      }
    });

    return unsubscribe; // Return unsubscribe to stop listening when needed
  };

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    if (chats && chats.messages) {
      let newMessages = [];

      chats.messages.forEach((message) => {
        if (!newMessages.some((m) => m._id === message._id)) {
          newMessages.push(message);
        }
      });

      setMessages(newMessages); // Update the messages state
    }
  }, [chats]); // Dependency on `chats` ensures this effect runs when `chats` updates

  messages.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA; // Sort in descending order (newest first)
  });

  const formatTimestamp = (timestamp) => {
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 24-hour to 12-hour format
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const onSendMessage = async (text) => {
    Alert.alert('submit');
    if (text.trim() === '') {
      return;
    }
    const uniqueId = uuid.v4();
    const docId = uuid.v4(); // Unique ID for the new message
    const newMessage = {
      _id: uniqueId,
      text: text || '', // Make sure `text` is always defined
      user: {
        _id: uniqueId,
        name: userId,
      },
      createdAt: new Date().toISOString(),
    };

    if (chats && chats.messages) {
      const chatDocRef = doc(db, 'Chats', id);
      const chatDoc = await getDoc(chatDocRef);
      const currentMessages = chatDoc.data().messages || [];
      await setDoc(chatDocRef, {
        ...chatDoc.data(),
        messages: [...currentMessages, newMessage],
      });

      const updatedChatDoc = await getDoc(chatDocRef);
      const updatedMessages = updatedChatDoc.data().messages || [];
      setMessages(updatedMessages);
      setNewMessage('');
    } else {
      await setDoc(doc(db, 'Chats', docId), {
        OwnerID: id,
        userId: user.uid,
        messages: [newMessage],
      });
      setMessages([newMessage]);
      setNewMessage('');
    }
  };

  const renderItem = ({ item }) => {
    const isUserMessage = item.user.name === userId;
    return (
      <View
        style={[styles.messageContainer, isUserMessage ? styles.userMessage : styles.receiverMessage, isDarkMode && styles.darkMessageContainer]}
      >
        <Text style={[styles.messageText, isDarkMode && styles.darkMessageText]}>{item.text}</Text>
        <Text style={[styles.timestamp, isDarkMode && styles.darkTimestamp]}>
          {formatTimestamp(new Date(item.createdAt))}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <AntDesign size={28} name="arrowleft" color={isDarkMode ? 'white' : 'black'} />
          </TouchableOpacity>
          <Text style={[styles.chatName, isDarkMode && styles.darkChatName]}>Chat</Text>
        </View>

        {/* FlatList as the scrollable area for messages */}
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          inverted
          contentContainerStyle={styles.messageList}
        />

        {/* Input area stays fixed at the bottom */}
        <View style={[styles.inputContainer, isDarkMode && styles.darkInputContainer]}>
          <TextInput
            style={[styles.input, isDarkMode && styles.darkInput]}
            placeholder="Enter your message"
            onChangeText={(text) => setNewMessage(text)}
            value={newMessage}
            onSubmitEditing={() => onSendMessage(newMessage)}
          />
          <TouchableOpacity
            style={[styles.sendButton, isDarkMode && styles.darkSendButton]}
            onPress={() => onSendMessage(newMessage)}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    padding: 10,
  },
  darkHeader: {
    backgroundColor: '#1c1c1c',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 28,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  darkChatName: {
    color: 'white',
  },
  messageList: {
    flexGrow: 1,
    paddingBottom: 80, // To avoid input overlap
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 10,
    borderRadius: 15,
    padding: 10,
  },
  darkMessageContainer: {
    backgroundColor: '#444',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  receiverMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#5d5755',
  },
  darkMessageText: {
    color: 'white',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 5,
  },
  darkTimestamp: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    padding: 10,
    backgroundColor: '#fff',
  },
  darkInputContainer: {
    backgroundColor: '#333',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    paddingLeft: 15,
    marginRight: 10,
  },
  darkInput: {
    backgroundColor: '#555',
    color: 'white',
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  darkSendButton: {
    backgroundColor: '#4CAF50',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DirectMessage;
