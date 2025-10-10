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
import i18n from "../../i18n";
import { showMessage } from "react-native-flash-message";

export default function ConfirmEmail({ navigation }) {
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Header disable
  useLayoutEffect(() => {
    navigation.setOptions({ header: () => null });
  }, [navigation]);

  // Effect: actualisation, vérification email, countdown
  useEffect(() => {
    const intervalId = setInterval(async () => {
      // Met à jour le décompte
      setCountdown((prev) => (prev > 1 ? prev - 1 : 10));

      // Vérifie email validé
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
      Alert.alert(i18n.t("Erreur"), i18n.t("Impossible de se déconnecter."));
    }
  };

  const handleResendEmail = async () => {
    setSending(true);

    if (!auth.currentUser) {
      showMessage({
        message: i18n.t("Erreur"),
        description: i18n.t("Utilisateur non connecté."),
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
        message: i18n.t("Email envoyé"),
        description: i18n.t(
          "Un nouvel email de confirmation a été envoyé dans votre boîte de réception."
        ),
        type: "success",
        icon: "success",
      });
    } catch (e) {
      let description = i18n.t(
        "Impossible d'envoyer l'email de confirmation. Veuillez réessayer plus tard."
      );

      switch (e.code) {
        case "auth/too-many-requests":
          description = i18n.t(
            "Trop de tentatives. Merci de patienter quelques minutes avant de réessayer."
          );
          break;
        case "auth/user-disabled":
          description = i18n.t(
            "Ce compte a été désactivé. Contactez le support."
          );
          break;
        case "auth/network-request-failed":
          description = i18n.t(
            "Erreur réseau. Vérifiez votre connexion Internet."
          );
          break;
        case "auth/invalid-user-token":
        case "auth/user-token-expired":
        case "auth/user-not-found":
          description = i18n.t("Session invalide. Veuillez vous reconnecter.");
          break;
      }

      showMessage({
        message: i18n.t("Erreur"),
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
          {/* Haut du contenu */}
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
              {i18n.t("Veuillez confirmer votre adresse e-mail")}
            </Text>
            <Text
              style={{ fontFamily: "Inter_400Regular" }}
              className="text-center text-gray-600 dark:text-gray-300 mb-8 px-4"
            >
              {i18n.t(
                "Nous vous avons envoyé un e-mail avec un lien de confirmation. Merci de vérifier votre boîte de réception et de cliquer sur le lien pour activer votre compte."
              )}
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
                {sending
                  ? i18n.t("Envoi en cours...")
                  : i18n.t("Renvoyer l'email de confirmation")}
              </Text>
            </Pressable>
            <Pressable onPress={handleLogout} className="py-3 px-10 rounded">
              <Text
                style={{ color: COLORS.primary }}
                className="font-semibold text-lg text-center"
              >
                {i18n.t("Retour à la connexion")}
              </Text>
            </Pressable>
          </Animated.View>
          {/* Footer tout en bas */}
          <View style={{ width: "100%", marginTop: 12 }}>
            <Text
              style={{ textAlign: "center", color: "#333", fontWeight: "600" }}
            >
              {i18n.t(
                "Si vous avez validé votre adresse e-mail, vous serez automatiquement redirigé."
              )}
            </Text>
            <Text
              style={{
                textAlign: "center",
                color: "#333",
                fontWeight: "600",
                marginTop: 4,
              }}
            >
              {i18n.t("Cette page s'actualisera dans {{{countdown}}} secondes", {
                countdown,
              })}
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
