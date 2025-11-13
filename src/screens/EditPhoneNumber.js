import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { showMessage } from "react-native-flash-message";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";
import Animated, { FadeInDown } from "react-native-reanimated";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";

export default function EditPhoneNumber({ route }) {
  const { newProfile } = route?.params || {};
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPhone, setCurrentPhone] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) {
          const phone = snap.data().phoneNumber || "";
          setCurrentPhone(phone);
          setPhoneNumber(phone || "");
        }
      } catch (error) {
        console.error("Erreur chargement:", error);
        setPhoneNumber("");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePhoneChange = (value) => {
    // Si l'utilisateur essaie de tout effacer, on force le +
    if (!value || value.length === 0) {
      setPhoneNumber("+");
      return;
    }

    // Nettoyer : seulement chiffres et +
    const cleaned = value.replace(/[^\d\+]/g, "");

    // Le + doit toujours être au début
    if (!cleaned.startsWith("+")) {
      setPhoneNumber("+" + cleaned.replace(/\+/g, ""));
    } else {
      // Un seul + au début
      const digits = cleaned.substring(1).replace(/\+/g, "");
      setPhoneNumber("+" + digits);
    }
  };

  const validatePhoneNumber = (phone) => {
    // Le numéro doit commencer par +
    if (!phone || !phone.startsWith("+")) {
      return false;
    }

    // Extraire les chiffres après le +
    const digits = phone.substring(1);

    // Vérifier que ce sont uniquement des chiffres
    if (!/^\d+$/.test(digits)) {
      return false;
    }

    // Norme E.164 : entre 7 et 15 chiffres (après le +)
    if (digits.length < 7 || digits.length > 15) {
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    const trimmedPhone = phoneNumber.trim();

    // Vérifier que le numéro n'est pas vide
    if (!trimmedPhone || trimmedPhone === "+") {
      showMessage({
        message: t("requiredFields"),
        description: t("phoneRequiredDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    // Vérifier que le format est valide
    if (!validatePhoneNumber(trimmedPhone)) {
      showMessage({
        message: t("invalidFormat"),
        description: t("phoneInvalidFormatInternational"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    // Vérifier si le numéro a changé
    if (currentPhone === trimmedPhone) {
      showMessage({
        message: t("noChanges"),
        description: t("phoneNoChangesDesc"),
        type: "info",
        icon: "info",
      });
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        { phoneNumber: trimmedPhone, updatedAt: new Date() },
        { merge: true }
      );

      showMessage({
        message: t("phoneNumberSaved"),
        description: t("phoneNumberUpdated"),
        type: "success",
        icon: "success",
      });

      if (newProfile) {
        navigation.navigate("EditLocation", { newProfile: true });
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      showMessage({
        message: t("error"),
        description: t("phoneSaveError"),
        type: "danger",
        icon: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t("phoneNumber"),
    });
  }, [navigation, t]);

  if (loading) {
    return <Loader />;
  }

  return (
   <SafeAreaView className="flex-1 bg-gray-50">
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    className="flex-1"
  >
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-5 pt-6 pb-32">
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="border-l-4 bg-blue-50 px-4 py-3 mb-8"
          style={{ borderLeftColor: COLORS.primary }}
        >
          <Text
            className="text-sm text-gray-700 leading-5 mb-2"
            style={{ fontFamily: "OpenSans_600SemiBold" }}
          >
            {t("phoneInternationalFormat")}
          </Text>
          <Text
            className="text-xs text-gray-600 leading-5"
            style={{ fontFamily: "OpenSans_400Regular" }}
          >
            {t("phoneInternationalExample")}
          </Text>
        </Animated.View>

        {currentPhone && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(50)}
            className="mb-6"
          >
            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-3">
              <MaterialIcons name="phone" size={20} color="#6B7280" />
              <View className="ml-3 flex-1">
                <Text
                  className="text-xs text-gray-500 mb-1 uppercase tracking-wider"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {t("currentNumber")}
                </Text>
                <Text
                  className="text-base text-gray-900"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {currentPhone}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          className="mb-5"
        >
          <Text
            className="text-xs text-gray-500 mb-3 uppercase tracking-wider"
            style={{ fontFamily: "OpenSans_600SemiBold" }}
          >
            {t("phoneNumber")} *
          </Text>

          <View
            className="bg-white border-2 rounded-xl px-4 py-4"
            style={{
              borderColor: phoneNumber && phoneNumber !== "+" && validatePhoneNumber(phoneNumber)
                ? '#10B981'
                : phoneNumber && phoneNumber !== "+"
                ? COLORS.primary + '40'
                : '#E5E7EB'
            }}
          >
            <TextInput
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              placeholder="+33612345678"
              placeholderTextColor="#9CA3AF"
              maxLength={16}
              className="text-base text-gray-900"
              style={{
                fontFamily: "OpenSans_600SemiBold",
                height: 40,
                paddingVertical: 0,
              }}
            />
          </View>

          {phoneNumber && phoneNumber !== "+" && !validatePhoneNumber(phoneNumber) && (
            <View className="flex-row items-center mt-2">
              <MaterialIcons name="info" size={16} color="#F59E0B" />
              <Text
                className="text-xs ml-2 text-amber-600"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                {t("phoneFormatHelp")}
              </Text>
            </View>
          )}

          {phoneNumber && validatePhoneNumber(phoneNumber) && (
            <View className="flex-row items-center mt-2">
              <MaterialIcons name="check-circle" size={16} color="#10B981" />
              <Text
                className="text-xs ml-2 text-emerald-600"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                {t("validFormat")} : {phoneNumber}
              </Text>
            </View>
          )}
        </Animated.View>
        <View className="mt-10">
          <Pressable
            disabled={saving}
            onPress={handleSave}
            className="py-4 items-center flex-row justify-center"
            style={{
              backgroundColor: saving ? "#D1D5DB" : COLORS.primary,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="check" size={18} color="#fff" />
                <Text
                  className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  {newProfile ? t("continue") : t("save")}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>

  );
}
