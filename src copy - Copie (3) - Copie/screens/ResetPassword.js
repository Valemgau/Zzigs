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
import { useNavigation, useRoute } from "@react-navigation/native";
import { auth } from "../../config/firebase";
import { signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { COLORS } from "../styles/colors";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { API_URL } from "@env";

export default function ResetPassword() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, code } = route.params;

  const [verificationCode, setVerificationCode] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Réinitialiser le mot de passe",
    });
  }, [navigation]);

  const handleResetPassword = async () => {
    if (!verificationCode.trim() || !oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showMessage({
        message: "Champs requis",
        description: "Veuillez remplir tous les champs.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (verificationCode.trim() !== code) {
      showMessage({
        message: "Code invalide",
        description: "Le code de vérification est incorrect.",
        type: "danger",
        icon: "danger",
      });
      return;
    }

    if (newPassword.length < 6) {
      showMessage({
        message: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage({
        message: "Mots de passe différents",
        description: "Les mots de passe ne correspondent pas.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (oldPassword === newPassword) {
      showMessage({
        message: "Même mot de passe",
        description: "Le nouveau mot de passe doit être différent de l'ancien.",
        type: "warning",
        icon: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, oldPassword);
      const user = userCredential.user;

      await updatePassword(user, newPassword);

      const response = await fetch(`${API_URL}/send_confirmation_reset.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          colors: {
            primary: COLORS.primary,
            secondary: COLORS.secondary,
          },
        }),
      });

      showMessage({
        message: "Mot de passe modifié",
        description: "Votre mot de passe a été réinitialisé avec succès.",
        type: "success",
        icon: "success",
      });

      navigation.navigate("Login");

    } catch (error) {
      console.error("Erreur réinitialisation:", error);
      
      let errorMessage = "Impossible de réinitialiser le mot de passe.";
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "L'ancien mot de passe est incorrect.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Trop de tentatives. Réessayez plus tard.";
      }

      showMessage({
        message: "Erreur",
        description: errorMessage,
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
              Entrez le code reçu par email, votre ancien mot de passe et votre nouveau mot de passe
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
              Code de vérification *
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-3 z-10">
                <MaterialIcons name="verified" size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder="123456"
                placeholderTextColor="#9CA3AF"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
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
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              Ancien mot de passe *
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-3 z-10">
                <MaterialIcons name="lock-outline" size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder="Ancien mot de passe"
                placeholderTextColor="#9CA3AF"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOldPassword}
                autoCapitalize="none"
                className="bg-white border border-gray-200 text-gray-900 text-sm pl-12 pr-12 py-3"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  height: 48,
                  paddingVertical: 0,
                }}
              />
              <Pressable
                onPress={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-4 top-3"
              >
                <MaterialIcons
                  name={showOldPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(150)}
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              Nouveau mot de passe *
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-3 z-10">
                <MaterialIcons name="lock" size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder="Minimum 6 caractères"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="bg-white border border-gray-200 text-gray-900 text-sm pl-12 pr-12 py-3"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  height: 48,
                  paddingVertical: 0,
                }}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3"
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(200)}
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              Confirmer le mot de passe *
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-3 z-10">
                <MaterialIcons name="lock" size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                className="bg-white border border-gray-200 text-gray-900 text-sm pl-12 pr-12 py-3"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  height: 48,
                  paddingVertical: 0,
                }}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-3"
              >
                <MaterialIcons
                  name={showConfirmPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
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
          onPress={handleResetPassword}
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
              <MaterialIcons name="check-circle" size={18} color="#fff" />
              <Text
                className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                Réinitialiser
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
            Retour
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
