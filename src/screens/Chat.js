import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { GiftedChat, Bubble, Send, Composer } from "react-native-gifted-chat";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import sendNotifs from "../utils/sendNotifs";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";

dayjs.extend(calendar);
import "dayjs/locale/fr";
dayjs.locale("fr");

const Chat = ({ route }) => {
  const conversationId = route.params.conversation.id;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;

  // Référence pour auto-focus de l'input
  const inputRef = useRef();

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("messages")
      .where("conversationId", "==", conversationId)
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const loadedMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            _id: doc.id,
            text: data.message,
            createdAt: data.createdAt?.toDate(),
            user: {
              _id: data.senderId,
              name: data.senderUsername,
              avatar: data.senderAvatar || null,
            },
          };
        });
        setMessages(loadedMessages);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [conversationId]);

  const onSend = useCallback(async (newMessages = []) => {
    if (!user) return;
    const message = newMessages[0];
    try {
      const userDoc = await firestore().collection("users").doc(user.uid).get();
      const userData = userDoc.data();

      await firestore()
        .collection("messages")
        .add({
          conversationId,
          message: message.text,
          senderId: user.uid,
          senderUsername: user?.displayName || "Utilisateur",
          senderAvatar: user.photoURL || null,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      const conversationDoc = await firestore()
        .collection("conversations")
        .doc(conversationId)
        .get();
      const conversationData = conversationDoc.data();

      if (conversationData?.participants) {
        const participantsTokens = await Promise.all(
          conversationData.participants.map(async (participantId) => {
            if (participantId !== user.uid) {
              const participantDoc = await firestore()
                .collection("users")
                .doc(participantId)
                .get();
              return participantDoc.data()?.expoPushToken;
            }
            return null;
          })
        );

        const validTokens = participantsTokens.filter(Boolean);

        const notificationMessage = {
          title: `nouveau message de groupe`,
          desc: `${userData.username}: ${message.text.substring(0, 50)}${
            message.text.length > 50 ? "..." : ""
          }`,
          type: "new_message_group",
          conversationId,
        };

        for (const token of validTokens) {
          try {
            await sendNotifs({ expoPushToken: token }, notificationMessage);
          } catch (error) {
            console.error("Erreur lors de l'envoi notif:", error);
          }
        }
      }
    } catch (error) {
      console.error("Erreur d'envoi de message :", error);
    }
  }, [user, conversationId]);

  // Composer avec auto-focus
  const renderComposer = useMemo(
    () => (props) => {
      useEffect(() => {
        const t = setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
        return () => clearTimeout(t);
      }, []);

      return (
        <Composer
          {...props}
          textInputStyle={{
            backgroundColor: "#fff",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            color: "#000",
          }}
          placeholder="Écrire un message..."
          placeholderTextColor="#aaa"
          ref={inputRef}
        />
      );
    },
    []
  );

  const renderBubble = useMemo(
    () => (props) => (
      <Bubble
        {...props}
        wrapperStyle={{
          right: { backgroundColor: "#2563EB" },
          left: { backgroundColor: "#E5E7EB" },
        }}
        textStyle={{
          right: { color: "#FFFFFF" },
          left: { color: "#000000" },
        }}
      />
    ),
    []
  );

  const renderSend = useMemo(
    () => (props) => (
      <Send {...props}>
        <View style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </View>
      </Send>
    ),
    []
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <GiftedChat
    bottomOffset={50}
      messages={messages}
      onSend={(messages) => onSend(messages)}
      user={{ _id: user?.uid }}
      renderBubble={renderBubble}
      renderSend={renderSend}
      renderComposer={renderComposer}
      alwaysShowSend
      showUserAvatar
      placeholder="Écrire un message..."
      locale="fr"
      dateFormat="D MMMM"
      keyboardShouldPersistTaps="handled"
      inverted={false}
      renderDay={(props) => (
        <Text
          style={{
            textAlign: "center",
            color: "#aaa",
            marginVertical: 5,
            fontFamily: "Inter_500Medium",
          }}
        >
          {props.currentMessage.createdAt
            ? dayjs(props.currentMessage.createdAt).calendar(null, {
                sameDay: "[Aujourd'hui]",
                nextDay: "[Demain]",
                lastDay: "[Hier]",
                sameElse: "D MMMM YYYY",
              })
            : ""}
        </Text>
      )}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  sendButton: {
    marginRight: 10,
    marginBottom: 5,
    backgroundColor: "#2563EB",
    borderRadius: 20,
    padding: 10,
  },
});

export default Chat;
