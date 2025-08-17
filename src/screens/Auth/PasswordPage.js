import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import moment from "moment";
import { useNavigation } from "@react-navigation/native";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { createUniqueUsername } from "../../utils/allFunctions";
import { COLORS } from "../../styles/colors";
import i18n from "../../../i18n";
import { sendWelcomeEmail } from "../../utils/sendMails";

const PasswordPage = ({ route }) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async () => {
    if (email.trim() === "") {
      showMessage({
        message: "Veuillez entrer une adresse e-mail valide.",
        type: "danger",
      });
      return;
    }
    if (password.trim().length < 6) {
      showMessage({
        message: "Le mot de passe doit contenir au moins 6 caractères.",
        type: "danger",
      });
      return;
    }

    setLoading(true);

    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // Propose de créer un compte si aucun utilisateur n'est trouvé
        Alert.alert(
          "Compte non trouvé",
          "Aucun compte n'existe avec cet email. Voulez-vous créer un nouveau compte ?",
          [
            {
              text: "Créer un compte",
              onPress: async () => {
                try {
                  // Création du compte utilisateur
                  const userCredential =
                    await auth().createUserWithEmailAndPassword(
                      email,
                      password
                    );
                  const email = userCredential.user.email;
                  const userName = createUniqueUsername(email);
                  // Création d'un document Firestore pour l'utilisateur
                  await firestore()
                    .collection("users")
                    .doc(userCredential.user.uid)
                    .set({
                      interests: [],
                      showMyProfile: true,
                      email: email,
                      username: userName,
                      createdAt: moment().format(), // Ajout de l'horodatage
                    });
                  await sendWelcomeEmail(email, userName).catch(console.error);
                } catch (createError) {
                  showMessage({
                    message:
                      "Impossible de créer le compte. Veuillez réessayer plus tard",
                    type: "danger",
                  });
                } finally {
                  setLoading(false);
                }
              },
            },
            {
              text: "Annuler",
              style: "cancel",
              onPress: () => {
                navigation.goBack(); // Retourne à la page précédente
              },
            },
          ]
        );
      } else if (error.code === "auth/wrong-password") {
        showMessage({
          message: "Le mot de passe est incorrect. Veuillez réessayer.",
          type: "danger",
        });
      } else if (error.code === "auth/invalid-email") {
        showMessage({
          message: "L'adresse email est invalide. Veuillez la vérifier.",
          type: "danger",
        });
      } else {
        showMessage({
          message: "Une erreur est survenue. Veuillez réessayer plus tard.",
          type: "danger",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
        className="bg-white dark:bg-gray-900"
      >
        <Animated.View
          entering={FadeInDown.duration(100)}
          className="flex-1 px-6 pt-8"
        >
          {/* En-tête */}
          <View className="mb-8">
            <Text
              style={{ fontFamily: "Inter_700Bold" }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {i18n.t("connectez_vous_a_votre_compte")}
            </Text>
          </View>

          {/* Champ email */}
          <View className="mb-6">
            <View className="relative">
              <TextInput
                style={{
                  fontFamily: "Inter_400Regular",
                  height: 56,
                }}
                placeholder="Votre adresse email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg rounded-xl  pl-12 pb-2 pr-12 border border-gray-300 dark:border-gray-700"
              />
              <View className="absolute left-4 top-5">
                <Ionicons name="mail-outline" size={24} color="#6B7280" />
              </View>
            </View>
          </View>

          {/* Champ mot de passe */}
          <View className="mb-6">
            <View className="relative">
              <TextInput
                style={{
                  fontFamily: "Inter_400Regular",
                  height: 56,
                }}
                placeholder="Votre mot de passe"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg rounded-xl px-4 pl-12 pr-12 border border-gray-300 dark:border-gray-700"
              />
              <View className="absolute left-4 top-4">
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color="#6B7280"
                />
              </View>
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="#6B7280"
                />
              </Pressable>
            </View>

            <Pressable
              onPress={() => navigation.navigate("ForgotPassword")}
              className="mt-2"
            >
              <Text className="text-orange-600 dark:text-orange-400 text-right text-sm">
                {i18n.t("mot_de_passe_oublie")}
              </Text>
            </Pressable>
          </View>

          {/* Bouton de connexion */}
          <Pressable
            style={{
              backgroundColor: COLORS.primary,
              opacity: loading || !password ? 0.5 : 1,
            }} // Changez la couleur de fond ici
            onPress={handlePasswordSubmit}
            disabled={loading || !password}
            className={`py-3 rounded-xl flex-row items-center justify-center`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-semibold text-lg mr-2">
                  {i18n.t("se_connecter")}
                </Text>
              </>
            )}
          </Pressable>

          {/* Message d'aide */}
          <Text className="text-center text-gray-500 dark:text-gray-400 mt-8 mb-6">
            En continuant, vous acceptez nos{" "}
            <Pressable
              onPress={() =>
                Linking.openURL("https://connectetmove.com/termes.html")
              }
            >
              <Text className="text-orange-600 dark:text-orange-400">
                {i18n.t("conditions_dutilisation")}
              </Text>
            </Pressable>
          </Text>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default PasswordPage;
