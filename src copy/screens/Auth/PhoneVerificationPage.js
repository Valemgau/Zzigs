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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [indicatif, setIndicatif] = useState("+33");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const codeInputRef = useRef(null);

  const sendVerification = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert(t("error"), t("phoneNumberRequired"));
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = `${indicatif}${phoneNumber.replace(/^0+/, "")}`;

      const provider = new PhoneAuthProvider(auth);
      const verificationIdTmp = await provider.verifyPhoneNumber(formattedPhone, window?.recaptchaVerifier || null);

      setVerificationId(verificationIdTmp);
      setStep(2);
    } catch (error) {
      Alert.alert(t("error"), error.message || t("codeSendFailed"));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      Alert.alert(t("error"), t("codeRequired"));
      return;
    }
    if (!verificationId) {
      Alert.alert(t("error"), t("noVerificationId"));
      return;
    }
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      navigation.replace("Home");
    } catch (error) {
      Alert.alert(t("error"), t("incorrectCode"));
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
              {t("phoneLoginTitle")}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-lg font-['OpenSans_400Regular']">
              {step === 1 ? t("phoneLoginStep1") : t("phoneLoginStep2")}
            </Text>
          </View>

          {step === 1 && (
            <View>
              <View className="flex-row items-center space-x-3 mb-4">
                <View className="w-28 border border-gray-300 rounded dark:border-gray-700 dark:bg-gray-800">
                  <Pressable
                    onPress={() => Alert.alert(t("countryCodeSelector"))}
                    className="p-3 flex-row justify-between items-center"
                  >
                    <Text className="text-base dark:text-white">{indicatif}</Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </Pressable>
                </View>
                <TextInput
                  className="flex-1 border border-gray-300 rounded px-4 py-3 text-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  keyboardType={Platform.OS === "ios" ? "number-pad" : "phone-pad"}
                  placeholder={t("phonePlaceholder")}
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
                      {t("receiveCode")}
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
                placeholder={t("smsCodePlaceholder")}
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
                      {t("validateCode")}
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
