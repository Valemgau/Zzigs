import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Dimensions,
  StyleSheet,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
  FadeInLeft,
  FadeOut,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../styles/colors";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";

const { width, height } = Dimensions.get("window");

const LANGUAGES = [
  {
    code: "fr",
    label: "Français",
    flag: require("../../../assets/img/fr.png"),
  },
  {
    code: "en",
    label: "English",
    flag: require("../../../assets/img/en.png"),
  },
  {
    code: "de",
    label: "Deutsch",
    flag: require("../../../assets/img/de.webp"),
  },
  {
    code: "es",
    label: "Español",
    flag: require("../../../assets/img/es.webp"),
  },
  {
    code: "it",
    label: "Italiano",
    flag: require("../../../assets/img/it.png"),
  },
];

export default function LandingScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [showLangModal, setShowLangModal] = useState(false);

  const currentLanguage = LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
    setShowLangModal(false);
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[
          "#1a0000",
          COLORS.primary,
          "#8B0000",
          COLORS.primary,
          "#1a0000",
        ]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        {/* Cercles décoratifs flous en arrière-plan - Améliorés */}
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            entering={FadeIn.duration(2000)}
            style={{
              position: "absolute",
              top: -100,
              right: -100,
              width: 350,
              height: 350,
              borderRadius: 175,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          />
          <Animated.View
            entering={FadeIn.duration(2000).delay(300)}
            style={{
              position: "absolute",
              bottom: -150,
              left: -100,
              width: 450,
              height: 450,
              borderRadius: 225,
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          />
          <Animated.View
            entering={FadeIn.duration(2000).delay(600)}
            style={{
              position: "absolute",
              top: height * 0.3,
              left: -50,
              width: 250,
              height: 250,
              borderRadius: 125,
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
          />
          <Animated.View
            entering={FadeIn.duration(2000).delay(900)}
            style={{
              position: "absolute",
              top: height * 0.5,
              right: -80,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: "rgba(255,255,255,0.03)",
            }}
          />
        </View>

        <SafeAreaView className="flex-1">
          {/* Header avec sélecteur de langue et bouton fermer */}
          <View className="px-6 pt-4 pb-2">
            <Animated.View
              entering={FadeInDown.duration(600)}
              className="flex-row justify-between items-center"
            >
              {/* Sélecteur de langue */}
              <Pressable
                onPress={() => setShowLangModal(true)}
                className="flex-row items-center px-4 py-2"
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                <Image
                  source={currentLanguage.flag}
                  style={{ width: 24, height: 18, marginRight: 8 }}
                  contentFit="contain"
                />
                <Text
                  className="text-white text-sm font-semibold"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {currentLanguage.label}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={20}
                  color="#fff"
                  style={{ marginLeft: 4 }}
                />
              </Pressable>

              {/* Bouton fermer */}
              <Pressable
                onPress={() => navigation.navigate("Home")}
                className="p-2"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 20,
                }}
              >
                <MaterialIcons name="close" size={24} color="#fff" />
              </Pressable>
            </Animated.View>
          </View>

          <View className="flex-1 px-8 justify-between py-8">
            {/* Section supérieure avec logo et texte */}
            <View className="flex-1 justify-center items-center pt-4">
              {/* Logo avec effet glassmorphism amélioré */}
              <Animated.View
                entering={FadeIn.duration(1200).delay(400)}
                className="items-center mb-10"
              >
                <View
                  className="rounded-full overflow-hidden"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    shadowColor: "#fff",
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    elevation: 15,
                    padding: 4,
                  }}
                >
                  <View
                    className="w-48 h-48 rounded-full overflow-hidden"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderWidth: 3,
                      borderColor: "rgba(255,255,255,0.4)",
                    }}
                  >
                    <Image
                      source={require("../../../assets/logo_cropped.png")}
                      className="w-full h-full"
                      contentFit="cover"
                    />
                  </View>
                </View>
              </Animated.View>

              {/* Icônes décoratives - plus grandes et plus visibles */}
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Animated.View
                  entering={FadeInLeft.duration(1000).delay(700)}
                  style={{
                    position: "absolute",
                    top: height * 0.18,
                    right: 25,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      padding: 12,
                      borderRadius: 20,
                    }}
                  >
                    <MaterialIcons
                      name="content-cut"
                      size={36}
                      color="rgba(255,255,255,0.3)"
                    />
                  </View>
                </Animated.View>

                <Animated.View
                  entering={FadeInDown.duration(1000).delay(900)}
                  style={{
                    position: "absolute",
                    top: height * 0.28,
                    left: 15,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      padding: 10,
                      borderRadius: 18,
                    }}
                  >
                    <MaterialIcons
                      name="checkroom"
                      size={32}
                      color="rgba(255,255,255,0.25)"
                    />
                  </View>
                </Animated.View>

                <Animated.View
                  entering={FadeInUp.duration(1000).delay(1100)}
                  style={{
                    position: "absolute",
                    top: height * 0.4,
                    right: 40,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      padding: 8,
                      borderRadius: 16,
                    }}
                  >
                    <MaterialIcons
                      name="brush"
                      size={28}
                      color="rgba(255,255,255,0.2)"
                    />
                  </View>
                </Animated.View>
              </View>

              {/* Message de bienvenue avec card glassmorphism améliorée */}
              <Animated.View
                entering={FadeInDown.duration(1200).delay(600)}
                className="items-center p-6 mx-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.25)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Text
                  className="text-lg font-bold text-white text-center leading-7"
                  style={{
                    fontFamily: "OpenSans_700Bold",
                    textShadowColor: "rgba(0, 0, 0, 0.5)",
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 6,
                    letterSpacing: 0.5,
                  }}
                >
                  {t("landingTitle")}
                </Text>
              </Animated.View>
            </View>

            {/* Boutons d'action avec design amélioré */}
            <View className="space-y-3 pb-6">
             

              <Animated.View entering={FadeInUp.duration(800).delay(1000)}>
                <Pressable
                  onPress={() => navigation.navigate("PasswordPage")}
                  className="py-5 items-center"
                  style={({ pressed }) => ({
                    borderRadius: 12,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderWidth: 2,
                    borderColor: "rgba(255,255,255,0.8)",
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowColor: "#fff",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  })}
                >
                  <View className="flex-row items-center">
                    <MaterialIcons name="login" size={22} color="#fff" />
                    <Text
                      className="text-base font-bold text-white ml-2 uppercase tracking-wider"
                      style={{
                        fontFamily: "OpenSans_700Bold",
                        fontSize: 16,
                        textShadowColor: "rgba(0, 0, 0, 0.3)",
                        textShadowOffset: { width: 0, height: 2 },
                        textShadowRadius: 4,
                      }}
                    >
                      {t("login")}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </SafeAreaView>

        {/* Modal de sélection de langue */}
        <Modal
          visible={showLangModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLangModal(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-center items-center"
            onPress={() => setShowLangModal(false)}
          >
            <Animated.View
              entering={FadeInDown.duration(400)}
              exiting={FadeOut.duration(300)}
              className="bg-white mx-6 rounded-2xl overflow-hidden"
              style={{
                width: width * 0.85,
                maxWidth: 400,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 20,
              }}
            >
              {/* Header du modal */}
              <View
                className="px-6 py-4 border-b"
                style={{
                  backgroundColor: COLORS.primary,
                  borderBottomColor: "rgba(255,255,255,0.2)",
                }}
              >
                <Text
                  className="text-white text-lg font-bold text-center"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  {t("chooseDisplayLanguage") || "Choisir la langue"}
                </Text>
              </View>

              {/* Liste des langues */}
              <View className="py-2">
                {LANGUAGES.map((lang, index) => (
                  <Animated.View
                    key={lang.code}
                    entering={FadeInDown.duration(300).delay(index * 50)}
                  >
                    <Pressable
                      onPress={() => handleLanguageChange(lang.code)}
                      className="px-6 py-4 flex-row items-center"
                      style={({ pressed }) => ({
                        backgroundColor:
                          i18n.language === lang.code
                            ? "rgba(139, 0, 0, 0.08)"
                            : pressed
                            ? "#F9FAFB"
                            : "transparent",
                      })}
                    >
                      <Image
                        source={lang.flag}
                        style={{ width: 32, height: 24, marginRight: 16 }}
                        contentFit="contain"
                      />
                      <Text
                        className="flex-1 text-base font-semibold"
                        style={{
                          fontFamily: "OpenSans_600SemiBold",
                          color:
                            i18n.language === lang.code
                              ? COLORS.primary
                              : "#111827",
                        }}
                      >
                        {lang.label}
                      </Text>
                      {i18n.language === lang.code && (
                        <View
                          className="w-6 h-6 items-center justify-center"
                          style={{
                            backgroundColor: COLORS.primary,
                            borderRadius: 12,
                          }}
                        >
                          <MaterialIcons name="check" size={16} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                ))}
              </View>

              {/* Bouton fermer */}
              <View className="px-6 py-4 border-t" style={{ borderTopColor: "#E5E7EB" }}>
                <Pressable
                  onPress={() => setShowLangModal(false)}
                  className="py-3 items-center"
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 10,
                  }}
                >
                  <Text
                    className="text-gray-700 font-semibold"
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                  >
                    {t("cancel") || "Annuler"}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Modal>
      </LinearGradient>
    </View>
  );
}