import React, { useLayoutEffect, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Alert,
  StyleSheet,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS } from "../../styles/colors";
import { auth } from "../../../config/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { showMessage } from "react-native-flash-message";

export default function ConfirmEmail({ navigation }) {
  const { t, i18n } = useTranslation();
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useLayoutEffect(() => {
    navigation.setOptions({ header: () => null });
  }, [navigation]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 10));

      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          navigation.replace("Home");
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      Alert.alert(t("error"), t("logoutError"));
    }
  };

  const handleResendEmail = async () => {
    setSending(true);

    if (!auth.currentUser) {
      showMessage({
        message: t("error"),
        description: t("userNotConnected"),
        type: "danger",
        icon: "danger",
      });
      setSending(false);
      return;
    }

    auth.languageCode = i18n.language || i18n.locale || "fr";

    try {
      await sendEmailVerification(auth.currentUser);
      showMessage({
        message: t("emailSent"),
        description: t("emailSentDescription"),
        type: "success",
        icon: "success",
      });
    } catch (e) {
      let description = t("emailSendError");

      switch (e.code) {
        case "auth/too-many-requests":
          description = t("tooManyRequests");
          break;
        case "auth/user-disabled":
          description = t("userDisabled");
          break;
        case "auth/network-request-failed":
          description = t("networkError");
          break;
        case "auth/invalid-user-token":
        case "auth/user-token-expired":
        case "auth/user-not-found":
          description = t("invalidSession");
          break;
      }

      showMessage({
        message: t("error"),
        description,
        type: "danger",
        icon: "danger",
      });
    }
    setSending(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        className="bg-white dark:bg-gray-900"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={[styles.container, { justifyContent: "space-between" }]}>
          <Animated.View
            entering={FadeInDown.duration(150)}
            style={{ width: "100%", alignItems: "center" }}
          >
            <Ionicons
              name="mail-open-outline"
              size={72}
              color={COLORS.primary}
              style={{ marginBottom: 24 }}
            />
            <Text
              style={{ fontFamily: "Inter_700Bold" }}
              className="text-2xl text-center text-gray-900 dark:text-white mb-4"
            >
              {t("confirmEmailTitle")}
            </Text>
            <Text
              style={{ fontFamily: "Inter_400Regular" }}
              className="text-center text-gray-600 dark:text-gray-300 mb-8 px-4"
            >
              {t("confirmEmailDescription")}
            </Text>
            <Pressable
              onPress={handleResendEmail}
              style={{
                backgroundColor: sending
                  ? COLORS.primary + "99"
                  : COLORS.primary,
              }}
              className="py-3 px-10 rounded mb-4"
              disabled={sending}
            >
              <Text className="text-white font-semibold text-lg text-center">
                {sending ? t("sending") : t("resendEmail")}
              </Text>
            </Pressable>
            <Pressable onPress={handleLogout} className="py-3 px-10 rounded">
              <Text
                style={{ color: COLORS.primary }}
                className="font-semibold text-lg text-center"
              >
                {t("backToLogin")}
              </Text>
            </Pressable>
          </Animated.View>
          <View style={{ width: "100%", marginTop: 12 }}>
            <Text
              style={{ textAlign: "center", color: "#333", fontWeight: "600" }}
            >
              {t("autoRedirectMessage")}
            </Text>
            <Text
              style={{
                textAlign: "center",
                color: "#333",
                fontWeight: "600",
                marginTop: 4,
              }}
            >
              {t("pageRefreshCountdown", { countdown })}
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 500,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
});
