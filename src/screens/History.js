import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import i18n from "../../i18n";

const History = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJoinedActivities = async () => {
      try {
        const userId = auth().currentUser.uid;
        const activitiesSnapshot = await firestore()
          .collection("activities")
          .get();
        const conversationsSnapshot = await firestore()
          .collection("conversations")
          .get();
        const messagesSnapshot = await firestore().collection("messages").get();

        const joinedActivities = [];

        activitiesSnapshot.forEach((doc) => {
          const activity = doc.data();
          activity.id = doc.id;

          if (Array.isArray(activity.participants)) {
            const participant = activity.participants.find(
              (p) =>
                p &&
                typeof p === "object" &&
                p.userId === userId &&
                p.active === true
            );

            if (participant) {
              const conversation = conversationsSnapshot.docs.find(
                (convDoc) => convDoc.data().activityId === activity.id
              );
              const conversationId = conversation ? conversation.id : null;

              const messages = conversationId
                ? messagesSnapshot.docs.filter(
                    (msgDoc) => msgDoc.data().conversationId === conversationId
                  )
                : [];

              const totalMessages = messages.length;
              const userMessagesCount = messages.filter(
                (msg) => msg.data().senderId === userId
              ).length;

              const presenceScore = participant.here ? 1 : 0;
              const implication =
                ((userMessagesCount / (totalMessages || 1)) * 0.5 +
                  presenceScore * 0.5) *
                100;

              joinedActivities.push({
                id: activity.id,
                joinedAt: participant.joinedAt || new Date().toISOString(),
                title: activity.title || "",
                photo: activity.images[0] || "",
                date: activity.date || "erreur",
                time: activity.time || "erreur",
                description: activity.description || "erreur",
                location: activity.endPointName + activity.location || "erreur",
                status:
                  new Date(activity.date.split("/").reverse().join("-")) <
                  new Date()
                    ? "Terminée"
                    : "À venir",
                implication: Math.round(implication),
                presence: participant.here,
              });
            }
          }
        });

        joinedActivities.sort((a, b) => {
          const dateA = new Date(a.date.split("/").reverse().join("-"));
          const dateB = new Date(b.date.split("/").reverse().join("-"));
          return dateB - dateA;
        });

        setActivities(joinedActivities);
      } catch (error) {
        console.error("Erreur lors de la récupération des activités :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedActivities();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-700 dark:text-gray-300 mt-4">{i18n.t("chargement_des_activites")}</Text>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <Text className="text-gray-500 dark:text-gray-400 text-lg">{i18n.t("vous_navez_rejoint_aucune_activite_pour_le_moment")}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-700 dark:text-gray-300 mt-4">{i18n.t("chargement_des_activites")}</Text>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <Text className="text-gray-500 dark:text-gray-400 text-lg">{i18n.t("vous_navez_rejoint_aucune_activité_pour_le_moment")}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <Animated.View entering={FadeInDown.duration(400)} className="flex-1">
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <View className="p-2">
              <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{i18n.t("mes_évènements")}</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-base mb-4">{i18n.t(
                "implication_calcul"
              )}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const addressMatch = item.location.match(
              /^(.*?),\s*(.*?),\s*(.*?),\s*(\d+)$/
            );
            const { street, city, country, postal_code } = addressMatch
              ? {
                  street: addressMatch[1],
                  city: addressMatch[2],
                  country: addressMatch[3],
                  postal_code: addressMatch[4],
                }
              : {
                  street: item.location,
                  city: "",
                  country: "",
                  postal_code: "",
                };

            return (
              <View className="bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 p-4">
                <View className="flex-row items-center mb-4">
                  <Image
                    source={{ uri: item.photo }}
                    className="w-16 h-16 rounded-full mr-4"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text
                      style={{ fontFamily: "Inter_700Bold" }}
                      className="text-xl text-gray-900 dark:text-white mb-1"
                    >
                      {item.title}
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="#6B7280"
                      />
                      <Text
                        style={{ fontFamily: "Inter_500Medium" }}
                        className="text-sm  text-gray-600 dark:text-gray-400 ml-1"
                      >
                        {city}, {country}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="time-outline" size={18} color="#6B7280" />
                  <Text className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {item.date} à {item.time}
                  </Text>
                </View>
                <View className="bg-blue-100 dark:bg-blue-800 rounded-lg p-3 mb-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text
                      style={{ fontFamily: "Inter_500Medium" }}
                      className="text-lg text-blue-700 dark:text-blue-200"
                    >{i18n.t("présence")}</Text>
                    <Text
                      className={`text-lg ${
                        item.presence
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {item.presence ? "Oui" : "Non"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text
                      style={{ fontFamily: "Inter_500Medium" }}
                      className="text-lg text-blue-700 dark:text-blue-200"
                    >{i18n.t("implication")}</Text>
                    <Text
                      style={{ fontFamily: "Inter_500Medium" }}
                      className="text-xl text-blue-700 dark:text-blue-200"
                    >
                      {item.implication}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

export default History;
