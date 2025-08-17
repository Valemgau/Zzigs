import React, { useEffect, useLayoutEffect, useState } from "react";
import { View, ActivityIndicator, Text, TextInput, Image } from "react-native";
import { GiftedChat, Send } from "react-native-gifted-chat";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import sendNotifs from "../utils/sendNotifs";
import { InputToolbar } from "react-native-gifted-chat";
import { Ionicons } from "@expo/vector-icons";

import dayjs from "dayjs";
import "dayjs/locale/fr";
dayjs.locale("fr");

const ChatWithFriend = ({ navigation, route }) => {
  const { salonId, friend } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;
  console.log("ChatWithFriend user:", user);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Image
          source={{ uri: friend.photoURL }}
          className="w-10 h-10 rounded-full"
          resizeMode="cover"
        />
      ),
      headerTitle: friend.username || "partenaire",
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("friendsMessages")
      .where("salonId", "==", salonId)
      .orderBy("createdAt", "desc") // Gifted Chat utilise l'ordre décroissant
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.empty) {
            const messagesData = snapshot.docs.map((doc) => ({
              _id: doc.id,
              text: doc.data().message,
              createdAt: doc.data().createdAt?.toDate(),
              user: {
                _id: doc.data().senderId,
                name: doc.data().senderName || "Utilisateur",
              },
            }));
            setMessages(messagesData);
          } else {
            console.log("Aucun message trouvé.");
            setMessages([]);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Erreur lors de la récupération des messages :", error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [salonId]);

  const handleSend = async (newMessages = []) => {
    if (!user) return;

    const messageaenvoyer = newMessages[0]; // Gifted Chat envoie un tableau de nouveaux messages
    try {
      await firestore()
        .collection("friendsMessages")
        .add({
          senderId: user.uid,
          senderName: user?.displayName || "Moi",
          salonId: salonId,
          message: messageaenvoyer.text,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, newMessages)
      );
      const message = {
        title: `message de ${user?.displayName || "aa"}`,
        desc: `${messageaenvoyer.text}`,
        type: `friendMessage`,
      };
      sendNotifs(friend, message);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  function renderCustomInputToolbar(props) {
    return (
      <View className="flex-row items-center bg-white rounded-full mx-2 my-2 px-3">
        <TextInput
          className="flex-1 p-2 text-base text-gray-800"
          placeholder="Écrire un message..."
          placeholderTextColor="#aaa"
          value={props.text}
          onChangeText={props.onTextChanged}
        />
        {renderSend(props)}
      </View>
    );
  }
  // Fonction pour personnaliser le bouton d'envoi
  function renderSend(props) {
    return (
      <Send {...props}>
        <View className="justify-center items-center p-2">
          <Ionicons name="send" size={24} color="#2563EB" />
        </View>
      </Send>
    );
  }

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => handleSend(messages)}
      user={{
        _id: user?.uid || "unknown",
        name: user?.displayName || "Moi",
        avatar: friend.photoURL,
      }}
      placeholder="Écrire un message..."
      locale="fr"
      dateFormat="D MMMM" // Format des dates (exemple : '8 mars')
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
                sameDay: "[Aujourd'hui]", // Traduction du badge Today
                nextDay: "[Demain]",
                lastDay: "[Hier]",
                sameElse: "D MMMM YYYY",
              })
            : ""}
        </Text>
      )}
      bottomOffset={-80}
      renderInputToolbar={renderCustomInputToolbar}
      renderSend={renderSend}
      renderAvatar={() => null}
    />
  );
};

export default ChatWithFriend;
