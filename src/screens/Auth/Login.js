import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Pressable,
  Linking,
  SafeAreaView,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID } from "@env";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import moment from "moment";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as AppleAuthentication from "expo-apple-authentication";
import { createUniqueUsername } from "../../utils/allFunctions";
import { LoginManager, AccessToken } from "react-native-fbsdk-next";
import { COLORS } from "../../styles/colors";
import i18n from "../../../i18n";
import * as Crypto from "expo-crypto";
import functions from "@react-native-firebase/functions";
import { sendWelcomeEmail } from "../../utils/sendMails";
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

const Login = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleFacebookLogin = async () => {
    try {
      // Demande uniquement la permission user_photos
      const result = await LoginManager.logInWithPermissions(["user_photos"]);

      if (result.isCancelled) return;

      const data = await AccessToken.getCurrentAccessToken();
      if (!data)
        throw new Error("Impossible d'obtenir le token d'accès Facebook");

      const facebookCredential = auth.FacebookAuthProvider.credential(
        data.accessToken
      );
      const userCredential = await auth().signInWithCredential(
        facebookCredential
      );

      const userDoc = await firestore()
        .collection("users")
        .doc(userCredential.user.uid)
        .get();

      if (!userDoc.exists) {
        await firestore().collection("users").doc(userCredential.user.uid).set({
          photoURL: userCredential.user.photoURL,
          createdAt: moment().format(),
          loginWithApple: false,
        });
        const email = userCredential.user.email;
        const userName = createUniqueUsername(email);
        await sendWelcomeEmail(email, userName).catch(console.error);
      } else {
        if (!userDoc.data().photoURL && userCredential.user.photoURL) {
          await firestore()
            .collection("users")
            .doc(userCredential.user.uid)
            .update({
              photoURL: userCredential.user.photoURL,
            });
        }
      }

      await userCredential.user.updateProfile({
        photoURL: userCredential.user.photoURL,
      });

      // navigation.navigate('Home');
    } catch (error) {
      showMessage({
        message: "Erreur Facebook. Réessaie.",
        type: "danger",
      });
    }
  };

  const handleGoogleAuth = async () => {
    try {
      // Vérifie si Google Play Services est disponible
      await GoogleSignin.hasPlayServices();

      // Démarre le processus de connexion Google
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = userInfo.data;
      const { email, photo } = userInfo.data.user;

      // Crée les identifiants pour Firebase avec le token Google
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Connecte l'utilisateur à Firebase
      const userCredential = await auth().signInWithCredential(
        googleCredential
      );
      const userName = createUniqueUsername(email);
      // Vérifie si l'utilisateur existe déjà dans Firestore
      const userDoc = await firestore()
        .collection("users")
        .doc(userCredential.user.uid)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        if (!userData.photoURL) {
          await firestore()
            .collection("users")
            .doc(userCredential.user.uid)
            .update({
              photoURL: photo,
            });
        }
      } else {
        // Ajoute l'utilisateur dans Firestore
        await firestore().collection("users").doc(userCredential.user.uid).set({
          loginWithApple: false,
          email,
          username: userName,
          photoURL: photo,
          interests: [],
          showMyProfile: true,
          createdAt: moment().format(), // Ajout de l'horodatage
        });
        await userCredential.user.updateProfile({
          photoURL: photo, // Ajoute la photo de profil Google
        });
        await sendWelcomeEmail(email, userName).catch(console.error);
        return;
      }

      // Met à jour la photo de profil Firebase Auth
      await userCredential.user.updateProfile({
        photoURL: photo, // Ajoute la photo de profil Google
      });

      // Redirection vers la page Home
    } catch (error) {
      showMessage({
        message:
          "Une erreur est survenue lors de la connexion avec Google. Veuillez réessayer.",
        type: "danger",
      });
    }
  };

  const handleAppleAuth = async () => {
    try {
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error("Apple token absent");
      }

      // Création des credentials Firebase avec nonce
      const appleCredential = auth.AppleAuthProvider.credential(
        credential.identityToken,
        rawNonce
      );

      // Connecter l'utilisateur à Firebase
      const userCredential = await auth().signInWithCredential(appleCredential);
      console.log(userCredential);

      const email = credential.email || userCredential.user.email;

      // Gestion robuste des noms
      const firstName =
        credential.fullName?.givenName ||
        userCredential.user?.displayName?.split(" ")[0] ||
        "user";
      // const firstName = "eeeeeeeeeeee";
      const userName = createUniqueUsername(email);

      const userDoc = await firestore()
        .collection("users")
        .doc(userCredential.user.uid)
        .get();
      if (!userDoc.exists) {
        // Ajouter l'utilisateur dans Firestore
        await firestore()
          .collection("users")
          .doc(userCredential.user.uid)
          .set({
            loginWithApple: true,
            email,
            firstName,
            username: userName,
            lastName: credential.fullName.familyName || "user",
            interests: [],
            showMyProfile: true,
            createdAt: moment().format(),
            isPrivateEmail:
              userCredential.additionalUserInfo.profile.is_private_email,
            appleSubId: userCredential.additionalUserInfo.profile.sub,
          });
        await sendWelcomeEmail(email, userName).catch(console.error);
      }

      // Redirection vers la page Home
    } catch (error) {
      console.error("Erreur lors de la connexion avec Apple:", error);
      alert("Erreur lors de la connexion avec Apple:", error);
      showMessage({
        message:
          "Une erreur est survenue lors de la connexion avec Apple. Veuillez réessayer.",
        type: "danger",
      });
    }
  };

  // Fonction de connexion via téléphone
  const handlePhoneAuth = () => {
    navigation.navigate("PhoneVerificationPage");
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
          <View className="mb-12">
            <Text
              style={{ fontFamily: "Inter_700Bold" }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {i18n.t("bienvenue")}
            </Text>
            <Text
              style={{ fontFamily: "Inter_400Regular" }}
              className="text-gray-500 dark:text-gray-400 text-lg"
            >
              {i18n.t("connectez-vous_pour_rejoindre_la_communaute")}
            </Text>
          </View>

          {/* Formulaire */}
          <View className="space-y-6">
            <View className="flex flex-col gap-4">
              <Pressable
                onPress={() => navigation.navigate("PasswordPage")}
                style={{
                  backgroundColor: COLORS.primary,
                }}
                className={`mt-4 py-3 rounded-xl flex-row items-center justify-center`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons
                      name="mail"
                      size={24}
                      color="#FFFFFF"
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={{
                        fontFamily: "Inter_400Regular",
                      }}
                      className="text-white font-semibold text-lg mr-2"
                    >
                      {i18n.t("continuer")}
                    </Text>
                  </>
                )}
              </Pressable>

              {Platform.OS === "ios" && (
                <Pressable
                  onPress={handleAppleAuth}
                  className="py-3 flex-row items-center justify-center bg-black dark:bg-gray-800 dark:border-gray-700 rounded-xl active:bg-gray-900 dark:active:bg-gray-700"
                >
                  <Ionicons
                    name="logo-apple"
                    size={24}
                    color="#FFFFFF"
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                    }}
                    className="text-white  text-lg"
                  >
                    {i18n.t("continuer_avec_apple")}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleFacebookLogin}
                className="py-3 flex-row items-center justify-center bg-[#1877F2] border border-gray-200 dark:border-gray-700 rounded-xl active:bg-[#145DBF]"
              >
                <Ionicons
                  name="logo-facebook"
                  size={24}
                  color="#FFFFFF"
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                  }}
                  className="text-white  text-lg"
                >
                  {i18n.t("continuer_avec_facebook")}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleGoogleAuth}
                className="py-1 flex-row items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl active:bg-gray-50 dark:active:bg-gray-700"
              >
                <Image
                  source={require("../../../assets/icons/google.png")}
                  className="w-10 h-10 mr-3 p-2"
                />
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                  }}
                  className="text-gray-700 dark:text-gray-300  text-lg"
                >
                  {i18n.t("continuer_avec_google")}
                </Text>
              </Pressable>

              <Pressable
                onPress={handlePhoneAuth}
                className="py-3 flex-row items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl active:bg-gray-50 dark:active:bg-gray-700"
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color="#374151"
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                  }}
                  className="text-gray-700 dark:text-gray-300  text-lg"
                >
                  {i18n.t("continuer_avec_un_numero")}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <Text
            style={{
              fontFamily: "Inter_400Regular",
            }}
            className="text-center text-gray-500 dark:text-gray-400 mt-8 mb-6"
          >
            En continuant, vous acceptez nos{" "}
            <Pressable
              onPress={() =>
                Linking.openURL("https://connectetmove.com/termes.html")
              }
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                }}
                className="text-orange-600 dark:text-orange-400"
              >
                {i18n.t("conditions_dutilisation")}
              </Text>
            </Pressable>
          </Text>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default Login;
