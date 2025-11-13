import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../config/firebase";
import { COLORS } from "../../styles/colors";
import { useTranslation } from "react-i18next";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { showMessage } from "react-native-flash-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

export default function PasswordPage() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [savedAccount, setSavedAccount] = useState(null);

  useEffect(() => {
    checkSavedAccount();
  }, []);

  async function checkSavedAccount() {
    try {
      const value = await AsyncStorage.getItem("USER_LAST_LOGIN");
      if (value !== null) {
        const userLastLogin = JSON.parse(value);
        setSavedAccount(userLastLogin);
        setShowAccountModal(true);
      }
    } catch (error) {
      console.error("Erreur récupération dernière connexion:", error);
    }
  }

  const handleUseSavedAccount = async () => {
    if (!savedAccount) return;
    
    setShowAccountModal(false);
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        savedAccount.email,
        savedAccount.password
      );

      await updateDoc(doc(db, "users", userCredential.user.uid), {
        lastLogin: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erreur connexion:", error);
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = () => {
    if (savedAccount) {
      setEmail(savedAccount.email);
      setPassword("");
    }
    setShowAccountModal(false);
  };

  const handleDifferentAccount = () => {
    setEmail("");
    setPassword("");
    setSavedAccount(null);
    setShowAccountModal(false);
  };

  const handleLoginError = (error) => {
    if (error.code === "auth/invalid-email") {
      showMessage({
        message: t("invalidEmail"),
        description: t("invalidEmailDesc"),
        type: "danger",
        icon: "danger",
      });
    } else if (error.code === "auth/user-not-found") {
      showMessage({
        message: t("accountNotFound"),
        description: t("accountNotFoundDesc"),
        type: "danger",
        icon: "danger",
      });
    } else if (error.code === "auth/wrong-password") {
      showMessage({
        message: t("incorrectPassword"),
        description: t("incorrectPasswordDesc"),
        type: "danger",
        icon: "danger",
      });
    } else {
      showMessage({
        message: t("loginFailed"),
        description: t("loginFailedDesc"),
        type: "danger",
        icon: "danger",
      });
    }
  };

  const handlePasswordSubmit = async (email, password) => {
    if (!email.trim()) {
      showMessage({
        message: t("emailRequired"),
        description: t("emailRequiredDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (password.trim().length < 6) {
      showMessage({
        message: t("passwordTooShort"),
        description: t("passwordTooShortDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const jsonValue = JSON.stringify({
        email: email.trim(),
        password,
      });
      await AsyncStorage.setItem("USER_LAST_LOGIN", jsonValue);

      await updateDoc(doc(db, "users", userCredential.user.uid), {
        lastLogin: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erreur connexion:", error);
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1a0000', COLORS.primary, '#8B0000', COLORS.primary, '#1a0000']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        {/* Cercles décoratifs flous en arrière-plan */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Animated.View 
            entering={FadeIn.duration(1500)}
            style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: 150,
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          />
          <Animated.View 
            entering={FadeIn.duration(1500).delay(200)}
            style={{
              position: 'absolute',
              bottom: -150,
              left: -100,
              width: 400,
              height: 400,
              borderRadius: 200,
              backgroundColor: 'rgba(255,255,255,0.03)',
            }}
          />
        </View>

        <SafeAreaView className="flex-1">
          {/* Bouton retour fixe */}
          <View className="px-6 pt-4 pb-2">
            <Animated.View
              entering={FadeInDown.duration(300)}
            >
              <Pressable
                onPress={() => navigation.goBack()}
                className="self-start"
                style={{ padding: 8 }}
              >
                <MaterialIcons name="arrow-back" size={28} color="#fff" />
              </Pressable>
            </Animated.View>
          </View>

          <KeyboardAwareScrollView
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            enableOnAndroid
            extraHeight={200}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 px-6">
              {/* Logo avec effet glassmorphism */}
              <Animated.View
                entering={FadeInDown.duration(300).delay(50)}
                className="items-center mb-12"
              >
                <View 
                  className="rounded-full overflow-hidden p-1"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    shadowColor: "#fff",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                >
                  <View 
                    className="w-32 h-32 rounded-full overflow-hidden"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <Image
                      source={require("../../../assets/logo_cropped.png")}
                      className="w-full h-full"
                      contentFit="cover"
                    />
                  </View>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(300).delay(100)}
                className="mb-10 items-center"
              >
                <Text
                  className="text-3xl font-bold text-white text-center"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  {t("loginTitle")}
                </Text>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(300).delay(100)}
                className="mb-5"
              >
                <View className="relative">
                  <View className="absolute left-4 z-10" style={{ top: 17 }}>
                    <MaterialIcons name="email" size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                  <TextInput
                    placeholder={t("emailPlaceholder")}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    className="text-white text-base pl-12 pr-4 py-3"
                    style={{
                      fontFamily: "OpenSans_400Regular",
                      height: 52,
                      paddingVertical: 0,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                    }}
                  />
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(300).delay(150)}
                className="mb-2"
              >
                <View className="relative">
                  <View className="absolute left-4 z-10" style={{ top: 16 }}>
                    <MaterialIcons name="lock" size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    textContentType="password"
                    className="text-white text-base pl-12 pr-12 py-3"
                    style={{
                      fontFamily: "OpenSans_400Regular",
                      height: 52,
                      paddingVertical: 0,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                    }}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 z-10"
                    style={{ top: 16 }}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={20}
                      color="rgba(255,255,255,0.7)"
                    />
                  </Pressable>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(300).delay(200)}
                className="mb-8"
              >
                <Pressable
                  onPress={() => navigation.navigate("ForgotPassword")}
                  className="self-center"
                >
                  <Text
                    className="text-sm"
                    style={{
                      fontFamily: "OpenSans_600SemiBold",
                      color: 'rgba(255,255,255,0.95)',
                    }}
                  >
                    {t("forgotPassword")}
                  </Text>
                </Pressable>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(300).delay(250)}
                className="mb-4"
              >
                <Pressable
                  onPress={() => handlePasswordSubmit(email, password)}
                  disabled={loading || !email || !password}
                  className="py-4 items-center"
                  style={{
                    backgroundColor:
                      loading || !email || !password ? "rgba(255,255,255,0.2)" : "#fff",
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.primary} size="small" />
                  ) : (
                    <View className="flex-row items-center">
                      <MaterialIcons name="login" size={18} color={COLORS.primary} />
                      <Text
                        className="text-sm font-bold ml-2 uppercase tracking-wider"
                        style={{ fontFamily: "OpenSans_700Bold", color: COLORS.primary }}
                      >
                        {t("login")}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(300).delay(300)}
                className="flex-row items-center my-6"
              >
                <View className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <Text
                  className="px-4 text-xs uppercase tracking-wider"
                  style={{ fontFamily: "OpenSans_600SemiBold", color: 'rgba(255,255,255,0.7)' }}
                >
                  {t("or")}
                </Text>
                <View className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(300).delay(350)}
                className="mb-8"
              >
                <Pressable
                  onPress={() => navigation.navigate("Register")}
                  className="py-4 items-center"
                  style={{
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="person-add"
                      size={18}
                      color="#fff"
                    />
                    <Text
                      className="text-sm font-bold ml-2 uppercase tracking-wider text-white"
                      style={{
                        fontFamily: "OpenSans_700Bold",
                      }}
                    >
                      {t("createAccount")}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            </View>
          </KeyboardAwareScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Modal de connexion rapide */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <Animated.View
            entering={FadeIn.duration(300)}
            className="bg-white rounded-3xl p-6 w-full max-w-sm"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <View className="items-center mb-6">
              <View 
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(139, 0, 0, 0.1)' }}
              >
                <MaterialIcons
                  name="person-outline"
                  size={36}
                  color={COLORS.primary}
                />
              </View>
              <Text
                style={{ fontFamily: "OpenSans_700Bold" }}
                className="text-xl font-bold text-gray-900 text-center mb-2"
              >
                {t("lastLoginTitle")}
              </Text>
              {savedAccount && (
                <Text
                  style={{ fontFamily: "OpenSans_400Regular" }}
                  className="text-sm text-gray-600 text-center"
                >
                  {savedAccount.email}
                </Text>
              )}
            </View>

            <Pressable
              style={{ backgroundColor: COLORS.primary }}
              className="rounded-xl py-4 mb-3"
              onPress={handleUseSavedAccount}
            >
              <Text
                style={{ fontFamily: "OpenSans_700Bold" }}
                className="text-base font-bold text-white text-center"
              >
                {t("yes")}
              </Text>
            </Pressable>

            <Pressable
              style={{ borderWidth: 1.5, borderColor: "#E5E5E5" }}
              className="rounded-xl py-4 mb-3 bg-white"
              onPress={handleManualLogin}
            >
              <Text
                style={{ fontFamily: "OpenSans_600SemiBold" }}
                className="text-base font-semibold text-gray-900 text-center"
              >
                {t("forgotPassword")}
              </Text>
            </Pressable>

            <Pressable className="py-3" onPress={handleDifferentAccount}>
              <Text
                style={{
                  fontFamily: "OpenSans_600SemiBold",
                  color: COLORS.primary,
                }}
                className="text-sm font-semibold text-center"
              >
                {t("no")}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}