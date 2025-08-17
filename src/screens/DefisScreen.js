import React, { useState, useEffect } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { useFocusEffect } from "@react-navigation/native";

const DefisScreen = () => {
  const [defisStatus, setDefisStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;

  // Configuration modifiable des défis
  const DEFIS_CONFIG = [
    {
      type: "profil_completion",
      title: "Profil remplit",
      description: "Complètez votre profil à 100%",
    },
    {
      type: "parrainage",
      title: "Parrainer un ami",
      description: "Partagez votre code de parrainage à un ami",
    },
    {
      type: "join_event",
      title: "Rejoindre un évènement",
      description: "Participez à votre premier événement communautaire",
    },
  ];

  const fetchDefisStatus = async () => {
    try {
      const snapshot = await firestore()
        .collection("defis")
        .where("userId", "==", user.uid)
        .get();

      const status = snapshot.docs.reduce((acc, doc) => {
        acc[doc.data().type] = true;
        return acc;
      }, {});

      setDefisStatus(status);
    } catch (error) {
      console.error("Erreur récupération défis:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchDefisStatus();
    }, [])
  );

  const ChallengeItem = ({ type, title, description }) => (
    <View className="bg-white dark:bg-gray-900 p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text
            style={{ fontFamily: "Inter_700Bold" }}
            className="text-lg text-gray-800 dark:text-gray-100"
          >
            {title}
          </Text>
          <Text
            style={{ fontFamily: "Inter_500Medium" }}
            className="text-gray-500 dark:text-gray-300 mt-1"
          >
            {description}
          </Text>
        </View>

        <Ionicons
          name={defisStatus[type] ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={defisStatus[type] ? "#10B981" : "#6B7280"}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  }

  return (
    <FlatList
      data={DEFIS_CONFIG}
      renderItem={({ item }) => (
        <ChallengeItem
          type={item.type}
          title={item.title}
          description={item.description}
        />
      )}
      keyExtractor={(item) => item.type}
      contentContainerClassName="bg-white dark:bg-gray-900"
      ListHeaderComponent={() => (
        <Text
          style={{ fontFamily: "Inter_700Bold" }}
          className="p-4 text-4xl dark:text-white"
        >{i18n.t("défis")}</Text>
      )}
    />
  );
};

export default DefisScreen;
