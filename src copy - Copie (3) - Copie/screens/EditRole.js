import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Switch,
} from "react-native";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { COLORS } from "../styles/colors";
import { CommonActions, useNavigation } from "@react-navigation/native";
import Loader from "../components/Loader";

export default function EditRole({ route }) {
  const { newProfile } = route?.params || {};

  const navigation = useNavigation();
  const user = auth.currentUser;

  const [isClient, setIsClient] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadUserRole() {
      console.log(newProfile);
      if (user) {
        setLoading(true);
        const userDoc = doc(db, "users", user.uid);
        const snapshot = await getDoc(userDoc);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setIsClient(data?.isClient !== undefined ? data.isClient : true);
        }
        setLoading(false);
      }
    }
    loadUserRole();
  }, [user]);

  const handleSwitchRole = async () => {
    if (!user) return;
    setUpdating(true);
    const newRole = !isClient;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        isClient: newRole,
        updatedAt: new Date(),
      });
      setIsClient(newRole);

      navigation.navigate("EditProfile", { newProfile: true });
    } catch (error) {
      // gérer l'erreur si besoin
    }
    setUpdating(false);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.roleRow}>
        <Text style={styles.label}>Je suis</Text>
        <Pressable
          onPress={handleSwitchRole}
          style={({ pressed }) => [
            styles.switchContainer,
            pressed && { opacity: 0.7 },
            updating && { opacity: 0.5 },
          ]}
          disabled={updating}
        >
          <Text
            style={[
              styles.roleText,
              { color: isClient ? "#555" : COLORS.primary },
            ]}
          >
            {isClient ? "Demandeur" : "Couturière"}
          </Text>
          <Switch
            value={!isClient}
            onValueChange={handleSwitchRole}
            trackColor={{ false: "#BBB", true: "#BBB" }}
            thumbColor={!isClient ? COLORS.primary : "#444"}
            ios_backgroundColor="#CCC"
            disabled={updating}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontFamily: "OpenSans_700Bold",
    fontSize: 18,
    color: "#222",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleText: {
    fontFamily: "OpenSans_700Bold",
    fontSize: 16,
    marginRight: 12,
  },
});
