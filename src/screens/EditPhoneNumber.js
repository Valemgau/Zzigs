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

const INDICATIFS = [
  { code: "+33", label: "France" },
  { code: "+1", label: "USA/Canada" },
  { code: "+44", label: "UK" },
  { code: "+32", label: "Belgique" },
  { code: "+41", label: "Suisse" },
];

export default function EditPhoneNumber({ route }) {
  const { newProfile } = route?.params || {};
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [fields, setFields] = useState({
    indicatif: "+33",
    phone: "",
    confirmPhone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPhone, setCurrentPhone] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) {
          const phoneNumber = snap.data().phoneNumber || "";
          const normalized = normalizePhoneNumber(phoneNumber);
          setCurrentPhone(normalized);

          if (normalized) {
            const { indicatif, phone } = extractIndicatifFromNumber(normalized);
            setFields((prev) => ({
              ...prev,
              indicatif: indicatif,
              phone: phone,
            }));
          }
        }
      } catch (error) {
        console.error("Erreur chargement:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFieldChange = (key, value) => {
    if (key === "indicatif") {
      if (!value.startsWith("+")) {
        value = "+" + value.replace(/\+/g, "");
      }
      if (/^\+\d*$/.test(value) && value.length <= 5) {
        setFields((prev) => ({ ...prev, [key]: value }));
      }
    } else {
      if (/^\d*$/.test(value)) {
        setFields((prev) => ({ ...prev, [key]: value }));
      }
    }
  };

  const normalizePhoneNumber = (phone) => {
    return phone.replace(/[\s\-\.]/g, "");
  };

  const extractIndicatifFromNumber = (fullNumber) => {
    for (let ind of INDICATIFS) {
      if (fullNumber.startsWith(ind.code)) {
        return {
          indicatif: ind.code,
          phone: fullNumber.substring(ind.code.length),
        };
      }
    }
    if (fullNumber.startsWith("+")) {
      const match = fullNumber.match(/^(\+\d{1,3})/);
      if (match) {
        return {
          indicatif: match[1],
          phone: fullNumber.substring(match[1].length),
        };
      }
    }
    return { indicatif: "+33", phone: fullNumber };
  };

  const validatePhone = (value) => /^\d+$/.test(value);

  const handleSave = async () => {
    const indicatif = fields.indicatif.trim();
    const phoneTrim = fields.phone.trim();
    const confirmTrim = fields.confirmPhone.trim();

    if (!indicatif.startsWith("+")) {
      showMessage({
        message: t("invalidIndicatif"),
        description: t("invalidIndicatifDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (indicatif.length < 2) {
      showMessage({
        message: t("invalidIndicatif"),
        description: t("invalidIndicatifDesc2"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (!phoneTrim || !confirmTrim) {
      showMessage({
        message: t("requiredFields"),
        description: t("phoneRequiredDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (!validatePhone(phoneTrim) || !validatePhone(confirmTrim)) {
      showMessage({
        message: t("invalidFormat"),
        description: t("phoneInvalidFormatDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (phoneTrim.length < 6 || phoneTrim.length > 16) {
      showMessage({
        message: t("incorrectLength"),
        description: t("phoneLengthDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (phoneTrim !== confirmTrim) {
      showMessage({
        message: t("phonesMismatch"),
        description: t("phonesMismatchDesc"),
        type: "danger",
        icon: "danger",
      });
      return;
    }

    const finalPhone = indicatif + phoneTrim;
    const normCurrentPhone = normalizePhoneNumber(currentPhone || "");

    if (normCurrentPhone === finalPhone) {
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
        { phoneNumber: finalPhone, updatedAt: new Date() },
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
          className="border-l-4 bg-gray-50 px-4 py-3 mb-8"
          style={{ borderLeftColor: COLORS.secondary }}
        >
          <Text
            className="text-sm text-gray-700 leading-5"
            style={{ fontFamily: "OpenSans_400Regular" }}
          >
            {t("phoneInfo")}
          </Text>
        </Animated.View>

        {currentPhone && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(50)}
            className="mb-6"
          >
            <View className="flex-row items-center bg-white border border-gray-200 px-4 py-3">
              <MaterialIcons name="phone" size={18} color="#6B7280" />
              <View className="ml-3 flex-1">
                <Text
                  className="text-xs text-gray-500 mb-1 uppercase tracking-wider"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {t("currentNumber")}
                </Text>
                <Text
                  className="text-sm text-gray-900"
                  style={{ fontFamily: "OpenSans_400Regular" }}
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
            className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
            style={{ fontFamily: "OpenSans_600SemiBold" }}
          >
            {t("phoneNumber")} *
          </Text>
          <View className="flex-row gap-2">
            <View className="bg-white border border-gray-200 px-4 py-3" style={{ width: 80 }}>
              <TextInput
                value={fields.indicatif}
                onChangeText={(v) => handleFieldChange("indicatif", v)}
                keyboardType="phone-pad"
                placeholder="+33"
                placeholderTextColor="#9CA3AF"
                maxLength={5}
                className="text-sm text-gray-900"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  height: 36,
                  paddingVertical: 0,
                }}
              />
            </View>
            <View className="flex-1 bg-white border border-gray-200 px-4 py-3">
              <TextInput
                value={fields.phone}
                onChangeText={(v) => handleFieldChange("phone", v)}
                keyboardType="number-pad"
                maxLength={16}
                placeholder={t("phoneNumberPlaceholder")}
                placeholderTextColor="#9CA3AF"
                className="text-sm text-gray-900"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  height: 36,
                  paddingVertical: 0,
                }}
              />
            </View>
          </View>
        </Animated.View>

        {fields.phone.trim().length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(200)}
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("confirmNumber")} *
            </Text>
            <View className="bg-white border border-gray-200 px-4 py-3">
              <TextInput
                value={fields.confirmPhone}
                onChangeText={(v) => handleFieldChange("confirmPhone", v)}
                keyboardType="number-pad"
                maxLength={16}
                placeholder={t("phoneNumberPlaceholder")}
                placeholderTextColor="#9CA3AF"
                className="text-sm text-gray-900"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  height: 36,
                  paddingVertical: 0,
                }}
              />
            </View>
            {fields.confirmPhone.length > 0 && (
              <View className="flex-row items-center mt-2">
                <MaterialIcons
                  name={
                    fields.phone === fields.confirmPhone
                      ? "check-circle"
                      : "error"
                  }
                  size={16}
                  color={
                    fields.phone === fields.confirmPhone
                      ? "#10B981"
                      : "#EF4444"
                  }
                />
                <Text
                  className="text-xs ml-2"
                  style={{
                    fontFamily: "OpenSans_400Regular",
                    color:
                      fields.phone === fields.confirmPhone
                        ? "#10B981"
                        : "#EF4444",
                  }}
                >
                  {fields.phone === fields.confirmPhone
                    ? t("numbersMatch")
                    : t("numbersNoMatch")}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {fields.phone.trim().length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(250)}
            className="bg-blue-50 border-l-4 px-4 py-3"
            style={{ borderLeftColor: COLORS.primary }}
          >
            <Text
              className="text-xs text-gray-600 mb-1 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("preview")}
            </Text>
            <Text
              className="text-base font-semibold"
              style={{
                fontFamily: "OpenSans_700Bold",
                color: COLORS.primary,
              }}
            >
              {fields.indicatif}
              {fields.phone}
            </Text>
          </Animated.View>
        )}
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
