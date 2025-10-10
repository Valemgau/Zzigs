import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Alert,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS } from "../../styles/colors";
import { auth } from "../../../config/firebase";
import { useTranslation } from "react-i18next";

export default function BloqueCompte({ navigation }) {
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => null,
    });
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      Alert.alert(t("error"), t("logoutError"));
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent(t("supportEmailSubject"));
    const body = encodeURIComponent(t("supportEmailBody"));
    Linking.openURL(`mailto:${process.env.ADMIN_EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center px-6">
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="items-center mb-8"
        >
          <View
            className="w-24 h-24 items-center justify-center mb-6"
            style={{
              backgroundColor: "#FEE2E2",
              borderWidth: 2,
              borderColor: "#EF4444",
            }}
          >
            <Ionicons name="lock-closed" size={48} color="#EF4444" />
          </View>

          <Text
            className="text-3xl font-bold text-center mb-3"
            style={{
              fontFamily: "OpenSans_700Bold",
              color: "#1F2937",
            }}
          >
            {t("accountSuspended")}
          </Text>

          <View className="w-16 h-1 bg-red-500" />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          className="mb-8"
        >
          <View className="border-l-4 bg-white px-4 py-4 border-red-500">
            <Text
              className="text-sm text-gray-700 leading-6 mb-3"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              {t("suspensionMessage")}
            </Text>
            <Text
              className="text-sm text-gray-700 leading-6"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              {t("emailSentMessage")}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          className="space-y-4"
        >
          <Pressable
            onPress={handleContactSupport}
            className="py-4 items-center border-2"
            style={{
              backgroundColor: COLORS.primary,
              borderColor: COLORS.primary,
            }}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="email" size={18} color="#fff" />
              <Text
                className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                {t("contactSupport")}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleLogout}
            className="py-4 items-center border-2 border-gray-300 bg-white"
          >
            <View className="flex-row items-center">
              <MaterialIcons name="logout" size={18} color="#6B7280" />
              <Text
                className="text-sm font-bold text-gray-700 ml-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                {t("logout")}
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          className="mt-8"
        >
          <View className="bg-amber-50 border border-amber-200 px-4 py-3">
            <View className="flex-row items-start">
              <MaterialIcons
                name="info"
                size={16}
                color="#D97706"
                style={{ marginTop: 2 }}
              />
              <Text
                className="flex-1 text-xs text-amber-800 leading-5 ml-3"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                {t("supportResponseTime")}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
