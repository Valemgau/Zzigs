import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import FastImage from "react-native-fast-image";
import i18n from "../../i18n";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";

const MyCard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const height = Dimensions.get("window").height;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = auth().currentUser;
        if (user) {
          const userDoc = await firestore()
            .collection("users")
            .doc(user.uid)
            .get();
          if (userDoc.exists) {
            setCurrentUser({ id: userDoc.id, ...userDoc.data() });
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données utilisateur :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-700 mt-4">
          {i18n.t("chargement_de_votre_profil")}
        </Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-gray-500 text-lg">
          {i18n.t("impossible_de_charger_votre_profil")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 dark:bg-gray-900">
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="relative bg-white dark:bg-gray-800"
      >
        <View style={{ height: height }} className="relative">
          <Animated.View entering={FadeIn.duration(400)}>
            <FastImage
              style={{ width: "100%", height: "80%" }}
              source={{
                uri: currentUser.photoURL,
                priority: FastImage.priority.high,
              }}
              resizeMode={FastImage.resizeMode.cover}
            />
            <BlurView
              className="rounded-xl"
              intensity={60}
              tint="dark"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 16,
                borderRadius: 24,
                margin: 10,
              }}
            >
              <Text
                style={{ fontFamily: "Inter_700Bold" }}
                className="text-3xl text-white"
              >
                {`@${currentUser?.username}`}
              </Text>
              <View>
                <Text
                  style={{ fontFamily: "Inter_500Medium" }}
                  className="text-gray-200 text-lg mt-2"
                >
                  {currentUser?.biography || ""}
                </Text>

                {currentUser.interest?.length > 0 && (
                  <View className="mb-4">
                    <Text
                      style={{ fontFamily: "Inter_700Bold" }}
                      className=" text-xl mb-2 text-white"
                    >
                      {i18n.t("intérêts_communs:")}
                    </Text>
                    <View className="flex-row flex-wrap">
                      {currentUser.interest?.map((interest, index) => (
                        <View
                          key={index}
                          className="bg-blue-600 mr-3 px-4 py-2 rounded-full"
                        >
                          <Text
                            style={{ fontFamily: "Inter_700Bold" }}
                            className="text-white"
                          >
                            {interest}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              <View className="flex-row justify-between">
                <TouchableOpacity className="bg-red-500 rounded-full p-4 w-16 h-16 justify-center items-center">
                  <Ionicons
                    name="close"
                    size={26}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
                <TouchableOpacity className="bg-green-500 rounded-full p-4 w-16 h-16 justify-center items-center">
                <Ionicons
                    name="heart"
                    size={26}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

export default MyCard;
