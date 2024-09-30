// import React, { useState } from 'react';
// import { SafeAreaView } from 'react-native';
// import ChatUI from '../../../components/chat'; // Adjust the import path as necessary

// // Define types
// type MessageType = {
//   id: string;
//   text: string;
//   sender: 'user' | 'other';
//   timestamp: Date;
//   replyTo?: string;
// };

// // Define some fake data for chat messages
// const fakeMessages: MessageType[] = [
//   {
//     id: '1',
//     text: 'Hello!',
//     sender: 'other',
//     timestamp: new Date(2023, 5, 1, 14, 30),
//   },
//   {
//     id: '2',
//     text: 'Hi there!',
//     sender: 'user',
//     timestamp: new Date(2023, 5, 1, 14, 35),
//   },
//   {
//     id: '3',
//     text: 'How are you?',
//     sender: 'other',
//     timestamp: new Date(2023, 5, 1, 14, 40),
//   },
//   {
//     id: '4',
//     text: 'I am good, thanks! How about you?',
//     sender: 'user',
//     timestamp: new Date(2023, 5, 1, 14, 45),
//   },
//   // Add more messages as needed
// ];

// // Define other user information
// const otherUser = {
//   name: 'Jane Doe',
//   avatar: 'https://example.com/jane_avatar.png', // Replace with a valid image URL
// };

// const ChatScreen = () => {
//   const [messages, setMessages] = useState<MessageType[]>(fakeMessages); // Ensure state is of type MessageType[]

//   // Function to handle sending a new message
//   const handleSendMessage = (message: string, replyToId?: string) => {
//     const newMessage: MessageType = {
//       id: Date.now().toString(),
//       text: message,
//       sender: 'user',
//       timestamp: new Date(),
//       replyTo: replyToId,
//     };
//     setMessages((prevMessages) => [newMessage, ...prevMessages]);
//   };

//   // Function to handle deleting a message
//   const handleDeleteMessage = (messageId: string, forEveryone: boolean) => {
//     setMessages((prevMessages) =>
//       prevMessages.filter((message) => message.id !== messageId)
//     );
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: '#433878' }}>
//       <ChatUI
//         messages={messages}
//         onSendMessage={handleSendMessage}
//         onDeleteMessage={handleDeleteMessage}
//         otherUser={otherUser}
//       />
//     </SafeAreaView>
//   );
// };

// export default ChatScreen;

import { Redirect, router } from "expo-router";
import { FC } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ListRenderItemInfo,
} from "react-native";

interface ChatItemProps {
  id: string;
  name: string;
  lastMessage: string;
  unreadCount: number;
  profilePic: string;
}

const ChatItem: FC<{ item: ChatItemProps }> = ({
  item,
}: {
  item: ChatItemProps;
}): JSX.Element => (
  <TouchableOpacity
    style={styles.chatItem}
    onPress={() => {
      router.replace("/chat");
    }}
  >
    <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
    <View style={styles.chatInfo}>
      <Text style={styles.chatName}>{item.name}</Text>
      <Text style={styles.lastMessage} numberOfLines={1}>
        {item.lastMessage}
      </Text>
    </View>
    {item.unreadCount > 0 && (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadCount}>{item.unreadCount}</Text>
      </View>
    )}
  </TouchableOpacity>
);

export default (): JSX.Element => {
  const chatData: ChatItemProps[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      lastMessage: "Hey, want to grab coffee later?",
      unreadCount: 2,
      profilePic:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
    },
    {
      id: "2",
      name: "Mike Chen",
      lastMessage: "The project deadline is tomorrow!",
      unreadCount: 0,
      profilePic:
        "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&crop=faces",
    },
    {
      id: "3",
      name: "Emma Thompson",
      lastMessage: "Did you see the latest episode?",
      unreadCount: 5,
      profilePic:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
    },
    // Add more chat items as needed
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Peeple</Text>
      </View>
      <FlatList
        data={chatData}
        renderItem={({
          item,
        }: ListRenderItemInfo<ChatItemProps>): JSX.Element => (
          <ChatItem item={item} />
        )}
        keyExtractor={(item: ChatItemProps): string => item.id}
        contentContainerStyle={styles.chatList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center", // Center the title
    alignItems: "center",
    padding: 16,
    backgroundColor: "#8B5CF6",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  appName: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  chatList: {
    padding: 16,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  lastMessage: {
    fontSize: 14,
    color: "#6B7280",
  },
  unreadBadge: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
