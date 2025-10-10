import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { auth } from "../../../config/firebase";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../styles/colors";

const europeanIndicatifs = [
  { code: "+33", label: "France" },
  { code: "+41", label: "Suisse" },
  { code: "+32", label: "Belgique" },
  { code: "+49", label: "Allemagne" },
  { code: "+39", label: "Italie" },
  { code: "+34", label: "Espagne" },
  { code: "+352", label: "Luxembourg" },
  { code: "+44", label: "Royaume-Uni" },
];

export default function PhoneAuth() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [indicatif, setIndicatif] = useState("+33");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const codeInputRef = useRef(null);

  const sendVerification = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Erreur", "Merci de saisir votre numéro de téléphone.");
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = `${indicatif}${phoneNumber.replace(/^0+/, "")}`;

      // Envoi du code SMS et récupération du verificationId
      // Ici on utilise la méthode bas niveau pour récupérer verificationId
      const provider = new PhoneAuthProvider(auth);
      const verificationIdTmp = await provider.verifyPhoneNumber(formattedPhone, window?.recaptchaVerifier || null);

      setVerificationId(verificationIdTmp);
      setStep(2);
    } catch (error) {
      Alert.alert("Erreur", error.message || "Échec de l’envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      Alert.alert("Erreur", "Merci de saisir le code reçu.");
      return;
    }
    if (!verificationId) {
      Alert.alert("Erreur", "Aucun code envoyé à vérifier.");
      return;
    }
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      navigation.replace("Home"); // adapte la navigation après succès
    } catch (error) {
      Alert.alert("Erreur", "Code incorrect. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" enableOnAndroid extraHeight={150} contentContainerStyle={{ flexGrow: 1 }}>
        <Animated.View entering={FadeInDown.duration(150)} className="flex-1 px-6 pt-8 bg-white dark:bg-gray-900 justify-center">
          <View className="mb-10">
            <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-3 font-['OpenSans_700Bold']">
              Connexion par téléphone
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-lg font-['OpenSans_400Regular']">
              {step === 1
                ? "Sélectionnez votre indicatif et entrez votre numéro"
                : "Entrez le code envoyé par SMS"}
            </Text>
          </View>

          {step === 1 && (
            <View>
              <View className="flex-row items-center space-x-3 mb-4">
                {/* Indicatif */}
                <View className="w-28 border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800">
                  <Pressable
                    onPress={() => Alert.alert("Sélecteur indicatif (à implémenter)")}
                    className="p-3 flex-row justify-between items-center"
                  >
                    <Text className="text-base dark:text-white">{indicatif}</Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </Pressable>
                </View>
                {/* Phone Input */}
                <TextInput
                  className="flex-1 border border-gray-300 rounded px-4 py-3 text-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  keyboardType={Platform.OS === "ios" ? "number-pad" : "phone-pad"}
                  placeholder="6 XX XX XX XX"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  autoFocus
                />
              </View>

              <Pressable
                onPress={sendVerification}
                disabled={loading}
                style={{ backgroundColor: COLORS.primary }}
                className="py-4 rounded-3xl items-center flex-row justify-center active:opacity-80"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white font-semibold text-lg font-['Inter_600SemiBold']">
                      Recevoir le code
                    </Text>
                    <Ionicons name="chevron-forward" size={22} color="white" className="ml-4" />
                  </>
                )}
              </Pressable>
            </View>
          )}

          {step === 2 && (
            <View>
              <TextInput
                ref={codeInputRef}
                className="border border-gray-300 rounded px-4 py-3 text-lg text-center tracking-widest mb-6 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                maxLength={6}
                keyboardType="number-pad"
                placeholder="Code SMS"
                placeholderTextColor="#9CA3AF"
                value={code}
                onChangeText={setCode}
                autoFocus
              />

              <Pressable
                onPress={verifyCode}
                disabled={loading}
                style={{ backgroundColor: COLORS.primary }}
                className="py-4 rounded-3xl items-center flex-row justify-center active:opacity-80"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white font-semibold text-lg font-['Inter_600SemiBold']">
                      Valider le code
                    </Text>
                    <Ionicons name="chevron-forward" size={22} color="white" className="ml-4" />
                  </>
                )}
              </Pressable>
            </View>
          )}
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
