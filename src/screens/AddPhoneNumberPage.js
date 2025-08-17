import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";

const AddPhoneNumberPage = ({ navigation }) => {
  const [step, setStep] = useState("phone"); // Étape actuelle : "phone" ou "code"
  const [phoneNumber, setPhoneNumber] = useState(
    auth().currentUser?.phoneNumber?.slice(3) || ""
  );
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(90); // Minuterie pour renvoyer le code

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Fonction pour envoyer le code OTP
  const handleSendCode = async () => {
    if (phoneNumber.trim() === "" || phoneNumber.length < 9) {
      showMessage({
        message: `Veuillez entrer un numéro français valide.`,
        type: "danger",
      });
      return;
    }

    const formattedNumber = `+33${phoneNumber
      .replace(/\s/g, "")
      .replace(/^0/, "")}`; // Format valide
    setLoading(true);

    try {
      const confirmationResult = await auth().signInWithPhoneNumber(
        formattedNumber
      );
      showMessage({
        message: "Un code de vérification vous a été envoyé par sms.",
        type: "success",
      });
      setConfirmation(confirmationResult); // Stocke l'objet de confirmation pour valider le code plus tard
      setStep("code"); // Passe à l'étape de saisie du code
    } catch (error) {
      console.log(error);
      showMessage({
        message: `${error.message}.`,
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour vérifier le code OTP
  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      showMessage({
        message: `Le code doit contenir 6 chiffres.`,
        type: "danger",
      });
      return;
    }

    setLoading(true);

    try {
      // Génère un PhoneAuthCredential pour valider le code
      const credential = auth.PhoneAuthProvider.credential(
        confirmation.verificationId, // ID de vérification obtenue lors de l'envoi du code
        code // Code OTP saisi par l'utilisateur
      );

      // Met à jour le numéro de téléphone dans Firebase Auth
      const user = auth().currentUser;
      if (!user) {
        showMessage({
          message: `Aucun utilisateur actuellement connecté.`,
          type: "danger",
        });
        return;
      }

      await user.updatePhoneNumber(credential);

      // Formate le numéro de téléphone
      const formattedNumber = `+33${phoneNumber
        .replace(/\s/g, "")
        .replace(/^0/, "")}`;

      // Met à jour le numéro de téléphone dans Firestore
      const userDocRef = firestore().collection("users").doc(user.uid);
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        await userDocRef.update({
          phoneNumber: formattedNumber,
        });
        showMessage({
          message: `Votre numéro de téléphone a été vérifié et mis à jour.`,
          type: "success",
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de la vérification :", error);
      showMessage({
        message: `${
          error.message || "Le code est invalide ou expiré. Veuillez réessayer"
        }.`,
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour renvoyer le code OTP
  const handleResendCode = () => {
    setResendTimer(90); // Réinitialise la minuterie
    showMessage({
      message: "Un nouveau code de vérification vous a été envoyé par sms.",
      type: "info",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        scrollEnabled
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraHeight={200}
        className="bg-white dark:bg-gray-900"
      >
        <Animated.View
          entering={FadeInDown.duration(100)}
          className="flex-1 px-6 pt-8"
        >
          {/* Titre */}
          <Text
            style={{ fontFamily: "Inter_700Bold" }}
            className="mb-10 text-3xl font-bold text-gray-900 dark:text-white mb-2"
          >
            {step === "phone"
              ? "Entrez votre numéro de téléphone"
              : "Saisissez le code reçu par sms"}
          </Text>

          {step === "phone" ? (
            <Animated.View entering={FadeInDown.delay(100)}>
              <View className="py-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 mb-6 border border-gray-300 dark:border-gray-700">
                <View className="flex-row items-center space-x-3">
                  <View className="flex-row items-center rounded-lg px-3 py-2">
                    <Image
                      source={require("../../assets/img/fr.png")}
                      className="w-8 h-6  mr-2"
                    />
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      className="text-gray-900 dark:text-white text-xl"
                    >{i18n.t("+33")}</Text>
                  </View>

                  <TextInput
                    style={{
                      fontFamily: "Inter_400Regular",
                      marginTop: -5,
                    }}
                    placeholder="6 12 34 56 78"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={(text) =>
                      setPhoneNumber(text.replace(/\D/g, ""))
                    }
                    className="flex-1 text-xl px-2 rounded-lg text-gray-900 dark:text-white "
                  />
                </View>
              </View>

              <Pressable
                style={{
                  backgroundColor: COLORS.primary,
                  opacity: loading || phoneNumber.length < 9 ? 0.5 : 1,
                }}
                onPress={handleSendCode}
                disabled={loading || phoneNumber.length < 9}
                className={`py-3 rounded-xl flex-row items-center justify-center `}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-white font-semibold text-base">{i18n.t("continuer")}</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInDown.delay(100)}
              className="space-y-6"
            >
              <View className="flex-row justify-between px-4">
                {[...Array(6)].map((_, index) => (
                  <TextInput
                    key={index}
                    style={{
                      width: 45,
                      height: 56,
                      fontSize: 24,
                    }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-900 dark:text-white font-bold border border-gray-300 dark:border-gray-700"
                    keyboardType="numeric"
                    maxLength={1}
                    value={code[index] || ""}
                    onChangeText={(text) => {
                      const newCode = code.split("");
                      newCode[index] = text;
                      setCode(newCode.join(""));
                    }}
                  />
                ))}
              </View>

              <Pressable
                style={{
                  backgroundColor: COLORS.primary,
                  opacity: loading || code.length !== 6 ? 0.5 : 1,
                }}
                onPress={handleVerifyCode}
                disabled={loading || code.length !== 6}
                className={`mt-5 py-3 rounded-xl flex-row items-center justify-center `}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-lg">{i18n.t("vérifier")}</Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleResendCode}
                disabled={resendTimer > 0}
                className="py-3 items-center justify-center"
              >
                <Text
                  className={` ${
                    resendTimer > 0
                      ? "text-gray-400 dark:text-gray-500"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {resendTimer > 0
                    ? `Renvoyer le code dans ${resendTimer}s`
                    : "Renvoyer le code"}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default AddPhoneNumberPage;
