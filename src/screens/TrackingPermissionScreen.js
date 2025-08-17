import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { COLORS } from "../styles/colors";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";

const TrackingPermissionScreen = ({ navigation, onDone }) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const handlePermission = async () => {
    if (Platform.OS === "ios") {
      try {
        const { status } = await requestTrackingPermissionsAsync();
        if (status === "granted" || status === "unavailable") {
          if (onDone) onDone();
          else navigation.replace("Main");
        }
      } catch (error) {
        Optionnel : showMessage({ message: "Erreur lors de la demande", type: "danger" });
      }
    } else {
      // Android - pas de permission tracking
      if (onDone) onDone();
      else navigation.replace("Main");
    }
  };

  useEffect(() => {
    // Si déjà autorisé, on skip direct
    const check = async () => {
      if (Platform.OS === "ios") {
        const { status } = await requestTrackingPermissionsAsync();
        if (status === "granted" || status === "unavailable") {
          if (onDone) onDone();
          else navigation.replace("Main");
        }
      }
    };
    check();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#18181B" : "#fff" }]}>
      <LinearGradient
        colors={isDarkMode ? ["#23272F", "#18181B"] : ["#FFF7ED", "#fff"]}
        style={styles.gradient}
      />

      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconBg,
            { backgroundColor: isDarkMode ? "#A78BFA" : "#EDE9FE" },
          ]}
        >
          <Ionicons
            name="shield-outline"
            size={40}
            color={isDarkMode ? "#8B5CF6" : "#7C3AED"}
          />
        </View>
      </View>

      <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#18181B" }]}>
        Respect de votre vie privée
      </Text>
      <Text style={[styles.subtitle, { color: isDarkMode ? "#D1D5DB" : "#6B7280" }]}>
        Nous utilisons des données anonymisées pour améliorer votre expérience et proposer des contenus pertinents.
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isDarkMode ? COLORS.primary : "#7C3AED" },
        ]}
        onPress={handlePermission}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Autoriser le suivi</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skip}
        onPress={() => {
          if (onDone) onDone();
          else navigation.replace("Main");
        }}
      >
        <Text
          style={{
            color: isDarkMode ? "#F3F4F6" : "#7C3AED",
            fontFamily: "Inter_400Regular",
            fontSize: 15,
          }}
        >
          Plus tard
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  iconContainer: {
    marginBottom: 32,
    marginTop: -30,
  },
  iconBg: {
    padding: 22,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 23,
  },
  button: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  skip: {
    padding: 8,
  },
});

export default TrackingPermissionScreen;
