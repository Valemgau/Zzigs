import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { COLORS } from "../styles/colors"; // adapte le chemin selon ton projet

const { width } = Dimensions.get("window");

const LandingScreen = ({ navigation, onComplete }) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#18181B" : "#fff" }]}>
      <LinearGradient
        colors={isDarkMode ? ["#23272F", "#18181B"] : ["#FFF7ED", "#fff"]}
        style={styles.gradient}
      />

      <View style={styles.hero}>
        <View style={[styles.iconBg, { backgroundColor: isDarkMode ? "#C7D2FE" : "#F3F4F6" }]}>
          <Ionicons
            name="rocket-outline"
            size={54}
            color={isDarkMode ? "#6366F1" : "#4338CA"}
          />
        </View>
        <Image
          source={require("../../assets/logo.png")} // Mets une image sympa ou enlève si tu n'en as pas
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#18181B" }]}>
          Bienvenue sur ConnectMove
        </Text>
        <Text style={[styles.subtitle, { color: isDarkMode ? "#D1D5DB" : "#6B7280" }]}>
          Découvre, crée et partage des activités sportives près de chez toi. Rejoins la communauté et ne rate plus aucun évènement !
        </Text>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isDarkMode ? COLORS.primary : "#6366F1" },
          ]}
          onPress={() => {
            if (onComplete) onComplete();
            else navigation.replace("NotificationPermission");
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Commencer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 36,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  hero: {
    alignItems: "center",
    marginTop: 80,
    marginBottom: 32,
  },
  iconBg: {
    padding: 18,
    borderRadius: 999,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  heroImage: {
    width: width * 0.8,
    height: 180,
    marginBottom: 0,
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 27,
    textAlign: "center",
    marginBottom: 14,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 38,
    lineHeight: 23,
  },
  button: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Inter_500Medium",
    fontSize: 17,
    letterSpacing: 0.2,
  },
});

export default LandingScreen;
