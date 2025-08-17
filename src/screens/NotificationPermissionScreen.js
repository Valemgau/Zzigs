import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../styles/colors";

const NotificationPermissionScreen = ({ navigation, onDone }) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [granted, setGranted] = useState(false);

  const handlePermission = async () => {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        setGranted(result === PermissionsAndroid.RESULTS.GRANTED);
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          // Passe à l'étape suivante (tracking ou main app)
          if (onDone) onDone();
          else navigation.replace("TrackingPermission");
        }
      } catch (e) {
        // Optionnel: showMessage({ message: "Erreur lors de la demande", type: "danger" });
      }
    } else {
      // iOS ou Android < 13
      if (onDone) onDone();
      else navigation.replace("TrackingPermission");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#18181B" : "#fff" },
      ]}
    >
      <LinearGradient
        colors={
          isDarkMode
            ? ["#23272F", "#18181B"]
            : ["#FFF7ED", "#fff"]
        }
        style={styles.gradient}
      />

      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconBg,
            {
              backgroundColor: isDarkMode
                ? "#FDBA74"
                : "#FFEDD5",
            },
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={40}
            color={isDarkMode ? "#FDBA74" : "#EA580C"}
          />
        </View>
      </View>

      <Text
        style={[
          styles.title,
          { color: isDarkMode ? "#fff" : "#18181B" },
        ]}
      >
        Autorisez les notifications
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: isDarkMode ? "#D1D5DB" : "#6B7280" },
        ]}
      >
        Recevez des alertes pour les nouveautés, messages et évènements près de chez vous.
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isDarkMode
              ? COLORS.primary
              : "#EA580C",
          },
        ]}
        onPress={handlePermission}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Activer les notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skip}
        onPress={() => {
          if (onDone) onDone();
          else navigation.replace("TrackingPermission");
        }}
      >
        <Text
          style={{
            color: isDarkMode ? "#F3F4F6" : "#EA580C",
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

export default NotificationPermissionScreen;
