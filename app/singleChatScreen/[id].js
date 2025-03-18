import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, setDoc, doc, getDoc } from "firebase/firestore";
import { View, TextInput, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Keyboard, Platform, TouchableWithoutFeedback, FlatList, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import uuid from 'react-native-uuid';
import { AntDesign } from '@expo/vector-icons';
import { LoginUser } from '../../contexprovider/UserContextProvider';
import { db } from '../../FirebaseConfig';
import { useTheme } from '../../ThemeContext';  // Import the custom hook to get theme

const SingleChatScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = LoginUser();
  const router = useRouter();
  const { isDarkMode } = useTheme();  // Get current theme state (dark or light mode)

  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [loader, setLoader] = useState(true);
  const userId= user.email;


  useEffect(() => {
    const unsubscribe = getAllChats();
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    getAllChats();
  }, []);

  console.log('useriD', userId);

  const getAllChats = () => {
    const userChatsQuery = query(
      collection(db, "Chats"),
      where("userId", "==", userId)
    );
    const ownerChatsQuery = query(
      collection(db, "Chats"),
      where("OwnerID", "==", userId)
    );

    const unsubscribeUserChats = onSnapshot(userChatsQuery, (snapshot) => {
      const userChatsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setChats((prevChats) => {
        const updatedChats = [...prevChats];
        userChatsData.forEach((newChat) => {
          if (!updatedChats.some((chat) => chat.id === newChat.id)) {
            updatedChats.push(newChat);
          }
        });
        return updatedChats;
      });
    });

    const unsubscribeOwnerChats = onSnapshot(ownerChatsQuery, (snapshot) => {
      const ownerChatsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setChats((prevChats) => {
        const updatedChats = [...prevChats];
        ownerChatsData.forEach((newChat) => {
          if (!updatedChats.some((chat) => chat.id === newChat.id)) {
            updatedChats.push(newChat);
          }
        });
        return updatedChats;
      });
    });

    return () => {
      unsubscribeUserChats();
      unsubscribeOwnerChats();
    };
  };

  useEffect(() => {
    if (chats && chats.length > 0) {
      let newMessages = [];
      chats.forEach((chat) => {
        if (chat.messages) {
          chat.messages.forEach((message) => {
            if (!newMessages.some((m) => m._id === message._id)) {
              newMessages.push(message);
            }
          });
        }
      });

      setMessages(newMessages);
      setLoader(false);
    } else {
      setLoader(false);
    }
  }, [chats]);

  const formatTimestamp = (timestamp) => {
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const onSendMessage = async (text) => {
    if (text.trim() === '') {
      return;
    }
    const uniqueId = uuid.v4();
    const newMessage = {
      _id: uniqueId,
      text: text || "",
      user: {
        _id: uniqueId,
        name: userId,
      },
      createdAt: new Date().toISOString(),
    };

    if (chats.length === 0) {
      const docId = uuid.v4();
      await setDoc(doc(db, "Chats", docId), {
        OwnerID: id,
        userId: user.email,
        messages: [newMessage],
      });
      setMessages([newMessage]);
      setNewMessage('');
    } else {
      const chatDocRef = doc(db, "Chats", chats[0].id);
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
    }
  };

  messages.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA;
  });

  if (loader) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const isUserMessage = item.user.name === userId;
    return (
      <View
        style={[
          styles.messageContainer,
          isUserMessage ? styles.userMessage : styles.receiverMessage,
          { backgroundColor: isDarkMode ? '#333' : (isUserMessage ? '#007bff' : '#5d5755') }
        ]}
      >
        <Text style={[styles.messageText, { color: isDarkMode ? '#fff' : '#000' }]}>{item.text}</Text>
        <Text style={[styles.timestamp, { color: isDarkMode ? '#ccc' : '#666' }]}>
          {formatTimestamp(new Date(item.createdAt))}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={[styles.container, { backgroundColor: isDarkMode ? '#181818' : '#fff' }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <AntDesign size={28} name="arrowleft" color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
              <Text style={[styles.chatName, { color: isDarkMode ? '#fff' : '#000' }]}>Chat</Text>
            </View>

            <FlatList
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    inverted
                    contentContainerStyle={styles.messageList}
                  />
          

            <View style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#444' : '#f1f1f1' }]}
                placeholder="Enter your message"
                placeholderTextColor={isDarkMode ? '#ccc' : '#888'}
                onChangeText={(text) => setNewMessage(text)}
                value={newMessage}
                onSubmitEditing={() => onSendMessage(newMessage)}
              />
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: isDarkMode ? '#007bff' : '#007bff' }]}
                onPress={() => onSendMessage(newMessage)}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    padding: 10,
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
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 10,
    borderRadius: 15,
    padding: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  receiverMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  messageList: {
    flexGrow: 1,
    paddingBottom: 80, // To avoid input overlap
  },
  timestamp: {
    fontSize: 12,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    padding: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingLeft: 15,
    marginRight: 10,
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SingleChatScreen;
