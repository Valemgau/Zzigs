import React, { useState, useLayoutEffect, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { COLORS } from "../styles/colors";
import { API_URL } from "@env";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import { auth } from "../../config/firebase";
import { useTranslation } from "react-i18next";

export default function ContactUs({ navigation }) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [message, setMessage] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const SUBJECTS = t("contactSubjects", { returnObjects: true });

  useEffect(() => {
    if (auth.currentUser) {
      setUserEmail(auth.currentUser.email || "");
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t("contactUsTitle"),
    });
  }, [navigation]);

  const handleSelectSubject = (value) => {
    setSubject(value);
    setShowPicker(false);
    if (value !== t("other")) setCustomSubject("");
  };

  const isFormValid = () => {
    const hasSubject =
      subject && (subject !== t("other") || customSubject.trim());
    const hasMessage = message.trim().length > 0;
    return hasSubject && hasMessage;
  };

  const handleSend = async () => {
    if (!isFormValid()) return;

    setSending(true);

    const finalSubject =
      subject === t("other") ? customSubject.trim() : subject;
    console.log(API_URL);
    try {
      const response = await fetch(`${API_URL}/contact.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          subject: finalSubject,
          message: message.trim(),
          colors: {
            primary: COLORS.primary,
            secondary: COLORS.secondary,
          },
        }),
      });

      const data = await response.json();

      // Log détaillé de la réponse
      console.log("Status:", response.status);
      console.log("Response OK:", response.ok);
      console.log("Response data:", JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        showMessage({
          message: t("messageSent"),
          description: t("messageSentDesc"),
          type: "success",
          icon: "success",
          duration: 4000,
        });

        setSubject("");
        setCustomSubject("");
        setMessage("");

        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        // Log erreur serveur détaillé
        console.error("Erreur serveur:", {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: data,
        });

        showMessage({
          message: t("error"),
          description: data.error || t("sendMessageError"),
          type: "danger",
          icon: "danger",
        });
      }
    } catch (error) {
      // Log détaillé de l'erreur
      console.error("Erreur complète:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause,
      });
      console.error(
        "Error object:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      );

      showMessage({
        message: t("networkError"),
        description: t("serverConnectionError"),
        type: "danger",
        icon: "danger",
      });
    } finally {
      setSending(false);
    }
  };

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
                {t("contactIntro")}
              </Text>
            </Animated.View>

            {userEmail && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(50)}
                className="mb-6"
              >
                <View className="bg-white border border-gray-200 px-4 py-3 flex-row items-center">
                  <MaterialIcons name="email" size={18} color="#6B7280" />
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-xs text-gray-500 mb-1 uppercase tracking-wider"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("yourEmail")}
                    </Text>
                    <Text
                      className="text-sm text-gray-900"
                      style={{ fontFamily: "OpenSans_400Regular" }}
                    >
                      {userEmail}
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
                {t("subject")} *
              </Text>
              <Pressable
                onPress={() => setShowPicker(true)}
                className="bg-white border border-gray-200 px-4 py-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <MaterialIcons
                    name={
                      subject
                        ? SUBJECTS.find((s) => s.label === subject)?.icon ||
                          "info"
                        : "chevron-right"
                    }
                    size={18}
                    color={subject ? COLORS.primary : "#9CA3AF"}
                  />
                  <Text
                    className="text-sm ml-3"
                    style={{
                      fontFamily: "OpenSans_400Regular",
                      color: subject ? COLORS.primary : "#9CA3AF",
                    }}
                  >
                    {subject || t("selectSubject")}
                  </Text>
                </View>
                <MaterialIcons
                  name="arrow-drop-down"
                  size={24}
                  color="#9CA3AF"
                />
              </Pressable>
            </Animated.View>

            <Modal visible={showPicker} transparent animationType="fade">
              <TouchableOpacity
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                className="flex-1 justify-center items-center"
                activeOpacity={1}
                onPress={() => setShowPicker(false)}
              >
                <View className="bg-white rounded w-[85%] max-w-md overflow-hidden">
                  <View
                    className="px-5 py-4 border-b border-gray-200"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <Text
                      className="text-white text-base"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("chooseSubject")}
                    </Text>
                  </View>
                  {SUBJECTS.map((s, i) => (
                    <TouchableOpacity
                      key={s.id}
                      className={`px-5 py-4 flex-row items-center ${
                        i < SUBJECTS.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                      onPress={() => handleSelectSubject(s.label)}
                      style={{
                        backgroundColor:
                          subject === s.label ? COLORS.primary + "10" : "#fff",
                      }}
                    >
                      <MaterialIcons
                        name={s.icon}
                        size={20}
                        color={subject === s.label ? COLORS.primary : "#6B7280"}
                      />
                      <Text
                        className="text-base ml-3 flex-1"
                        style={{
                          fontFamily: "OpenSans_400Regular",
                          color:
                            subject === s.label ? COLORS.primary : "#374151",
                        }}
                      >
                        {s.label}
                      </Text>
                      {subject === s.label && (
                        <MaterialIcons
                          name="check"
                          size={20}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>

            {subject === t("other") && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(150)}
                className="mb-5"
              >
                <Text
                  className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {t("specifySubject")} *
                </Text>
                <View className="bg-white border border-gray-200 px-4 py-3">
                  <TextInput
                    value={customSubject}
                    onChangeText={(txt) =>
                      txt.length <= 100 && setCustomSubject(txt)
                    }
                    maxLength={100}
                    placeholder={t("specifySubjectPlaceholder")}
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
                  className="text-xs text-gray-400 text-right mt-1"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  {customSubject.length}/100
                </Text>
              </Animated.View>
            )}

            <Animated.View
              entering={FadeInDown.duration(300).delay(200)}
              className="mb-5"
            >
              <Text
                className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                {t("yourMessage")} *
              </Text>
              <View className="bg-white border border-gray-200 px-4 py-3">
                <TextInput
                  value={message}
                  onChangeText={(txt) => txt.length <= 500 && setMessage(txt)}
                  maxLength={500}
                  placeholder={t("messagePlaceholder")}
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
                className="text-xs text-gray-400 text-right mt-1"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                {message.length}/500
              </Text>
            </Animated.View>

            {isFormValid() && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(250)}
                className="bg-blue-50 border-l-4 px-4 py-3"
                style={{ borderLeftColor: COLORS.primary }}
              >
                <Text
                  className="text-xs text-gray-600 mb-2 uppercase tracking-wider"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {t("summary")}
                </Text>
                <View className="space-y-1">
                  <Text
                    className="text-xs text-gray-700"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                  >
                    <Text style={{ fontFamily: "OpenSans_600SemiBold" }}>
                      {t("subject")}:{" "}
                    </Text>
                    {subject === t("other") ? customSubject : subject}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        </ScrollView>

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
            disabled={sending || !isFormValid()}
            onPress={handleSend}
            className="py-4 items-center flex-row justify-center"
            style={{
              backgroundColor:
                sending || !isFormValid() ? "#D1D5DB" : COLORS.primary,
            }}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="send" size={18} color="#fff" />
                <Text
                  className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  {t("send")}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
