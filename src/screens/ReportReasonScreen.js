import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import { showMessage } from "react-native-flash-message";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";

// Si tu utilises @react-native-picker/picker
import { Picker } from "@react-native-picker/picker";

const REASON_OPTIONS = [
  { label: "Spam ou publicité", value: "spam" },
  { label: "Evénement frauduleux", value: "fraud" },
  { label: "Propos inappropriés", value: "inappropriate" },
  { label: "Fausse information", value: "misinformation" },
  { label: "Autre raison", value: "other" },
];

const ReportReasonScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { activityId } = route.params;
  const [selectedReason, setSelectedReason] = useState(REASON_OPTIONS[0].value);
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitReport = async () => {
    let reason = selectedReason !== "other"
      ? REASON_OPTIONS.find(opt => opt.value === selectedReason)?.label
      : otherReason.trim();

    if (!reason) {
      Alert.alert("Erreur", "Merci d'indiquer une raison.");
      return;
    }

    setLoading(true);

    try {
      const user = auth().currentUser;
      if (!user) throw new Error("Utilisateur non connecté.");

      await firestore().collection("reports").add({
        userId: user.uid,
        activityId,
        reason,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      showMessage({
        message: "Merci d'avoir signalé cet événement.",
        type: "success",
      });

      navigation.goBack();
    } catch (error) {
      showMessage({
        message: "Erreur lors de l'envoi du signalement.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
   
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
        className="bg-white dark:bg-gray-900"
      >
        <Animated.View
          entering={FadeInDown.duration(100)}
          className="flex-1 px-6 pt-8"
        >
          {/* Header */}
          <View className="mb-8 flex-row items-center">
           
            <Text
              className="text-2xl font-bold text-gray-900 dark:text-white"
              style={{ fontFamily: "Inter_700Bold" }}
            >
              {i18n.t("signaler_evenement")}
            </Text>
          </View>

          {/* Select raison */}
          <View className="mb-6">
            <Text
              className="text-lg text-gray-800 dark:text-gray-200 mb-3"
              style={{ fontFamily: "Inter_500Medium" }}
            >
              {i18n.t("pourquoi_signalez_vous")}
            </Text>
            <View className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 mb-2">
              <Picker
                selectedValue={selectedReason}
                onValueChange={setSelectedReason}
                enabled={!loading}
                dropdownIconColor="#6B7280"
                style={{
                  color: "#111827",
                  fontFamily: "Inter_400Regular",
                  minHeight: 48,
                  paddingLeft: 6,
                  ...(Platform.OS === "android" && { color: "#111827" }),
                }}
              >
                {REASON_OPTIONS.map(opt => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>

            {selectedReason === "other" && (
              <TextInput
                style={{
                  fontFamily: "Inter_400Regular",
                  height: 100,
                  marginTop: 8,
                  paddingTop: 14,
                }}
                placeholder="Explique brièvement le problème..."
                placeholderTextColor="#9CA3AF"
                value={otherReason}
                onChangeText={setOtherReason}
                multiline
                numberOfLines={5}
                className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-base rounded-xl px-4 pb-2 border border-gray-300 dark:border-gray-700"
                maxLength={400}
                editable={!loading}
              />
            )}
          </View>

          <Pressable
            onPress={handleSubmitReport}
            disabled={loading || (selectedReason === "other" && !otherReason.trim())}
            style={{
              backgroundColor: COLORS.primary,
              opacity: loading || (selectedReason === "other" && !otherReason.trim()) ? 0.6 : 1,
            }}
            className="bg-red-500 py-3 rounded-xl flex-row items-center justify-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white font-semibold text-lg" style={{ fontFamily: "Inter_600SemiBold" }}>
                  {i18n.t("OK")}
                </Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollView>
  
  );
};

export default ReportReasonScreen;
