import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Pressable,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";

const EditProfile = ({ route, navigation }) => {
  const newProfile = route.params.newProfile || false;
  const MAX_LENGTH = 500;
  const user = auth().currentUser;

  // États pour les champs
  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [biography, setBiography] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: !newProfile,
    });
  }, [navigation, newProfile]);

  // Récupérer les données existantes de l'utilisateur
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await firestore()
          .collection("users")
          .doc(user.uid)
          .get();
        if (userDoc.exists) {
          const data = userDoc.data();
          setUserName(data.username || "");
          // setFirstName(data.firstName || "");
          // setLastName(data.lastName || "");
          setBiography(data.biography || "");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    };

    fetchUserData();
  }, []);

  // Fonction pour sauvegarder les données
  const handleSave = async () => {
    if (!biography) {
      Alert.alert("Erreur", "Tous les champs sont obligatoires.");
      return;
    }

    try {
      // Mettre à jour Firestore
      await firestore().collection("users").doc(user.uid).set(
        {
          // firstName,
          username: userName,
          // lastName,
          biography,
        },
        { merge: true }
      );

      // Mettre à jour le displayName dans Firebase Auth
      // await auth().currentUser.updateProfile({
      //   displayName: `${firstName} ${lastName}`,
      // });

      if (newProfile) {
        navigation.navigate("AddInterest", { newProfile: true });
        return;
      }
      showMessage({
        message:
          "Vos informations personnelles ont été correctement mises à jour.",
        type: "success",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      showMessage({
        message: "Impossible de sauvegarder les modifications.",
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
        <Animated.View entering={FadeInDown.duration(100)} className="pt-8">
          {/* En-tête */}
          <View className="mb-8">
            <Text
              style={{ fontFamily: "Inter_700Bold" }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >{i18n.t("vos_informations")}</Text>
           
          </View>

          {/* Formulaire */}

          <View className="flex flex-col gap-4">
            {/* Nom */}
            {/* <View>
              <Text
                style={{ fontFamily: "Inter_400Regular" }}
                className="text-gray-700 dark:text-gray-300 mb-2"
              >{i18n.t("nom")}</Text>
              <View className="relative">
                <TextInput
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="h-[56px] border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg rounded-xl px-4"
                  placeholder="Votre nom"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View> */}
            {/* Prénom */}
            {/* <View>
              <Text
                style={{ fontFamily: "Inter_400Regular" }}
                className="text-gray-700 dark:text-gray-300 mb-2 "
              >{i18n.t("prénom")}</Text>
              <View className="relative">
                <TextInput
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="h-[56px] border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg rounded-xl px-4 "
                  placeholder="Votre prénom"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View> */}
            {/* Nom d'utilisateur */}
            <View>
              <Text
                style={{ fontFamily: "Inter_400Regular" }}
                className="text-gray-700 dark:text-gray-300 mb-2 "
              >{i18n.t("nom_dutilisateur")}</Text>
              <View className="relative">
                <TextInput
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="h-[40px] pb-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg rounded-xl px-4"
                  placeholder="Votre nom d'utilisateur"
                  placeholderTextColor="#9CA3AF"
                  value={userName}
                  onChangeText={setUserName}
                />
              </View>
            </View>

            {/* Biographie */}
            <View>
              <Text className="text-gray-700 dark:text-gray-300 mb-2 ">{i18n.t("parlez_nous_un_peu_de_vous")}</Text>
              <View className="relative">
                <TextInput
                  className="border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-4  min-h-[150px]"
                  placeholder={i18n.t("parlez_nous_un_peu_de_vous")}
                  placeholderTextColor="#9CA3AF"
                  value={biography}
                  onChangeText={setBiography}
                  maxLength={MAX_LENGTH}
                  multiline
                  textAlignVertical="top"
                  style={{ fontSize: 16, fontFamily: "Inter_400Regular" }}
                />
              </View>
              <View className="flex-row justify-end mt-2">
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-gray-500 dark:text-gray-400 text-sm"
                >
                  {biography.length}/{MAX_LENGTH} caractères
                </Text>
              </View>
            </View>

            {/* Bouton de sauvegarde */}
            <Pressable
              style={{
                backgroundColor: COLORS.primary,
                opacity: !biography ? 0.5 : 1,
              }}
              onPress={handleSave}
              disabled={!biography}
              className={`py-3 rounded-xl flex-row items-center justify-center mt-4`}
            >
              <Text
                style={{ fontFamily: "Inter_400Regular" }}
                className="text-white font-semibold text-lg"
              >
                {!newProfile ? "Enregistrer" : "Continuer"}
              </Text>
            </Pressable>
          </View>

          {/* Message d'aide */}
          <Text
            style={{ fontFamily: "Inter_400Regular" }}
            className="text-gray-500 dark:text-gray-400 text-sm text-center mt-8"
          >
            {i18n.t(
              "ces_informations_nous_aident_a_personnaliser_votre_experience"
            )}
          </Text>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;
