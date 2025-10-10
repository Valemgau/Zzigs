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
          
          // Pré-remplir l'indicatif et le numéro si existe
          if (normalized) {
            const { indicatif, phone } = extractIndicatifFromNumber(normalized);
            setFields(prev => ({
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
      // Toujours commencer par +
      if (!value.startsWith("+")) {
        value = "+" + value.replace(/\+/g, "");
      }
      // Autoriser uniquement + au début et chiffres
      if (/^\+\d*$/.test(value) && value.length <= 5) {
        setFields((prev) => ({ ...prev, [key]: value }));
      }
    } else {
      // Pour phone et confirmPhone, uniquement des chiffres
      if (/^\d*$/.test(value)) {
        setFields((prev) => ({ ...prev, [key]: value }));
      }
    }
  };

  const normalizePhoneNumber = (phone) => {
    // Retirer tous les espaces, tirets, points
    return phone.replace(/[\s\-\.]/g, "");
  };

  const extractIndicatifFromNumber = (fullNumber) => {
    // Chercher l'indicatif dans le numéro complet
    for (let ind of INDICATIFS) {
      if (fullNumber.startsWith(ind.code)) {
        return {
          indicatif: ind.code,
          phone: fullNumber.substring(ind.code.length),
        };
      }
    }
    // Si pas trouvé, supposer +33 par défaut
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

    // Vérifier que l'indicatif commence bien par +
    if (!indicatif.startsWith("+")) {
      showMessage({
        message: "Indicatif invalide",
        description: "L'indicatif doit commencer par +",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    // Vérifier que l'indicatif a au moins 2 caractères (+X)
    if (indicatif.length < 2) {
      showMessage({
        message: "Indicatif invalide",
        description: "Veuillez saisir un indicatif valide (ex: +33)",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (!phoneTrim || !confirmTrim) {
      showMessage({
        message: "Champs requis",
        description: "Merci de renseigner et confirmer votre numéro.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (!validatePhone(phoneTrim) || !validatePhone(confirmTrim)) {
      showMessage({
        message: "Format invalide",
        description: "Le numéro doit contenir uniquement des chiffres.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (phoneTrim.length < 6 || phoneTrim.length > 16) {
      showMessage({
        message: "Longueur incorrecte",
        description: "Le numéro doit contenir entre 6 et 16 chiffres.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (phoneTrim !== confirmTrim) {
      showMessage({
        message: "Numéros différents",
        description: "Les numéros saisis ne correspondent pas.",
        type: "danger",
        icon: "danger",
      });
      return;
    }

    const finalPhone = indicatif + phoneTrim;
    const normCurrentPhone = normalizePhoneNumber(currentPhone || "");

    if (normCurrentPhone === finalPhone) {
      showMessage({
        message: "Aucun changement",
        description: "Le numéro est identique à l'actuel.",
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
        message: "Numéro enregistré",
        description: "Votre numéro de téléphone a été mis à jour.",
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
        message: "Erreur",
        description: "Impossible de sauvegarder le numéro.",
        type: "danger",
        icon: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Numéro de téléphone",
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
                Votre numéro sera visible par les clients pour faciliter la communication
              </Text>
            </Animated.View>

            {/* Numéro actuel */}
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
                      Numéro actuel
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

            {/* Indicatif */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(100)}
              className="mb-5"
            >
              <Text
                className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                Indicatif téléphonique
              </Text>
              <View className="bg-white border border-gray-200 px-4 py-3">
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
              {/* Liste d'indicatifs courants */}
              <View className="flex-row flex-wrap mt-2 gap-2">
                {INDICATIFS.map((ind) => (
                  <Pressable
                    key={ind.code}
                    onPress={() => handleFieldChange("indicatif", ind.code)}
                    className="px-3 py-1 bg-gray-100 border border-gray-200"
                    style={{
                      backgroundColor: fields.indicatif === ind.code 
                        ? COLORS.primary + "15" 
                        : "#F3F4F6",
                    }}
                  >
                    <Text
                      className="text-xs"
                      style={{ 
                        fontFamily: "OpenSans_600SemiBold",
                        color: fields.indicatif === ind.code 
                          ? COLORS.primary 
                          : "#6B7280",
                      }}
                    >
                      {ind.code} {ind.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Numéro */}
            <Animated.View
              entering={FadeInDown.duration(300).delay(150)}
              className="mb-5"
            >
              <Text
                className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                Numéro de téléphone *
              </Text>
              <View className="bg-white border border-gray-200 px-4 py-3">
                <TextInput
                  value={fields.phone}
                  onChangeText={(v) => handleFieldChange("phone", v)}
                  keyboardType="number-pad"
                  maxLength={16}
                  placeholder="612345678"
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

            {/* Confirmation */}
            {fields.phone.trim().length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(200)}
                className="mb-5"
              >
                <Text
                  className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  Confirmer le numéro *
                </Text>
                <View className="bg-white border border-gray-200 px-4 py-3">
                  <TextInput
                    value={fields.confirmPhone}
                    onChangeText={(v) => handleFieldChange("confirmPhone", v)}
                    keyboardType="number-pad"
                    maxLength={16}
                    placeholder="612345678"
                    placeholderTextColor="#9CA3AF"
                    className="text-sm text-gray-900"
                    style={{ 
                      fontFamily: "OpenSans_400Regular", 
                      height: 36,
                      paddingVertical: 0,
                    }}
                  />
                </View>
                {/* Indicateur de correspondance */}
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
                        ? "Les numéros correspondent"
                        : "Les numéros ne correspondent pas"}
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}

            {/* Aperçu du numéro final */}
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
                  Aperçu
                </Text>
                <Text
                  className="text-base font-semibold"
                  style={{
                    fontFamily: "OpenSans_700Bold",
                    color: COLORS.primary,
                  }}
                >
                  {fields.indicatif}{fields.phone}
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