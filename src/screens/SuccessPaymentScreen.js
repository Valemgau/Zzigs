import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const Confetti = ({ index, colors }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const startX = Math.random() * width;
  const endX = startX + (Math.random() - 0.5) * 100;
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = Math.random() * 8 + 6;
  const duration = Math.random() * 2000 + 2500;
  const rotations = Math.random() * 4 + 2;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height + 50,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: endX - startX,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: rotations,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration * 0.8,
        delay: duration * 0.2,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 2,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
        opacity,
      }}
    />
  );
};

export default function SuccessPaymentScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(50)).current;

  const confettiColors = [
    COLORS.primary,
    COLORS.secondary,
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#ec4899",
  ];

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(checkRotate, {
      toValue: 1,
      duration: 600,
      delay: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideUp, {
      toValue: 0,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const rotateInterpolate = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-10deg", "0deg"],
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {Array.from({ length: 80 }).map((_, index) => (
        <Confetti key={index} index={index} colors={confettiColors} />
      ))}

      <View className="flex-1 justify-center items-center px-6">
        <Animated.View
          style={{
            transform: [{ scale: checkScale }, { rotate: rotateInterpolate }],
          }}
        >
          <View
            className="w-32 h-32 rounded-full items-center justify-center mb-8"
            style={{
              backgroundColor: "#22c55e15",
              borderWidth: 4,
              borderColor: "#22c55e",
              shadowColor: "#22c55e",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <MaterialIcons name="check" size={80} color="#22c55e" />
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
            alignItems: "center",
          }}
        >
          <Text
            style={{ fontFamily: "OpenSans_700Bold", color: COLORS.primary }}
            className="text-3xl text-center mb-3"
          >
            {t("paymentConfirmed") || "Paiement réussi !"}
          </Text>

          <Text
            style={{ fontFamily: "OpenSans_400Regular" }}
            className="text-base text-gray-600 text-center mb-8"
          >
            {t("paymentSuccessful") || "Merci pour votre confiance"}
          </Text>
        </Animated.View>
      </View>

      <View className="px-6 pb-6">
        <Pressable
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" }],
            })
          }
          className="rounded-xl py-4 items-center justify-center"
          style={{
            backgroundColor: COLORS.primary,
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center">
            <Text
              style={{ fontFamily: "OpenSans_700Bold" }}
              className="text-white text-base ml-2"
            >
              {"OK"}
            </Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
