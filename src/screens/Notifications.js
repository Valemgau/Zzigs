import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Alert,
  SafeAreaView,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { Swipeable } from "react-native-gesture-handler";
import { showMessage } from "react-native-flash-message";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";

const Notifications = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      const notificationsSnapshot = await firestore()
        .collection("notifications")
        .where("userId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .get();

      const notificationsData = notificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotifications(notificationsData);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des notifications :",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (item) => {
    if (item.isNew) {
      await firestore().collection("notifications").doc(item.id).update({
        isNew: false,
      });
      fetchNotifications();
    }
    if (!item.type) {
      return;
    }
    if (item.type == "new_message_group") {
      navigation.navigate("Conversations");
    }
    if (item.type == "join_demands") {
      navigation.navigate("MyEvents");
    }

    if (item.type == "match" || item.type == "friendMessage") {
      navigation.navigate("Friends");
    }
  };

  const handleDelete = async (notifID) => {
    // Afficher une alerte de confirmation
    Alert.alert(
      "confirmation",
      "supprimer la notification ?",
      [
        {
          text: "Annuler",
          onPress: () => console.log("Suppression annulée"),
          style: "cancel",
        },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              await firestore()
                .collection("notifications")
                .doc(notifID)
                .delete();
              fetchNotifications();
              showMessage({
                message: "notification supprimée",
                type: "info",
              });
            } catch (error) {
              console.error("Erreur lors de la suppression :", error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const NotificationItem = React.memo(({ item }) => {
    const creationDate = new Date(item.createdAt).toLocaleDateString();

    return (
      <Pressable
        onPress={() => handleUpdate(item)}
        className="border-b border-gray-100 dark:border-gray-800 px-4"
      >
        <Animated.View
          entering={FadeIn.duration(100)}
          exiting={FadeOut}
          className="mb-4 bg-white dark:bg-gray-900 p-2"
        >
          <View className="flex-row items-start justify-between">
            <Text
              style={{ fontFamily: "Inter_400Regular" }}
              className="capitalize flex-1 text-lg text-gray-800 dark:text-gray-100"
            >
              {item.title}
            </Text>
            {item.isNew ? (
              <View className="bg-red-500 rounded-full px-2 py-1 flex-row items-center justify-center">
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-sm text-white"
                >{i18n.t("nouveau")}</Text>
              </View>
            ) : (
              <View className="bg-blue-500 rounded-full px-2 py-1 flex-row  items-center justify-center">
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-sm text-white flex-shrink"
                >
                  {item.type == "new_message_group"
                    ? "Message"
                    : item.type == "join_demands"
                    ? "Demande"
                    : item.type == "match"
                    ? "Match"
                    : item.type == "friendMessage"
                    ? "Message"
                    : ""}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{ fontFamily: "Inter_400Regular" }}
            className="text-gray-600 dark:text-gray-300 mt-2"
          >
            {item.text}
          </Text>

          <Text
            style={{ fontFamily: "Inter_400Regular" }}
            className="text-gray-400 dark:text-gray-400 text-sm mt-2"
          >
            {creationDate}
          </Text>
        </Animated.View>
      </Pressable>
    );
  });

  if (loading) {
    return (
      <View className="bg-white dark:bg-gray-800 flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="bg-white dark:bg-gray-800 flex-1">
      <FlatList
           data={notifications}
           renderItem={({ item }) => (
             <Swipeable
               renderRightActions={() => (
                 <Pressable
                   className=""
                   onPress={() => handleDelete(item.id)}
                   style={{
                     backgroundColor: "red",
                     justifyContent: "center",
                     alignItems: "center",
                     flex: 1,
                     width: 80,
                     height: "88%",
                   }}
                 >
                   <Text style={{ color: "white", fontWeight: "bold" }}>{i18n.t("supprimer")}</Text>
                 </Pressable>
               )}
             >
               <NotificationItem item={item} />{" "}
             </Swipeable>
           )}
           keyExtractor={(item) => item.id}
           contentContainerClassName="bg-white dark:bg-gray-900"
           ListHeaderComponent={() => (
             <Text
               style={{ fontFamily: "Inter_500Medium" }}
               className="px-6 py-4 text-2xl dark:text-white"
             >{i18n.t("notifications")}</Text>
           )}
           ListEmptyComponent={
            
               <Text
                 style={{ fontFamily: "Inter_500Medium" }}
                 className="text-center text-gray-500"
               >{i18n.t("vous_navez_pas_encore_de_notifications")}</Text>
             
           }
         />
    </SafeAreaView>
  );
};

export default Notifications;
