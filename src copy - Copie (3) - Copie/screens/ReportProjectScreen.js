import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";

const SUBJECTS = [
  "Contenu inapproprié",
  "Spam ou publicité",
  "Comportement abusif",
  "Autre",
];

export default function ReportProjectScreen({ route, navigation }) {
  const { projectId } = route.params;
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [sending, setSending] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Signaler",
    });
  }, [navigation]);

  const handleSelectSubject = (value) => {
    setSubject(value);
    setShowPicker(false);
    if (value !== "Autre") setCustomSubject("");
  };

  const handleSend = async () => {
    if (!subject || !message.trim() || (subject === "Autre" && !customSubject.trim())) {
      showMessage({
        message: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    setSending(true);

    try {
      await addDoc(collection(db, "reports"), {
        projectId,
        subject: subject === "Autre" ? customSubject.trim() : subject,
        message: message.trim(),
        createdAt: serverTimestamp(),
        status: "pending",
        userId: auth.currentUser.uid,
      });

      showMessage({
        message: "Signalement envoyé",
        description: "Merci, nous allons étudier votre signalement.",
        type: "success",
        icon: "success",
      });

      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error("Erreur signalement:", error);
      showMessage({
        message: "Erreur",
        description: "Impossible d'envoyer le signalement.",
        type: "danger",
        icon: "danger",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="px-5 pt-6">
          {/* Info Header */}
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="border-l-4 bg-gray-50 px-4 py-3 mb-8"
            style={{ borderLeftColor: "#EF4444" }}
          >
            <Text
              className="text-sm text-gray-700 leading-5"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              Aidez-nous à maintenir une communauté sûre en signalant les contenus inappropriés
            </Text>
          </Animated.View>

          {/* Sujet */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(50)}
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              Motif du signalement *
            </Text>
            <Pressable
              onPress={() => setShowPicker(true)}
              className="bg-white border border-gray-200 px-4 py-3 flex-row justify-between items-center"
              style={{ height: 48 }}
            >
              <Text
                className="text-sm"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  color: subject ? "#111827" : "#9CA3AF",
                }}
              >
                {subject || "Sélectionner un motif"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
            </Pressable>
          </Animated.View>

          {/* Sujet personnalisé */}
          {subject === "Autre" && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(100)}
              className="mb-5"
            >
              <Text
                className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                Précisez le motif *
              </Text>
              <View className="bg-white border border-gray-200 px-4 py-3">
                <TextInput
                  value={customSubject}
                  onChangeText={(txt) => txt.length <= 100 ? setCustomSubject(txt) : null}
                  maxLength={100}
                  placeholder="Décrivez le motif"
                  placeholderTextColor="#9CA3AF"
                  className="text-sm text-gray-900"
                  style={{
                    fontFamily: "OpenSans_400Regular",
                    height: 36,
                    paddingVertical: 0,
                  }}
                />
              </View>
              <Text
                className="text-xs text-gray-500 text-right mt-1"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                {customSubject.length}/100
              </Text>
            </Animated.View>
          )}

          {/* Message */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(subject === "Autre" ? 150 : 100)}
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              Description détaillée *
            </Text>
            <View className="bg-white border border-gray-200 px-4 py-3">
              <TextInput
                value={message}
                onChangeText={(txt) => txt.length <= 500 ? setMessage(txt) : null}
                maxLength={500}
                placeholder="Expliquez le problème en détail"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="text-sm text-gray-900"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  minHeight: 120,
                }}
              />
            </View>
            <Text
              className="text-xs text-gray-500 text-right mt-1"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              {message.length}/500
            </Text>
          </Animated.View>

          {/* Info sécurité */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(subject === "Autre" ? 200 : 150)}
            className="bg-amber-50 border-l-4 px-4 py-3"
            style={{ borderLeftColor: "#F59E0B" }}
          >
            <Text
              className="text-xs font-bold mb-1"
              style={{
                fontFamily: "OpenSans_700Bold",
                color: "#92400E",
              }}
            >
              Confidentialité
            </Text>
            <Text
              className="text-xs text-gray-700"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              Votre signalement est anonyme. L'auteur du projet ne sera pas informé de votre identité.
            </Text>
          </Animated.View>
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
          onPress={handleSend}
          disabled={
            sending ||
            !subject ||
            (subject === "Autre" && !customSubject.trim()) ||
            !message.trim()
          }
          className="py-4 items-center flex-row justify-center"
          style={{
            backgroundColor:
              sending ||
              !subject ||
              (subject === "Autre" && !customSubject.trim()) ||
              !message.trim()
                ? "#D1D5DB"
                : "#EF4444",
          }}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialIcons name="flag" size={18} color="#fff" />
              <Text
                className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                Envoyer le signalement
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Modal Picker */}
      <Modal visible={showPicker} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPressOut={() => setShowPicker(false)}
        >
          <View className="bg-white mx-6 w-full max-w-sm">
            {SUBJECTS.map((s, i) => (
              <TouchableOpacity
                key={s}
                className="px-5 py-4 border-b border-gray-100"
                onPress={() => handleSelectSubject(s)}
                style={{
                  borderBottomWidth: i < SUBJECTS.length - 1 ? 1 : 0,
                }}
              >
                <Text
                  className="text-base"
                  style={{
                    fontFamily: "OpenSans_600SemiBold",
                    color: subject === s ? COLORS.primary : "#374151",
                  }}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}