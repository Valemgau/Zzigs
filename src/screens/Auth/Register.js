import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../config/firebase";
import { COLORS } from "../../styles/colors";
import { useTranslation } from "react-i18next";
import { doc, setDoc } from "firebase/firestore";
import { showMessage } from "react-native-flash-message";

import { API_URL } from "@env";
import { Image } from "expo-image";

export default function Register() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("couturier");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isClient = selectedRole === "demandeur";

  const handleRegister = async () => {
    if (!email.trim()) {
      showMessage({
        message: t("emailRequired"),
        description: t("emailRequiredDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (password.length < 6) {
      showMessage({
        message: t("passwordTooShort"),
        description: t("passwordTooShortDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (password !== confirmPassword) {
      showMessage({
        message: t("incorrectPassword"),
        description: t("passwordNoMatch"),
        type: "danger",
        icon: "danger",
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const uid = userCredential.user.uid;

      const codeVerification = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      await setDoc(
        doc(db, "users", uid),
        {
          email: email.trim(),
          emailVerificationCode: codeVerification,
          role: selectedRole,
          isClient: isClient,
          isActive: true,
          createdAt: new Date(),
        },
        { merge: true }
      );

      await fetch(`${API_URL}/mail_verification.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          codeVerification,
          colors: {
            primary: COLORS.primary,
            secondary: COLORS.primary,
          },
        }),
      });

      showMessage({
        message: t("accountCreated"),
        description: t("accountCreatedDesc"),
        type: "success",
        icon: "success",
      });
    } catch (error) {
      console.error("Erreur inscription:", error);

      if (error.code === "auth/email-already-in-use") {
        showMessage({
          message: t("emailAlreadyUsed"),
          description: t("emailAlreadyUsedDesc"),
          type: "danger",
          icon: "danger",
        });
      } else if (error.code === "auth/invalid-email") {
        showMessage({
          message: t("invalidEmail"),
          description: t("invalidEmailDesc"),
          type: "danger",
          icon: "danger",
        });
      } else {
        showMessage({
          message: t("error"),
          description: t("error"),
          type: "danger",
          icon: "danger",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
 <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-12">
          {/* Logo centré */}
          <Animated.View 
            entering={FadeInDown.duration(300)} 
            className="items-center mb-6"
          >
            <View className="w-16 h-16 rounded overflow-hidden bg-white shadow-lg">
              <Image
                source={require("../../../assets/logo.png")}
                className="w-full h-full"
                contentFit="cover"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(50)} className="mb-6 items-center">
            <Text
              className="text-2xl font-bold text-gray-900 mb-2 text-center"
              style={{ fontFamily: "OpenSans_700Bold" }}
            >
              {t("createAccount")}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(100)}
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider text-center"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("iAm")}
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setSelectedRole("couturier")}
                className="flex-1 py-3 items-center border-2"
                style={{
                  backgroundColor:
                    selectedRole === "couturier" ? COLORS.primary : "#fff",
                  borderColor:
                    selectedRole === "couturier" ? COLORS.primary : "#D1D5DB",
                }}
              >
                <MaterialIcons
                  name="content-cut"
                  size={20}
                  color={selectedRole === "couturier" ? "#fff" : "#6B7280"}
                />
                <Text
                  className="text-xs font-bold mt-1"
                  style={{
                    fontFamily: "OpenSans_700Bold",
                    color: selectedRole === "couturier" ? "#fff" : "#6B7280",
                  }}
                >
                  {t("tailor")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedRole("demandeur")}
                className="flex-1 py-3 items-center border-2"
                style={{
                  backgroundColor:
                    selectedRole === "demandeur" ? COLORS.primary : "#fff",
                  borderColor:
                    selectedRole === "demandeur" ? COLORS.primary : "#D1D5DB",
                }}
              >
                <MaterialIcons
                  name="person"
                  size={20}
                  color={selectedRole === "demandeur" ? "#fff" : "#6B7280"}
                />
                <Text
                  className="text-xs font-bold mt-1"
                  style={{
                    fontFamily: "OpenSans_700Bold",
                    color: selectedRole === "demandeur" ? "#fff" : "#6B7280",
                  }}
                >
                  {t("customer")}
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(150)}
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider text-center"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("email")}
            </Text>
            <View className="relative">
              <View className="absolute left-4 z-10" style={{ top: 17 }}>
                <MaterialIcons name="email" size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder={t("emailPlaceholder")}
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                className="bg-white border border-gray-200 text-gray-900 text-base pl-12 pr-4 py-3"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  height: 52,
                  paddingVertical: 0,
                }}
              />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(200)}
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider text-center"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("password")}
            </Text>
            <View className="relative">
              <View className="absolute left-4 z-10" style={{ top: 16 }}>
                <MaterialIcons name="lock" size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                className="bg-white border border-gray-200 text-gray-900 text-base pl-12 pr-12 py-3"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  height: 52,
                  paddingVertical: 0,
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
                  color="#6B7280"
                />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(250)}
            className="mb-8"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider text-center"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("confirmPassword")}
            </Text>
            <View className="relative">
              <View className="absolute left-4 z-10" style={{ top: 16 }}>
                <MaterialIcons name="lock" size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                textContentType="newPassword"
                className="bg-white border border-gray-200 text-gray-900 text-base pl-12 pr-12 py-3"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  height: 52,
                  paddingVertical: 0,
                }}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 z-10"
                style={{ top: 16 }}
              >
                <MaterialIcons
                  name={showConfirmPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </View>
            {confirmPassword.length > 0 && (
              <View className="flex-row items-center justify-center mt-2">
                <MaterialIcons
                  name={
                    password === confirmPassword ? "check-circle" : "error"
                  }
                  size={16}
                  color={password === confirmPassword ? "#10B981" : "#EF4444"}
                />
                <Text
                  className="text-xs ml-2"
                  style={{
                    fontFamily: "OpenSans_400Regular",
                    color: password === confirmPassword ? "#10B981" : "#EF4444",
                  }}
                >
                  {password === confirmPassword
                    ? t("passwordMatch")
                    : t("passwordNoMatch")}
                </Text>
              </View>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(300)}>
            <Pressable
              onPress={handleRegister}
              disabled={loading || !email || !password || !confirmPassword}
              className="py-4 items-center"
              style={{
                backgroundColor:
                  loading || !email || !password || !confirmPassword
                    ? "#D1D5DB"
                    : COLORS.primary,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View className="flex-row items-center">
                  <MaterialIcons name="person-add" size={18} color="#fff" />
                  <Text
                    className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {t("createMyAccount")}
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(350)}
            className="mt-6 mb-8"
          >
            <Pressable
              onPress={() => navigation.goBack()}
              className="py-4 items-center"
            >
              <Text
                className="text-sm text-center"
                style={{
                  fontFamily: "OpenSans_600SemiBold",
                  color: COLORS.secondary,
                }}
              >
                {t("alreadyHaveAccount")}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
