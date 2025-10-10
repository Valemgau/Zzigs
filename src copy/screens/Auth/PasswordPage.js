import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../config/firebase";
import { COLORS } from "../../styles/colors";
import { useTranslation } from "react-i18next";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { showMessage } from "react-native-flash-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PasswordPage() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   getLastLogin();
  // }, []);

  async function getLastLogin() {
    try {
      const value = await AsyncStorage.getItem("USER_LAST_LOGIN");
      if (value !== null) {
        Alert.alert(
          t("lastLoginTitle"),
          t("lastLoginDesc"),
          [
            {
              text: t("yes"),
              onPress: () => {
                const userLastLogin = JSON.parse(value);
                setEmail(userLastLogin.email);
                setPassword(userLastLogin.password);
              },
            },
            {
              text: t("no"),
              style: "cancel",
            },
          ],
          { cancelable: true }
        );
      }
    } catch (error) {
      console.error("Erreur récupération dernière connexion:", error);
    }
  }

  const handlePasswordSubmit = async (email, password) => {
    if (!email.trim()) {
      showMessage({
        message: t("emailRequired"),
        description: t("emailRequiredDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    if (password.trim().length < 6) {
      showMessage({
        message: t("passwordTooShort"),
        description: t("passwordTooShortDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const jsonValue = JSON.stringify({
        email: email.trim(),
        password,
      });
      await AsyncStorage.setItem("USER_LAST_LOGIN", jsonValue);

      await updateDoc(doc(db, "users", userCredential.user.uid), {
        lastLogin: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erreur connexion:", error);

      if (error.code === "auth/invalid-email") {
        showMessage({
          message: t("invalidEmail"),
          description: t("invalidEmailDesc"),
          type: "danger",
          icon: "danger",
        });
      } else if (error.code === "auth/user-not-found") {
        showMessage({
          message: t("accountNotFound"),
          description: t("accountNotFoundDesc"),
          type: "danger",
          icon: "danger",
        });
      } else if (error.code === "auth/wrong-password") {
        showMessage({
          message: t("incorrectPassword"),
          description: t("incorrectPasswordDesc"),
          type: "danger",
          icon: "danger",
        });
      } else {
        showMessage({
          message: t("loginFailed"),
          description: t("loginFailedDesc"),
          type: "danger",
          icon: "danger",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-12">
          <Animated.View entering={FadeInDown.duration(300)} className="mb-10">
            <Text
              className="text-3xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "OpenSans_700Bold" }}
            >
              {t("loginTitle")}
            </Text>
            <Text
              className="text-base text-gray-600"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              {t("loginSubtitle")}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(100)}
            className="mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("email")}
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-3 z-10">
                <MaterialIcons name="email" size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder={t("emailPlaceholder")}
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
            entering={FadeInDown.duration(300).delay(150)}
            className="mb-2"
          >
            <Text
              className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("password")}
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-3 z-10">
                <MaterialIcons name="lock" size={20} color="#6B7280" />
              </View>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                textContentType="password"
                className="bg-white border border-gray-200 text-gray-900 text-sm pl-12 pr-12 py-3"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  height: 48,
                  paddingVertical: 0,
                }}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 z-10"
              >
                <MaterialIcons
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(200)}
            className="mb-8"
          >
            <Pressable
              onPress={() => navigation.navigate("ForgotPassword")}
              className="self-end"
            >
              <Text
                className="text-sm"
                style={{
                  fontFamily: "OpenSans_600SemiBold",
                  color: COLORS.secondary,
                }}
              >
                {t("forgotPassword")}
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(250)}
            className="mb-4"
          >
            <Pressable
              onPress={() => handlePasswordSubmit(email, password)}
              disabled={loading || !email || !password}
              className="py-4 items-center"
              style={{
                backgroundColor:
                  loading || !email || !password ? "#D1D5DB" : COLORS.primary,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View className="flex-row items-center">
                  <MaterialIcons name="login" size={18} color="#fff" />
                  <Text
                    className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {t("login")}
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(250)}
            className="mb-4"
          >
            <Pressable
              onPress={() =>
                handlePasswordSubmit(
                  "ahmedsanoko1@gmail.com",
                  "ahmedsanoko1@gmail.com"
                )
              }
              disabled={loading}
              className="py-4 items-center"
              style={{
                backgroundColor: loading ? "#D1D5DB" : COLORS.primary,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View className="flex-row items-center">
                  <MaterialIcons name="login" size={18} color="#fff" />
                  <Text
                    className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    ahmedsanoko1
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(250)}
            className="mb-4"
          >
            <Pressable
              onPress={() =>
                handlePasswordSubmit(
                  "alexthunder696@gmail.com",
                  "alexthunder696@gmail.com"
                )
              }
              disabled={loading}
              className="py-4 items-center"
              style={{
                backgroundColor: loading ? "#D1D5DB" : COLORS.primary,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View className="flex-row items-center">
                  <MaterialIcons name="login" size={18} color="#fff" />
                  <Text
                    className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    alexthunder696
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(250)}
            className="mb-4"
          >
            <Pressable
              onPress={() =>
                handlePasswordSubmit(
                  "nouveausunder@gmail.com",
                  "nouveausunder@gmail.com"
                )
              }
              disabled={loading}
              className="py-4 items-center"
              style={{
                backgroundColor: loading ? "#D1D5DB" : COLORS.primary,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View className="flex-row items-center">
                  <MaterialIcons name="login" size={18} color="#fff" />
                  <Text
                    className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    nouveausunder
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(300)}
            className="flex-row items-center my-6"
          >
            <View className="flex-1 h-px bg-gray-300" />
            <Text
              className="px-4 text-xs text-gray-400 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("or")}
            </Text>
            <View className="flex-1 h-px bg-gray-300" />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(350)}>
            <Pressable
              onPress={() => navigation.navigate("Register")}
              className="py-4 items-center border-2 border-gray-300 bg-white"
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="person-add"
                  size={18}
                  color={COLORS.primary}
                />
                <Text
                  className="text-sm font-bold ml-2 uppercase tracking-wider"
                  style={{
                    fontFamily: "OpenSans_700Bold",
                    color: COLORS.primary,
                  }}
                >
                  {t("createAccount")}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
