import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../styles/colors";
import { auth } from "../../config/firebase";
import { useTranslation } from "react-i18next";

const Header = ({ isClient }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [authUser, setAuthUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) {
      setIsReady(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (authUser && isClient !== undefined && isClient !== null) {
      const timer = setTimeout(() => {
        setIsReady(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [authUser, isClient]);

  const handleMenu = () => {
    navigation.navigate("SettingsScreen");
  };

  const handleLogin = () => {
    navigation.navigate("PasswordPage");
  };

  if (!isReady) {
    return (
      <View
        className="flex-row items-center justify-between px-5 border-b border-gray-200"
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          backgroundColor: "#fff",
        }}
      >
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text
              className="text-white text-xl"
              style={{ fontFamily: "OpenSans_700Bold", color: COLORS.secondary }}
            >
              z
            </Text>
          </View>
          <Text
            className="text-2xl"
            style={{
              textTransform: "none",
              fontFamily: "OpenSans_700Bold",
              color: COLORS.primary,
              letterSpacing: 0.5,
            }}
          >
            zZigs
          </Text>
        </View>
        <View style={{ minHeight: 40, minWidth: 40 }} />
      </View>
    );
  }

  return (
    <View
      className="flex-row items-center justify-between px-5 border-b border-gray-200"
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: 12,
        backgroundColor: "#fff",
      }}
    >
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text
            className="text-white text-xl"
            style={{ fontFamily: "OpenSans_700Bold", color: COLORS.secondary }}
          >
            z
          </Text>
        </View>
        <Text
          className="text-2xl"
          style={{
            textTransform: "none",
            fontFamily: "OpenSans_700Bold",
            color: COLORS.primary,
            letterSpacing: 0.5,
          }}
        >
          zZigs
        </Text>
      </View>

      <Animated.View
        className="flex-row items-center"
        style={{ minHeight: 40, opacity: fadeAnim }}
      >
        {authUser ? (
          <>
            <Text
              className="text-sm mr-3"
              style={{
                fontFamily: "OpenSans_600SemiBold",
                color: COLORS.primary,
              }}
            >
              {isClient ? t("customer") : t("tailor")}
            </Text>
            <Pressable
              onPress={handleMenu}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: COLORS.primary + "15" }}
            >
              <MaterialIcons name="menu" size={24} color={COLORS.primary} />
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={handleLogin}
            className="px-2 py-2 flex-row items-center rounded-full"
            style={{ backgroundColor: COLORS.primary }}
          >
            <MaterialIcons name="login" size={18} color="#fff" />
            <Text
              className="text-white text-sm ml-2"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("login")}
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

export default Header;
