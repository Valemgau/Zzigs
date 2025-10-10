import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  Animated,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { auth, db } from "../../config/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { COLORS } from "../styles/colors";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { showMessage } from "react-native-flash-message";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function FaireOffreScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { projectId, authorId } = route.params;

  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [isFocusedPrice, setIsFocusedPrice] = useState(false);
  const [isFocusedMessage, setIsFocusedMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const priceInputRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable 
          onPress={handleSubmit} 
          disabled={!price || !message.trim() || isSubmitting}
          className="mr-4 p-2"
          style={{ opacity: !price || !message.trim() || isSubmitting ? 0.5 : 1 }}
        >
          <Text
            style={{ fontFamily: "OpenSans_700Bold" }}
            className="text-white font-bold"
          >
            {isSubmitting ? "..." : t("validate")}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, price, message, isSubmitting, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (priceInputRef.current) priceInputRef.current.focus();
    }, 350);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!price) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [price]);

  const formatPrice = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    return cleaned;
  };

  const handlePriceChange = (text) => {
    const formatted = formatPrice(text);
    setPrice(formatted);
  };

  const handleSubmit = async () => {
    if (!price) {
      showMessage({
        message: t("priceRequired"),
        description: t("priceRequiredDesc"),
        type: "warning",
        icon: "warning",
        duration: 3000,
      });
      return;
    }

    if (parseFloat(price) <= 0) {
      showMessage({
        message: t("invalidPrice"),
        description: t("invalidPriceDesc"),
        type: "danger",
        icon: "danger",
        duration: 3000,
      });
      return;
    }

    if (!message.trim()) {
      showMessage({
        message: t("messageRequired"),
        description: t("messageRequiredDesc"),
        type: "warning",
        icon: "warning",
        duration: 3000,
      });
      return;
    }

    if (message.trim().length < 20) {
      showMessage({
        message: t("messageTooShort"),
        description: t("messageTooShortDesc"),
        type: "warning",
        icon: "warning",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "offers"), {
        projectId,
        authorId,
        userId: auth?.currentUser?.uid,
        price: parseFloat(price),
        message: message.trim(),
        createdAt: serverTimestamp(),
        status: "pending",
      });

      try {
        const authorDoc = await getDoc(doc(db, "users", authorId));
        
        if (authorDoc.exists()) {
          const authorData = authorDoc.data();
          const expoPushToken = authorData.expoPushToken;

          if (expoPushToken) {
            await sendPushNotification(expoPushToken, parseFloat(price));
          }
        }
      } catch (notifError) {
        console.warn("Notification error:", notifError);
      }
      
      showMessage({
        message: t("offerSent"),
        description: t("offerSentDesc"),
        type: "success",
        icon: "success",
        duration: 3000,
      });
      
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      console.error("Error submitting offer:", error);
      showMessage({
        message: t("error"),
        description: t("offerSendError"),
        type: "danger",
        icon: "danger",
        duration: 3000,
      });
      setIsSubmitting(false);
    }
  };

  const sendPushNotification = async (expoPushToken, offerPrice) => {
    const message = {
      to: expoPushToken,
      sound: "default",
      title: t("newOfferNotificationTitle"),
      body: t("newOfferNotificationBody", { price: offerPrice }),
      data: { 
        type: "new_offer",
        projectId: String(projectId),
        price: String(offerPrice),
      },
      priority: "high",
      channelId: "offers",
    };

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const data = await response.json();
      
      if (data.data && data.data[0] && data.data[0].status === "error") {
        console.error("Push notification error:", data.data[0].message);
      } else {
        console.log("Push notification sent successfully");
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
      throw error;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={120}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={{ 
            flex: 1,
            opacity: fadeAnim,
            padding: 20,
          }}
        >
          <View className="items-center mb-8 mt-4">
            <View 
              className="bg-primary/10 rounded-full p-4 mb-4"
              style={{
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Ionicons name="pricetag" size={32} color={COLORS.primary} />
            </View>
            <Text
              style={{ fontFamily: "OpenSans_700Bold" }}
              className="text-2xl text-gray-900 mb-2 text-center"
            >
              {t("makeOffer")}
            </Text>
            <Text
              style={{ fontFamily: "OpenSans_400Regular" }}
              className="text-gray-500 text-sm text-center"
            >
              {t("makeOfferSubtitle")}
            </Text>
          </View>

          <Animated.View 
            style={{ 
              transform: [{ scale: pulseAnim }],
              marginBottom: 24,
            }}
          >
            <View
              className="bg-white rounded-3xl overflow-hidden"
              style={{
                shadowColor: isFocusedPrice ? COLORS.primary : "#000",
                shadowOffset: { width: 0, height: isFocusedPrice ? 8 : 4 },
                shadowOpacity: isFocusedPrice ? 0.25 : 0.08,
                shadowRadius: isFocusedPrice ? 16 : 8,
                elevation: isFocusedPrice ? 12 : 4,
                borderWidth: isFocusedPrice ? 2 : 0,
                borderColor: isFocusedPrice ? COLORS.primary : "transparent",
              }}
            >
              <View className="px-6 pt-6 pb-8">
                <Text
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                  className="text-gray-600 text-sm mb-3 uppercase tracking-wider"
                >
                  {t("yourOffer")}
                </Text>
                
                <View className="flex-row items-baseline">
                  <TextInput
                    ref={priceInputRef}
                    keyboardType="decimal-pad"
                    value={price}
                    onChangeText={handlePriceChange}
                    onFocus={() => setIsFocusedPrice(true)}
                    onBlur={() => setIsFocusedPrice(false)}
                    placeholder=""
                    placeholderTextColor="#D1D5DB"
                    className="flex-1"
                    style={{ 
                      fontFamily: "OpenSans_700Bold",
                      fontSize: 56,
                      color: price ? COLORS.primary : "#D1D5DB",
                      padding: 0,
                      margin: 0,
                      includeFontPadding: false,
                      textAlignVertical: "center",
                      minHeight: 70,
                    }}
                    returnKeyType="done"
                    maxLength={10}
                  />
                  {!price && !isFocusedPrice && (
                    <Text
                      style={{ 
                        fontFamily: "OpenSans_700Bold",
                        fontSize: 56,
                        color: "#D1D5DB",
                        position: "absolute",
                        left: 0,
                      }}
                    >
                      0
                    </Text>
                  )}
                  <Text
                    style={{ 
                      fontFamily: "OpenSans_700Bold",
                      fontSize: 48,
                      color: price ? COLORS.primary : "#D1D5DB",
                      marginLeft: 8,
                      paddingBottom: 4,
                    }}
                  >
                    €
                  </Text>
                </View>

                {!price && (
                  <View className="flex-row mt-4 space-x-2">
                    {["50", "100", "200", "500"].map((suggestion) => (
                      <Pressable
                        key={suggestion}
                        onPress={() => setPrice(suggestion)}
                        className="bg-gray-100 rounded-full px-4 py-2 mr-2"
                        style={{
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                      >
                        <Text
                          style={{ fontFamily: "OpenSans_600SemiBold" }}
                          className="text-gray-600 text-sm"
                        >
                          {suggestion}€
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {price && parseFloat(price) > 0 && (
                  <View className="mt-4 flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                      className="text-green-600 text-sm ml-2"
                    >
                      {t("validAmount")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          <View
            className="bg-white rounded-3xl overflow-hidden mb-6"
            style={{
              shadowColor: isFocusedMessage ? COLORS.primary : "#000",
              shadowOffset: { width: 0, height: isFocusedMessage ? 6 : 3 },
              shadowOpacity: isFocusedMessage ? 0.2 : 0.06,
              shadowRadius: isFocusedMessage ? 12 : 6,
              elevation: isFocusedMessage ? 8 : 3,
              borderWidth: isFocusedMessage ? 2 : 0,
              borderColor: isFocusedMessage ? COLORS.primary : "transparent",
            }}
          >
            <View className="px-6 py-5">
              <View className="flex-row items-center mb-3">
                <Ionicons 
                  name="chatbubble-ellipses" 
                  size={20} 
                  color={COLORS.primary} 
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                  className="text-gray-700 text-base"
                >
                  {t("message")}
                </Text>
                <View className="bg-red-500 rounded-full px-2 py-0.5 ml-2">
                  <Text
                    style={{ fontFamily: "OpenSans_700Bold" }}
                    className="text-white text-xs"
                  >
                    {t("required")}
                  </Text>
                </View>
              </View>
              
              <TextInput
                value={message}
                onChangeText={setMessage}
                onFocus={() => setIsFocusedMessage(true)}
                onBlur={() => setIsFocusedMessage(false)}
                placeholder={t("offerMessagePlaceholder")}
                multiline
                maxLength={400}
                placeholderTextColor="#9CA3AF"
                className="text-gray-900 text-base min-h-[120px]"
                style={{ 
                  fontFamily: "OpenSans_400Regular",
                  textAlignVertical: "top",
                }}
              />
              
              <View className="flex-row justify-between items-center mt-2">
                <Text
                  style={{ fontFamily: "OpenSans_400Regular" }}
                  className="text-gray-400 text-xs"
                >
                  {t("describeExpertise")}
                </Text>
                <Text
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                  className={`text-xs ${
                    message.length > 350 ? "text-orange-500" : message.length < 20 ? "text-red-400" : "text-gray-400"
                  }`}
                >
                  {message.length}/400
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-blue-50 rounded-2xl p-4 mb-6 flex-row">
            <Ionicons 
              name="information-circle" 
              size={24} 
              color="#3B82F6" 
              style={{ marginRight: 12, marginTop: 2 }}
            />
            <View className="flex-1">
              <Text
                style={{ fontFamily: "OpenSans_600SemiBold" }}
                className="text-blue-900 text-sm mb-1"
              >
                {t("advice")}
              </Text>
              <Text
                style={{ fontFamily: "OpenSans_400Regular" }}
                className="text-blue-800 text-xs leading-5"
              >
                {t("offerAdvice")}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={!price || !message.trim() || message.trim().length < 20 || isSubmitting}
            className="rounded-2xl py-5 items-center flex-row justify-center"
            style={{
              backgroundColor: !price || !message.trim() || message.trim().length < 20 || isSubmitting ? "#D1D5DB" : COLORS.primary,
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: !price || !message.trim() || message.trim().length < 20 || isSubmitting ? 0 : 0.3,
              shadowRadius: 8,
              elevation: !price || !message.trim() || message.trim().length < 20 || isSubmitting ? 0 : 6,
            }}
          >
            {isSubmitting ? (
              <View className="flex-row items-center">
                <Ionicons name="hourglass-outline" size={20} color="#fff" />
                <Text
                  style={{ fontFamily: "OpenSans_700Bold" }}
                  className="text-white text-lg ml-2"
                >
                  {t("sendingInProgress")}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text
                  style={{ fontFamily: "OpenSans_700Bold" }}
                  className="text-white text-lg ml-2"
                >
                  {t("sendOffer")}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
            className="py-4 items-center mt-3"
          >
            <Text
              style={{ fontFamily: "OpenSans_600SemiBold" }}
              className="text-gray-500 text-base"
            >
              {t("cancel")}
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
