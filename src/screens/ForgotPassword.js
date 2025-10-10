import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { COLORS } from "../styles/colors";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { API_URL } from "@env";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";

export default function ForgotPassword() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);


  const handleSendCode = async () => {
    if (!email.trim()) {
      showMessage({
        message: t("emailRequired"),
        description: t("emailRequiredDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showMessage({
        message: t("invalidEmail"),
        description: t("invalidEmailFormat"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const userQuery = query(
        collection(db, "users"),
        where("email", "==", email.trim())
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        showMessage({
          message: t("userNotFound"),
          description: t("noAccountWithEmail"),
          type: "danger",
          icon: "danger",
        });
        setLoading(false);
        return;
      }

      const codeVerification = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      const response = await fetch(`${API_URL}/forgot_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          codeVerification,
          colors: {
            primary: COLORS.primary,
            secondary: COLORS.secondary,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors de l'envoi");
      }

      showMessage({
        message: t("codeSent"),
        description: t("codeSentDesc"),
        type: "success",
        icon: "success",
      });

      navigation.navigate("ResetPassword", {
        email: email.trim(),
        code: codeVerification,
      });

    } catch (error) {
      console.error("Erreur envoi code:", error);
      showMessage({
        message: t("error"),
        description: t("sendCodeError"),
        type: "danger",
        icon: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
  <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="px-6 pt-12">
          {/* Logo centré */}
          <Animated.View 
            entering={FadeInDown.duration(300)} 
            className="items-center mb-6"
          >
            <View className="w-16 h-16 rounded overflow-hidden bg-white shadow-lg">
              <Image
                source={require("../../assets/logo.png")}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(50)} className="mb-8 items-center">
            <Text
              className="text-2xl font-bold text-gray-900 mb-2 text-center"
              style={{ fontFamily: "OpenSans_700Bold" }}
            >
              {t("forgotPassword")}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(100)}
            className="border-l-4 bg-gray-50 px-4 py-3 mb-8"
            style={{ borderLeftColor: COLORS.secondary }}
          >
            <Text
              className="text-sm text-gray-700 leading-5 text-center"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              {t("forgotPasswordInfo")}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(150)}
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider text-center"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("emailAddress")} *
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
            className="bg-blue-50 border-l-4 px-4 py-3 mb-6"
            style={{ borderLeftColor: COLORS.primary }}
          >
            <Text
              className="text-xs font-bold mb-2 text-center"
              style={{ 
                fontFamily: "OpenSans_700Bold",
                color: COLORS.primary 
              }}
            >
              {t("howItWorks")}
            </Text>
            <View className="space-y-1">
              <View className="flex-row items-start">
                <Text className="text-xs text-gray-700 mr-2">1.</Text>
                <Text
                  className="text-xs text-gray-700 flex-1"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  {t("step1")}
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-xs text-gray-700 mr-2">2.</Text>
                <Text
                  className="text-xs text-gray-700 flex-1"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  {t("step2")}
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-xs text-gray-700 mr-2">3.</Text>
                <Text
                  className="text-xs text-gray-700 flex-1"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  {t("step3")}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 px-6 py-4"
        style={{
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <Pressable
          onPress={handleSendCode}
          disabled={loading}
          className="py-4 items-center flex-row justify-center mb-3"
          style={{
            backgroundColor: loading ? "#D1D5DB" : COLORS.primary,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialIcons name="send" size={18} color="#fff" />
              <Text
                className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                {t("sendCode")}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          className="py-3 items-center"
        >
          <Text
            className="text-sm"
            style={{
              fontFamily: "OpenSans_600SemiBold",
              color: COLORS.secondary,
            }}
          >
            {t("backToLogin")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
