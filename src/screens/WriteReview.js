import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Rating } from "react-native-elements";
import { useColorScheme } from "nativewind";
import i18n from "../../i18n";

const WriteReview = ({ navigation, route }) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const MAX_LENGTH = 500;
  const user = auth().currentUser;

  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);

  useEffect(() => {
    console.log(isDarkMode);
  }, []);

  const handleSubmit = async () => {
    if (!message || rating === 0) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }

    try {
      await firestore().collection("reviews").add({
        userId: user.uid,
        message,
        rating,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      showMessage({
        message: "Votre avis a été enregistré avec succès.",
        type: "success",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'avis :", error);
      showMessage({
        message: "Impossible d'enregistrer votre avis.",
        type: "danger",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
        className="px-6"
      >
        <Animated.View entering={FadeInDown.duration(400)} className="pt-8">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{i18n.t("ecrire_un_avis")}</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-base">{i18n.t("partagez_votre_expérience")}</Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-gray-700 dark:text-gray-300 mb-2 ">{i18n.t("note")}</Text>
              <Rating
                type="star"
                ratingCount={5}
                imageSize={40}
                onFinishRating={setRating}
                style={{ paddingVertical: 10 }}
                ratingColor="transparent"
                ratingBackgroundColor="black"
              />
            </View>

            <View>
              <Text className="text-gray-700 dark:text-gray-300 mb-2 ">{i18n.t("votre_avis")}</Text>
              <View className="relative">
                <TextInput
                  className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-4 pl-12 min-h-[150px]"
                  placeholder="Partagez votre expérience..."
                  placeholderTextColor="#9CA3AF"
                  value={message}
                  onChangeText={setMessage}
                  maxLength={MAX_LENGTH}
                  multiline
                  textAlignVertical="top"
                  style={{ fontSize: 16 }}
                />
                <View className="absolute left-4 top-4">
                  <Ionicons
                    name="chatbubble-outline"
                    size={24}
                    color="#6B7280"
                  />
                </View>
              </View>
              <View className="flex-row justify-end mt-2">
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  {message.length}/{MAX_LENGTH} caractères
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!message || rating === 0}
              className={`h-[56px] rounded-xl flex-row items-center justify-center mt-4 ${
                !message || rating === 0
                  ? "bg-blue-300 dark:bg-blue-700"
                  : "bg-blue-600 dark:bg-blue-500"
              }`}
            >
              <Text className="text-white font-semibold text-lg mr-2">{i18n.t("publier_lavis")}</Text>
              <Ionicons name="send-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 dark:text-gray-400 text-sm text-center mt-8">{i18n.t("votre_avis_nous_aide_a_ameliorer_lexperience_de_tous_les_utilisateurs")}</Text>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default WriteReview;
