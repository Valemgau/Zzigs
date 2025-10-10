import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { COLORS } from "../styles/colors";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { API_URL } from "@env";

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Mot de passe oublié",
    });
  }, [navigation]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      showMessage({
        message: "Email requis",
        description: "Veuillez entrer une adresse email valide.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showMessage({
        message: "Email invalide",
        description: "Le format de l'email n'est pas valide.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const userQuery = query(
        collection(db, "users"),
        where("email", "==", email.trim())
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        showMessage({
          message: "Utilisateur introuvable",
          description: "Aucun compte associé à cet email.",
          type: "danger",
          icon: "danger",
        });
        setLoading(false);
        return;
      }

      const codeVerification = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      const response = await fetch(`${API_URL}/forgot_password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          codeVerification,
          colors: {
            primary: COLORS.primary,
            secondary: COLORS.secondary,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors de l'envoi");
      }

      showMessage({
        message: "Code envoyé",
        description: "Un code de réinitialisation a été envoyé à votre email.",
        type: "success",
        icon: "success",
      });

      navigation.navigate("ResetPassword", {
        email: email.trim(),
        code: codeVerification,
      });

    } catch (error) {
      console.error("Erreur envoi code:", error);
      showMessage({
        message: "Erreur",
        description: "Impossible d'envoyer le code. Vérifiez votre email.",
        type: "danger",
        icon: "danger",
      });
    } finally {
      setLoading(false);
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
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="border-l-4 bg-gray-50 px-4 py-3 mb-8"
            style={{ borderLeftColor: COLORS.secondary }}
          >
            <Text
              className="text-sm text-gray-700 leading-5"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              Entrez votre adresse email pour recevoir un code de réinitialisation
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(50)}
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              Adresse email *
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-3 z-10">
                <MaterialIcons name="email" size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder="exemple@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                className="bg-white border border-gray-200 text-gray-900 text-sm pl-12 pr-4 py-3"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  height: 48,
                  paddingVertical: 0,
                }}
              />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(100)}
            className="bg-blue-50 border-l-4 px-4 py-3 mb-6"
            style={{ borderLeftColor: COLORS.primary }}
          >
            <Text
              className="text-xs font-bold mb-2"
              style={{ 
                fontFamily: "OpenSans_700Bold",
                color: COLORS.primary 
              }}
            >
              Comment ça fonctionne :
            </Text>
            <View className="space-y-1">
              <View className="flex-row items-start">
                <Text className="text-xs text-gray-700 mr-2">1.</Text>
                <Text
                  className="text-xs text-gray-700 flex-1"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  Recevez un code par email
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-xs text-gray-700 mr-2">2.</Text>
                <Text
                  className="text-xs text-gray-700 flex-1"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  Saisissez le code avec votre nouveau mot de passe
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-xs text-gray-700 mr-2">3.</Text>
                <Text
                  className="text-xs text-gray-700 flex-1"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  Connectez-vous avec votre nouveau mot de passe
                </Text>
              </View>
            </View>
          </Animated.View>
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
          onPress={handleSendCode}
          disabled={loading}
          className="py-4 items-center flex-row justify-center mb-3"
          style={{
            backgroundColor: loading ? "#D1D5DB" : COLORS.primary,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialIcons name="send" size={18} color="#fff" />
              <Text
                className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                Envoyer le code
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          className="py-3 items-center"
        >
          <Text
            className="text-sm"
            style={{
              fontFamily: "OpenSans_600SemiBold",
              color: COLORS.secondary,
            }}
          >
            Retour à la connexion
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
