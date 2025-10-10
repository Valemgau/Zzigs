import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Alert,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS } from "../../styles/colors";
import { auth } from "../../../config/firebase";

export default function BloqueCompte({ navigation }) {
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => null,
    });
  }, [navigation]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      Alert.alert("Erreur", "Impossible de se déconnecter.");
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent("Compte bloqué - Demande de support");
    const body = encodeURIComponent(
      "Bonjour,\n\nMon compte a été bloqué. Pourriez-vous m'en expliquer la raison ?\n\nMerci."
    );
    Linking.openURL(`mailto:${process.env.ADMIN_EMAIL}?subject=${subject}&body=${body}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center px-6">
        {/* Icône et titre */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="items-center mb-8"
        >
          <View
            className="w-24 h-24 items-center justify-center mb-6"
            style={{
              backgroundColor: "#FEE2E2",
              borderWidth: 2,
              borderColor: "#EF4444",
            }}
          >
            <Ionicons name="lock-closed" size={48} color="#EF4444" />
          </View>

          <Text
            className="text-3xl font-bold text-center mb-3"
            style={{
              fontFamily: "OpenSans_700Bold",
              color: "#1F2937",
            }}
          >
            Compte suspendu
          </Text>

          <View className="w-16 h-1 bg-red-500" />
        </Animated.View>

        {/* Message principal */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          className="mb-8"
        >
          <View className="border-l-4 bg-white px-4 py-4 border-red-500">
            <Text
              className="text-sm text-gray-700 leading-6 mb-3"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              Votre compte a été temporairement suspendu suite à une violation 
              de nos conditions d'utilisation.
            </Text>
            <Text
              className="text-sm text-gray-700 leading-6"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              Un email contenant tous les détails vous a été envoyé. 
              Vérifiez également votre dossier spam.
            </Text>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          className="space-y-4"
        >
          {/* Bouton Support */}
          <Pressable
            onPress={handleContactSupport}
            className="py-4 items-center border-2"
            style={{
              backgroundColor: COLORS.primary,
              borderColor: COLORS.primary,
            }}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="email" size={18} color="#fff" />
              <Text
                className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                Contacter le support
              </Text>
            </View>
          </Pressable>

          {/* Bouton Déconnexion */}
          <Pressable
            onPress={handleLogout}
            className="py-4 items-center border-2 border-gray-300 bg-white"
          >
            <View className="flex-row items-center">
              <MaterialIcons name="logout" size={18} color="#6B7280" />
              <Text
                className="text-sm font-bold text-gray-700 ml-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                Se déconnecter
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Info supplémentaire */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          className="mt-8"
        >
          <View className="bg-amber-50 border border-amber-200 px-4 py-3">
            <View className="flex-row items-start">
              <MaterialIcons
                name="info"
                size={16}
                color="#D97706"
                style={{ marginTop: 2 }}
              />
              <Text
                className="flex-1 text-xs text-amber-800 leading-5 ml-3"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                En cas de désaccord, notre équipe support examinera votre 
                demande dans les 48h ouvrées
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}