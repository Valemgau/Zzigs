import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import moment from "moment";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SharedTransition,
  SlideInDown,
  SlideInUp,
} from "react-native-reanimated";
import i18n from "../../i18n";

const Conversations = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const currentUser = auth().currentUser;

      if (currentUser) {
        const activitiesSnapshot = await firestore()
          .collection("activities")
          .get();

        const filteredActivities = activitiesSnapshot.docs.filter((doc) => {
          const participants = doc.data().participants || [];
          return participants.some(
            (participant) =>
              participant.userId === currentUser.uid &&
              participant.active === true
          );
        });

        const activityIds = filteredActivities.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (activityIds.length > 0) {
          const conversationsSnapshot = await firestore()
            .collection("conversations")
            .where(
              "activityId",
              "in",
              activityIds.map((activity) => activity.id)
            )
            .get();

          const conversationsData = await Promise.all(
            conversationsSnapshot.docs.map(async (doc) => {
              const conversation = doc.data();
              const relatedActivity = activityIds.find(
                (activity) => activity.id === conversation.activityId
              );

              // Fetch the last message for this conversation
              const lastMessageSnapshot = await firestore()
                .collection("messages")
                .where("conversationId", "==", doc.id)
                .orderBy("createdAt", "desc")
                .limit(1)
                .get();

              let lastMessage = null;
              if (!lastMessageSnapshot.empty) {
                const lastMessageDoc = lastMessageSnapshot.docs[0];
                lastMessage = {
                  id: lastMessageDoc.id,
                  ...lastMessageDoc.data(),
                };
              }

              return {
                id: doc.id,
                ...conversation,
                activity: relatedActivity,
                lastMessage: lastMessage,
              };
            })
          );

          setConversations(conversationsData);
        } else {
          setConversations([]);
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des conversations :",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const renderConversation = ({ item }) => (
    <Pressable
      className="py-4 bg-white dark:bg-gray-800 rounded overflow-hidden"
      style={{ elevation: 2 }}
      onPress={() => navigation.navigate("Chat", { conversation: item })}
    >
      <View className="flex-row items-center">
        {/* Avatar et infos principales */}
        <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut}>
          <Image
            source={{ uri: item?.activity?.images[0] }}
            className="w-16 h-16 rounded-full"
            resizeMode="cover"
          />
        </Animated.View>
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text
              className="text-xl text-gray-800 dark:text-white"
              style={{ fontFamily: "Inter_700Bold" }}
              numberOfLines={1}
            >
              {item?.activity?.title}
            </Text>
          </View>

          {/* Dernier message */}
          <Text
            className="text-base text-gray-500 dark:text-gray-400 mt-1"
            style={{ fontFamily: "Inter_400Regular" }}
            numberOfLines={1}
          >
            {item?.lastMessage?.message || "Commencez la discussion !"}
          </Text>

          {/* Tags et infos complémentaires */}
          <View className="flex-row items-center mt-2 space-x-2">
            <View className="bg-blue-50 dark:bg-blue-900 px-2 py-1 rounded-full flex-row items-center">
              <Ionicons name="location-outline" size={12} color="#3B82F6" />
              <Text
                className="text-blue-500 dark:text-blue-300 text-sm ml-1"
                style={{ fontFamily: "Inter_500Medium" }}
              >
                {item?.activity?.location.split(",")[1].trim()}
              </Text>
            </View>
            <View className="bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-full flex-row items-center">
              <Ionicons name="calendar-outline" size={12} color="#6B7280" />
              <Text
                className="text-gray-600 dark:text-gray-300 text-sm ml-1"
                style={{ fontFamily: "Inter_500Medium" }}
              >
                {item?.activity?.date}
              </Text>
            </View>
            <View className="bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-full flex-row items-center">
              <Ionicons name="people-outline" size={12} color="#6B7280" />
              <Text
                className="text-gray-600 dark:text-gray-300 text-sm ml-1"
                style={{ fontFamily: "Inter_500Medium" }}
              >
                {item?.activity?.participants?.length || 0}/
                {item?.activity?.maxParticipants}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Indicateur de nouveaux messages */}
      {item?.unreadCount > 0 && (
        <View className="absolute top-3 right-3 bg-blue-500 w-6 h-6 rounded-full items-center justify-center">
          <Text className="text-white text-xs font-bold">
            {item.unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <FlatList
        contentContainerClassName="p-6"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View className="flex-row items-center justify-between mb-6">
            <Text
              style={{ fontFamily: "Inter_700Bold" }}
              className="text-3xl text-gray-900 dark:text-white"
            >
              {i18n.t("messages")}
            </Text>
          </View>
        )}
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
            </View>
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-gray-600 dark:text-gray-300 text-lg text-center mb-2"
            >
              {i18n.t("aucune_conversation")}
            </Text>
            <Text className="text-gray-400 dark:text-gray-500 text-sm text-center px-6 mb-8">
              {i18n.t(
                "participez_a_des_activites_pour_commencer_a_discuter_avec_dautres_sportifs"
              )}
            </Text>
            <TouchableOpacity
              className="bg-blue-500 px-6 py-3 rounded-full flex-row items-center"
              onPress={() => navigation.navigate("Home")}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color="white"
                className="mr-2"
              />
              <Text className="text-white  ml-2">
                {i18n.t("decouvrir_des_activites")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View className="h-[1px] bg-gray-100 dark:bg-gray-800" />
        )}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={fetchConversations}
            tintColor="#2563EB"
          />
        }
      />
    </View>
  );
};

export default Conversations;
