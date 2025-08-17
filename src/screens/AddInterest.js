import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Pressable,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, SlideInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";

const AddInterest = ({ route, navigation }) => {
  const newProfile = route?.params?.newProfile || false;
  const user = auth().currentUser;
  const [allInterests, setAllInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupérer les intérêts depuis Firestore
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const interestsSnapshot = await firestore()
          .collection("interests")
          .get();
        const interests = interestsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllInterests(interests);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des intérêts :", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserInterests = async () => {
      try {
        const userDoc = await firestore()
          .collection("users")
          .doc(user.uid)
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setSelectedInterests(userData.interests || []);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des intérêts utilisateur :",
          error
        );
      }
    };

    fetchInterests();
    fetchUserInterests();
  }, []);

  // Gestion de la sélection et désélection des intérêts
  const toggleInterest = async (interest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    const isSelected = selectedInterests.some((item) => item === interest);

    let updatedInterests;
    if (isSelected) {
      updatedInterests = selectedInterests.filter((item) => item !== interest);
    } else {
      updatedInterests = [...selectedInterests, interest];
    }

    setSelectedInterests(updatedInterests);

    try {
      await firestore().collection("users").doc(user.uid).update({
        interests: updatedInterests,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour des intérêts :", error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className="text-gray-700 mt-4"
        >{i18n.t("chargement")}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <Animated.View entering={FadeInDown.duration(100)} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-6 pt-8">
            {/* En-tête */}
            <View className="mb-8">
              <Text
                style={{ fontFamily: "Inter_700Bold" }}
                className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
              >{i18n.t("centres_dinteret")}</Text>
              <Text
                style={{ fontFamily: "Inter_400Regular" }}
                className="text-gray-500 dark:text-gray-400 text-lg"
              >{i18n.t("selectionnez_les_activites_qui_vous_passionnent")}</Text>
            </View>

            {/* Toutes les catégories */}
            <View className="mb-20">
              <View className="flex-row flex-wrap">
                {allInterests.map((interest, index) => (
                  <Animated.View
                    key={interest.id}
                    entering={FadeInDown.delay(index * 50)}
                    className="m-1 w-[45%]"
                  >
                    <TouchableOpacity
                      className={`p-4 rounded-xl ${
                        selectedInterests.includes(interest.name)
                          ? "bg-blue-500 dark:bg-blue-600 border-2 border-blue-600 dark:border-blue-700"
                          : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      }`}
                      onPress={() => toggleInterest(interest.name)}
                      activeOpacity={0.7}
                    >
                      {/* <Text className="text-2xl mb-2">{interest.emoji}</Text> */}
                      <Text
                        style={{ fontFamily: "Inter_400Regular" }}
                        className={` ${
                          selectedInterests.includes(interest.name)
                            ? "text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {interest.name}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bouton fixe en bas */}
        <Animated.View
          entering={SlideInDown.duration(400)}
          className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
        >
          {newProfile && (
            <Pressable
              style={{
                backgroundColor: COLORS.primary,
                opacity: selectedInterests.length === 0 ? 0.5 : 1,
              }}
              className={`py-3 rounded-xl flex-row items-center justify-center`}
              onPress={() =>
                newProfile
                  ? navigation.navigate("AddLocation", { newProfile: true })
                  : handleSave()
              }
              disabled={selectedInterests.length === 0}
            >
              <Text
                style={{ fontFamily: "Inter_400Regular" }}
                className="text-white font-semibold text-lg"
              >
                {newProfile ? "Continuer" : "Enregistrer"}
              </Text>
            </Pressable>
          )}
          <Text
            style={{ fontFamily: "Inter_400Regular" }}
            className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4"
          >
            {selectedInterests.length} intérêt
            {selectedInterests.length !== 1 ? "s" : ""} sélectionné
            {selectedInterests.length !== 1 ? "s" : ""}
          </Text>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default AddInterest;
