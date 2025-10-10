import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ImageBackground,
  Image,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../styles/colors";
import { useTranslation } from "react-i18next";

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handlePhoneAuth = () => {
    navigation.navigate("PasswordPage");
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <ImageBackground
        source={require("../../../assets/img/bg.jpg")}
        resizeMode="cover"
        className="absolute inset-0"
      >
        <View className="absolute inset-0 bg-black opacity-40" />
      </ImageBackground>

      <Animated.View
        entering={FadeInDown.duration(100)}
        className="flex-1 px-6 pt-10"
        style={{ backgroundColor: "transparent" }}
      >
        <View className="mb-12 items-center">
          <Image
            source={require("../../../assets/logo.png")}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              marginBottom: 16,
            }}
            resizeMode="contain"
          />
          <Text
            style={{ fontFamily: "OpenSans_700Bold" }}
            className="text-3xl text-white mb-2 font-['OpenSans_700Bold']"
          >
            {t("welcome")}
          </Text>
          <Text
            style={{ fontFamily: "OpenSans_400Regular" }}
            className="text-white text-lg font-['OpenSans_400Regular'] text-center"
          >
            {t("welcomeSubtitle")}
          </Text>
        </View>

        <View className="flex-grow" />

        <View className="mb-6">
          <Pressable
            style={{ backgroundColor: COLORS.primary }}
            onPress={handlePhoneAuth}
            className="flex-row items-center justify-center rounded py-4 px-6 active:opacity-80"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text
                  style={{ fontFamily: "OpenSans_400Regular" }}
                  className="text-white font-semibold text-lg font-['Inter_600SemiBold']"
                >
                  {t("continue")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="white"
                  className="ml-4"
                />
              </>
            )}
          </Pressable>
        </View>

        <View className="mb-8 px-4 items-center">
          <Text
            style={{
              fontFamily: "OpenSans_700Bold",
              textAlign: "center",
              color: "#D1D5DB",
            }}
          >
            {t("byContinu")}
          </Text>
          <Pressable
            onPress={() =>
              Linking.openURL("https://zzigs.com/cgv;php")
            }
          >
            <Text
              style={{
                fontFamily: "OpenSans_700Bold",
                textAlign: "center",
                color: COLORS.primary,
              }}
            >
              {t("termsOfUse")}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
