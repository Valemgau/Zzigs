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
import Animated, {FadeIn,FadeInDown } from "react-native-reanimated";
import { API_URL } from "@env";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

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

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="px-6">
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
                      source={require("../../assets/logo_cropped.png")}
                      className="w-full h-full"
                      contentFit="cover"
                    />
                  </View>
                </View>
              </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(100)} className="mb-10 items-center">
            <Text
              className="text-3xl font-bold text-white text-center"
              style={{ fontFamily: "OpenSans_700Bold" }}
            >
              {t("forgotPassword")}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(150)}
            className="mb-6"
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
            entering={FadeInDown.duration(300).delay(200)}
            className="border-l-4 px-4 py-4 mb-6 rounded-r-lg"
            style={{ 
              borderLeftColor: 'rgba(255,255,255,0.8)',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }}
          >
            <Text
              className="text-xs font-bold mb-3 text-center text-white"
              style={{ 
                fontFamily: "OpenSans_700Bold",
              }}
            >
              {t("howItWorks")}
            </Text>
            <View className="space-y-2">
              <View className="flex-row items-start">
                <Text className="text-xs mr-2" style={{ color: 'rgba(255,255,255,0.9)' }}>1.</Text>
                <Text
                  className="text-xs flex-1"
                  style={{ 
                    fontFamily: "OpenSans_400Regular",
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  {t("step1")}
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-xs mr-2" style={{ color: 'rgba(255,255,255,0.9)' }}>2.</Text>
                <Text
                  className="text-xs flex-1"
                  style={{ 
                    fontFamily: "OpenSans_400Regular",
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  {t("step2")}
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-xs mr-2" style={{ color: 'rgba(255,255,255,0.9)' }}>3.</Text>
                <Text
                  className="text-xs flex-1"
                  style={{ 
                    fontFamily: "OpenSans_400Regular",
                    color: 'rgba(255,255,255,0.9)'
                  }}
                >
                  {t("step3")}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Bouton de validation non fixe */}
          <Animated.View entering={FadeInDown.duration(300).delay(250)} className="mb-4">
            <Pressable
              onPress={handleSendCode}
              disabled={loading}
              className="py-4 items-center flex-row justify-center"
              style={{
                backgroundColor: loading ? "rgba(255,255,255,0.2)" : "#fff",
              }}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color={COLORS.primary} />
                  <Text
                    className="text-sm font-bold ml-2 uppercase tracking-wider"
                    style={{ 
                      fontFamily: "OpenSans_700Bold",
                      color: COLORS.primary
                    }}
                  >
                    {t("sendCode")}
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(300)} className="mb-8">
            <Pressable
              onPress={() => navigation.goBack()}
              className="py-3 items-center"
            >
              <Text
                className="text-sm text-white"
                style={{
                  fontFamily: "OpenSans_600SemiBold",
                }}
              >
                {t("backToLogin")}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>
</View>
  );
}