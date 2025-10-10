// VerifyCodeScreen.js
import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Keyboard,
  Alert,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { COLORS } from "../../styles/colors";
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from "react-native-confirmation-code-field";
import { auth, db } from "../../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { showMessage } from "react-native-flash-message";
import { API_URL } from "@env";
import Loader from "../../components/Loader";

const CELL_COUNT = 6;
const RESEND_COOLDOWN = 60; // 60 secondes

export default function VerifyEmail({ navigation, route }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const email = route?.params?.email || auth.currentUser?.email;

  const ref = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: code,
    setValue: setCode,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => null,
    });
  }, [navigation]);

  // Timer pour le renvoi du code
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Validation automatique quand le code est complet
  useEffect(() => {
    if (code.length === CELL_COUNT) {
      handleValidate();
    }
  }, [code]);

  const handleValidate = async () => {
    if (code.length < CELL_COUNT || isLoading) {
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        showMessage({
          message: "Erreur",
          description: "Utilisateur non identifié.",
          type: "danger",
          icon: "danger",
        });
        setIsLoading(false);
        return;
      }

      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        showMessage({
          message: "Erreur",
          description: "Utilisateur introuvable.",
          type: "danger",
          icon: "danger",
        });
        setIsLoading(false);
        return;
      }

      const { emailVerificationCode } = snap.data();

      if (emailVerificationCode === code) {
        await updateDoc(userRef, {
          emailIsVerified: true,
          emailVerificationCode: null,
        });
        showMessage({
          message: "Succès",
          description: "Votre email a été vérifié !",
          type: "success",
          icon: "success",
        });
        navigation.replace("Home");
      } else {
        showMessage({
          message: "Erreur",
          description: "Le code est incorrect.",
          type: "danger",
          icon: "danger",
        });
        setCode(""); // Réinitialiser le code
      }
    } catch (e) {
      console.error(e);
      showMessage({
        message: "Erreur",
        description: "Problème technique lors de la vérification.",
        type: "danger",
        icon: "danger",
      });
      setCode(""); // Réinitialiser le code
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || resendTimer > 0) {
      return;
    }

    setCanResend(false);
    setResendTimer(RESEND_COOLDOWN);

    try {
      // Générer un nouveau code
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Envoyer l'email avec le nouveau code
      const response = await fetch(`${API_URL}/mail_verification.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          codeVerification: newCode,
          colors: {
            primary: COLORS.primary,
            secondary: COLORS.primary,
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi de l'email");
      }

      // Mettre à jour le code dans Firestore
      const uid = auth.currentUser?.uid;
      if (uid) {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
          emailVerificationCode: newCode,
        });
      }

      showMessage({
        message: "Code renvoyé",
        description: "Un nouveau code a été envoyé à votre email.",
        type: "success",
        icon: "success",
      });
    } catch (error) {
      console.error(error);
      showMessage({
        message: "Erreur",
        description: "Impossible de renvoyer le code. Réessayez plus tard.",
        type: "danger",
        icon: "danger",
      });
      setCanResend(true);
      setResendTimer(0);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60 }}>
          {/* Header avec icône */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            style={{ alignItems: "center", marginBottom: 40 }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: COLORS.primary + "15",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Ionicons name="mail-outline" size={48} color={COLORS.primary} />
            </View>

            <Text
              style={{
                fontFamily: "OpenSans_700Bold",
                fontSize: 28,
                marginBottom: 12,
                textAlign: "center",
              }}
              className="text-gray-900 dark:text-white"
            >
              Vérifiez votre email
            </Text>

            <Text
              style={{
                fontFamily: "OpenSans_400Regular",
                fontSize: 15,
                textAlign: "center",
                lineHeight: 22,
              }}
              className="text-gray-600 dark:text-gray-400 px-4"
            >
              Entrez le code de vérification à 6 chiffres envoyé à{"\n"}
              <Text style={{ fontFamily: "OpenSans_600SemiBold" }}>
                {email}
              </Text>
            </Text>
          </Animated.View>

          {/* Code Input */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={{ marginBottom: 32, position: "relative" }}
          >
            <CodeField
              ref={ref}
              {...props}
              value={code}
              onChangeText={setCode}
              cellCount={CELL_COUNT}
              rootStyle={{ marginBottom: 8 }}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoFocus
              editable={!isLoading}
              renderCell={({ index, symbol, isFocused }) => (
                <View
                  onLayout={getCellOnLayoutHandler(index)}
                  key={index}
                  style={{
                    flex: 1,
                    height: 64,
                    marginHorizontal: 4,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: isFocused
                      ? COLORS.primary
                      : symbol
                      ? COLORS.primary + "40"
                      : "#E5E7EB",
                    backgroundColor: isFocused
                      ? COLORS.primary + "08"
                      : "#F9FAFB",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: isFocused ? COLORS.primary : "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isFocused ? 0.15 : 0,
                    shadowRadius: 8,
                    elevation: isFocused ? 4 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontFamily: "OpenSans_700Bold",
                      color: symbol ? "#111827" : "#9CA3AF",
                    }}
                  >
                    {symbol ?? (isFocused ? <Cursor /> : null)}
                  </Text>
                </View>
              )}
            />

            {/* Indicateur de chargement */}
            {isLoading && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  borderRadius: 16,
                }}
              >
                <Loader />
                <Text
                  style={{
                    fontFamily: "OpenSans_600SemiBold",
                    fontSize: 14,
                    marginTop: 8,
                    color: COLORS.primary,
                  }}
                >
                  Vérification...
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Resend Code */}
          <Animated.View
            entering={FadeIn.duration(400).delay(400)}
            style={{ alignItems: "center" }}
          >
            <Text
              style={{
                fontFamily: "OpenSans_400Regular",
                fontSize: 14,
                marginBottom: 12,
              }}
              className="text-gray-600 dark:text-gray-400"
            >
              Vous n'avez pas reçu le code ?
            </Text>

            <Pressable
              onPress={handleResendCode}
              disabled={!canResend || resendTimer > 0}
              style={({ pressed }) => ({
                opacity:
                  !canResend || resendTimer > 0 ? 0.5 : pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "OpenSans_600SemiBold",
                  fontSize: 15,
                  color:
                    !canResend || resendTimer > 0 ? "#9CA3AF" : COLORS.primary,
                }}
              >
                {resendTimer > 0
                  ? `Renvoyer le code (${resendTimer}s)`
                  : "Renvoyer le code"}
              </Text>
            </Pressable>

            {resendTimer > 0 && (
              <View
                style={{
                  marginTop: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#FEF3C7",
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: "OpenSans_400Regular",
                    fontSize: 12,
                    color: "#92400E",
                    textAlign: "center",
                  }}
                >
                  Veuillez patientez avant de renvoyer
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
