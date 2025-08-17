import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../../i18n";

const MyEvents = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const user = auth().currentUser;

  useFocusEffect(
    useCallback(() => {
      fetchUserActivities();
    }, [])
  );

  const fetchUserActivities = async () => {
    try {
      const activitiesSnapshot = await firestore()
        .collection("activities")
        .where("creatorId", "==", user.uid)
        .get();

      const activitiesData = activitiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setActivities(activitiesData);
    } catch (error) {
      console.error("Erreur lors de la récupération des évènements :", error);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (activityId) => {
    try {
      // Demander confirmation avant de supprimer
      const confirmDelete = await new Promise((resolve) => {
        Alert.alert(
          "Confirmation",
          "Êtes-vous sûr de vouloir supprimer cet evènement ?",
          [
            { text: "Annuler", onPress: () => resolve(false), style: "cancel" },
            { text: "Supprimer", onPress: () => resolve(true) },
          ]
        );
      });

      if (!confirmDelete) return;

      await firestore().collection("activities").doc(activityId).delete();

      // Mettre à jour l'état local
      setActivities((prevActivities) =>
        prevActivities.filter((activity) => activity.id !== activityId)
      );

      showMessage({
        message: `Evènement avec l'ID ${activityId} supprimé avec succès.`,
        type: "success",
      });
    } catch (error) {
      showMessage({
        message: `Une erreur s'est produite: ${error.message}`,
        type: "error",
      });
    }
  };

  const ActivityItem = React.memo(({ item, onDelete }) => {
    const parseDate = (dateString) => {
      const [day, month, year] = dateString.split("/");
      return new Date(year, month - 1, day);
    };

    const isActive = parseDate(item.date) > new Date();

    const creationDate = new Date(item.createdAt).toLocaleDateString();

    return (
      <Animated.View
        entering={FadeInDown.duration(400)}
        exiting={FadeOut}
        className="mb-4"
      >
        <Pressable
          className="bg-white dark:bg-gray-900"
          onPress={() =>
            navigation.navigate("ActivityDetails", {
              activityId: item.id,
              image: item.images[0],
            })
          }
        >
          {/* Header avec infos */}
          <View className="flex-row items-center justify-between px-4 py-3">
            {item.location && (<View className="flex-row items-center">
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                {item?.location.split(",")[1].trim()}
              </Text>
              <View className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full mx-2" />
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                {item.date}
              </Text>
            </View>)}
            <View
              className={`px-2 py-1 rounded-full ${
                isActive ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <Text className="text-white text-xs">
                {isActive ? "Toujours d'actualité" : "Événement terminé"}
              </Text>
            </View>
          </View>

          {/* Image principale avec overlay gradient */}
          <View className="relative">
            <Image
              source={{ uri: item.images[0] }}
              className="w-full h-20"
              resizeMode="cover"
            />
            <View className="absolute bottom-0 left-0 right-0 h-24 justify-end p-4">
              <Text className="text-white text-xl font-bold" numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          </View>

          {/* Footer avec infos complémentaires */}
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons name="people" size={18} color="#2563EB" />
                <Text className="text-blue-600 dark:text-blue-400  ml-2">
                  {item?.participants?.length || 0}/{item.maxParticipants}
                </Text>
              </View>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                Créé le : {creationDate}
              </Text>
            </View>

            {item.description && (
              <Text
                className="text-gray-600 dark:text-gray-300 mb-4"
                numberOfLines={2}
              >
                {item.description}
              </Text>
            )}

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("EditEvent", { eventId: item.id })
                }
                className="bg-blue-500 dark:bg-blue-600 px-4 py-2 rounded-full flex-row items-center"
              >
                <Text className="text-white  mr-1">{i18n.t("modifier")}</Text>
                <Ionicons name="create-outline" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(item.id)}
                className="bg-red-500 dark:bg-red-600 px-4 py-2 rounded-full flex-row items-center"
              >
                <Text className="text-white  mr-1">{i18n.t("supprimer")}</Text>
                <Ionicons name="trash-outline" size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  });

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
      renderItem={({ item }) => (
        <ActivityItem onDelete={onDelete} item={item} />
      )}
      keyExtractor={(item) => item.id}
      contentContainerClassName="p-4"
      ListEmptyComponent={
        <Text className="text-center text-gray-500">{i18n.t("vous_navez_pas_encore_cree_devenements")}</Text>
      }
    />
  );
};

export default MyEvents;
