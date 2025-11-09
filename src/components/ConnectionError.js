import { View, Text, Pressable } from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function ConnectionError({ onRetry }) {
  const { t } = useTranslation();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <View className="bg-gray-50 flex-1 items-center justify-center px-6">
      {/* Icône principale */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(100)}
        className="items-center mb-8"
      >
        <View
          className="w-32 h-32 rounded-full items-center justify-center mb-6"
          style={{
            backgroundColor: COLORS.primary + "15",
          }}
        >
          <MaterialIcons name="wifi-off" size={64} color={COLORS.primary} />
        </View>

        <Text
          className="text-2xl text-gray-900 text-center mb-3"
          style={{ fontFamily: "OpenSans_700Bold" }}
        >
          Pas de connexion
        </Text>

        <Text
          className="text-base text-gray-600 text-center mb-6"
          style={{ fontFamily: "OpenSans_400Regular" }}
        >
          Votre appareil n'est pas connecté à Internet
        </Text>
      </Animated.View>

      {/* Conseils */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(300)}
        className="bg-white rounded-2xl p-5 mb-6 w-full"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <Text
          className="text-sm text-gray-700 mb-4"
          style={{ fontFamily: "OpenSans_600SemiBold" }}
        >
          Vérifiez votre connexion :
        </Text>

        <View className="space-y-3">
          <View className="flex-row items-center mb-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: "#DBEAFE" }}
            >
              <MaterialIcons name="wifi" size={20} color="#3B82F6" />
            </View>
            <Text
              className="text-sm text-gray-700 flex-1"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              Vérifiez que le Wi-Fi est activé
            </Text>
          </View>

          <View className="flex-row items-center mb-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: "#DBEAFE" }}
            >
              <MaterialIcons name="signal-cellular-alt" size={20} color="#3B82F6" />
            </View>
            <Text
              className="text-sm text-gray-700 flex-1"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              Vérifiez vos données mobiles (4G/5G)
            </Text>
          </View>

          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: "#DBEAFE" }}
            >
              <MaterialIcons name="airplanemode-active" size={20} color="#3B82F6" />
            </View>
            <Text
              className="text-sm text-gray-700 flex-1"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              Désactivez le mode avion
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Bouton réessayer */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(500)}
        className="w-full"
      >
        <Pressable
          onPress={handleRetry}
          className="py-4 rounded-xl flex-row items-center justify-center"
          style={{ backgroundColor: COLORS.primary }}
        >
          <MaterialIcons name="refresh" size={22} color="#fff" />
          <Text
            className="text-white text-base ml-2"
            style={{ fontFamily: "OpenSans_700Bold" }}
          >
            Réessayer
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}