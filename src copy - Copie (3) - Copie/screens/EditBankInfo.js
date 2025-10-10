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
import { CommonActions } from "@react-navigation/native";

export default function EditBankInfo({ route }) {
  const { newProfile } = route?.params || {};
  const navigation = useNavigation();

  const [fields, setFields] = useState({
    iban: "",
    bankName: "",
    bankAccountNumber: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentData, setCurrentData] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          const bankData = {
            iban: data.iban || "",
            bankName: data.bankName || "",
            bankAccountNumber: data.bankAccountNumber || "",
          };
          setCurrentData(bankData);
          setFields(bankData);
        }
      } catch (error) {
        console.error("Erreur chargement:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFieldChange = (key, value) => {
    if (key === "iban") {
      // Format IBAN : majuscules, espaces tous les 4 caractères
      const cleaned = value.replace(/\s/g, "").toUpperCase();
      if (/^[A-Z0-9]*$/.test(cleaned) && cleaned.length <= 34) {
        setFields((prev) => ({ ...prev, [key]: cleaned }));
      }
    } else {
      setFields((prev) => ({ ...prev, [key]: value }));
    }
  };

  const formatIBAN = (iban) => {
    return iban.replace(/(.{4})/g, "$1 ").trim();
  };

  const validateIBAN = (iban) => {
    // Vérification basique : commence par 2 lettres + min 15 caractères
    if (iban.length < 15 || iban.length > 34) return false;
    if (!/^[A-Z]{2}[0-9]{2}/.test(iban)) return false;
    return true;
  };

  const hasChanges = () => {
    return (
      fields.iban !== currentData.iban ||
      fields.bankName !== currentData.bankName ||
      fields.bankAccountNumber !== currentData.bankAccountNumber
    );
  };

  const handleSave = async () => {
    const ibanTrim = fields.iban.trim();
    const bankNameTrim = fields.bankName.trim();
    const accountTrim = fields.bankAccountNumber.trim();

    if (!ibanTrim && !bankNameTrim && !accountTrim) {
      showMessage({
        message: "Champs vides",
        description: "Veuillez remplir au moins un champ",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (ibanTrim && !validateIBAN(ibanTrim)) {
      showMessage({
        message: "IBAN invalide",
        description: "L'IBAN doit commencer par 2 lettres, 2 chiffres et contenir 15-34 caractères",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (!hasChanges()) {
      showMessage({
        message: "Aucun changement",
        description: "Les informations sont identiques",
        type: "info",
        icon: "info",
      });
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          iban: ibanTrim,
          bankName: bankNameTrim,
          bankAccountNumber: accountTrim,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      showMessage({
        message: "Informations enregistrées",
        description: "Vos coordonnées bancaires ont été mises à jour",
        type: "success",
        icon: "success",
      });

     
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      showMessage({
        message: "Erreur",
        description: "Impossible de sauvegarder les informations",
        type: "danger",
        icon: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Coordonnées bancaires",
    });
  }, [navigation]);

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
            {/* Info Header */}
            <Animated.View
              entering={FadeInDown.duration(300)}
              className="border-l-4 bg-gray-50 px-4 py-3 mb-8"
              style={{ borderLeftColor: COLORS.secondary }}
            >
              <Text
                className="text-sm text-gray-700 leading-5"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                Ces informations sont nécessaires pour recevoir vos paiements
              </Text>
            </Animated.View>

            {/* Données actuelles */}
            {(currentData.iban || currentData.bankName || currentData.bankAccountNumber) && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(50)}
                className="mb-6"
              >
                <View className="bg-white border border-gray-200 px-4 py-3">
                  <Text
                    className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                  >
                    Informations actuelles
                  </Text>
                  {currentData.iban && (
                    <View className="flex-row items-center mb-2">
                      <MaterialIcons name="account-balance" size={16} color="#6B7280" />
                      <Text
                        className="text-sm text-gray-900 ml-2"
                        style={{ fontFamily: "OpenSans_400Regular" }}
                      >
                        {formatIBAN(currentData.iban)}
                      </Text>
                    </View>
                  )}
                  {currentData.bankName && (
                    <View className="flex-row items-center mb-2">
                      <MaterialIcons name="business" size={16} color="#6B7280" />
                      <Text
                        className="text-sm text-gray-900 ml-2"
                        style={{ fontFamily: "OpenSans_400Regular" }}
                      >
                        {currentData.bankName}
                      </Text>
                    </View>
                  )}
                  {currentData.bankAccountNumber && (
                    <View className="flex-row items-center">
                      <MaterialIcons name="confirmation-number" size={16} color="#6B7280" />
                      <Text
                        className="text-sm text-gray-900 ml-2"
                        style={{ fontFamily: "OpenSans_400Regular" }}
                      >
                        {currentData.bankAccountNumber}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}

            {/* IBAN */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(100)}
              className="mb-5"
            >
              <Text
                className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                IBAN
              </Text>
              <View className="bg-white border border-gray-200 px-4 py-3">
                <TextInput
                  value={fields.iban}
                  onChangeText={(v) => handleFieldChange("iban", v)}
                  placeholder="FR7612345678901234567890123"
                  placeholderTextColor="#9CA3AF"
                  maxLength={34}
                  autoCapitalize="characters"
                  className="text-sm text-gray-900"
                  style={{
                    fontFamily: "OpenSans_400Regular",
                    height: 36,
                    paddingVertical: 0,
                  }}
                />
              </View>
              {fields.iban.length > 0 && (
                <View className="flex-row items-center mt-2">
                  <MaterialIcons
                    name={validateIBAN(fields.iban) ? "check-circle" : "error"}
                    size={16}
                    color={validateIBAN(fields.iban) ? "#10B981" : "#EF4444"}
                  />
                  <Text
                    className="text-xs ml-2"
                    style={{
                      fontFamily: "OpenSans_400Regular",
                      color: validateIBAN(fields.iban) ? "#10B981" : "#EF4444",
                    }}
                  >
                    {validateIBAN(fields.iban)
                      ? "Format IBAN valide"
                      : "Format IBAN invalide"}
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Nom de la banque */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(150)}
              className="mb-5"
            >
              <Text
                className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                Nom de la banque
              </Text>
              <View className="bg-white border border-gray-200 px-4 py-3">
                <TextInput
                  value={fields.bankName}
                  onChangeText={(v) => handleFieldChange("bankName", v)}
                  placeholder="Banque Populaire"
                  placeholderTextColor="#9CA3AF"
                  className="text-sm text-gray-900"
                  style={{
                    fontFamily: "OpenSans_400Regular",
                    height: 36,
                    paddingVertical: 0,
                  }}
                />
              </View>
            </Animated.View>

            {/* Numéro de compte */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(200)}
              className="mb-5"
            >
              <Text
                className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                Numéro de compte bancaire
              </Text>
              <View className="bg-white border border-gray-200 px-4 py-3">
                <TextInput
                  value={fields.bankAccountNumber}
                  onChangeText={(v) => handleFieldChange("bankAccountNumber", v)}
                  placeholder="12345678901234567890"
                  placeholderTextColor="#9CA3AF"
                  className="text-sm text-gray-900"
                  style={{
                    fontFamily: "OpenSans_400Regular",
                    height: 36,
                    paddingVertical: 0,
                  }}
                />
              </View>
            </Animated.View>

            {/* Aperçu formaté IBAN */}
            {fields.iban.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(250)}
                className="bg-blue-50 border-l-4 px-4 py-3"
                style={{ borderLeftColor: COLORS.primary }}
              >
                <Text
                  className="text-xs text-gray-600 mb-1 uppercase tracking-wider"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  Aperçu IBAN formaté
                </Text>
                <Text
                  className="text-base font-semibold"
                  style={{
                    fontFamily: "OpenSans_700Bold",
                    color: COLORS.primary,
                  }}
                >
                  {formatIBAN(fields.iban)}
                </Text>
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* Bouton fixe */}
        <View
          className="absolute bottom-0 left-0 right-0 px-5 py-4"
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
                  {newProfile ? "Continuer" : "Enregistrer"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
