import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  ScrollView,
} from "react-native";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { COLORS } from "../styles/colors";
import { MaterialIcons } from "@expo/vector-icons";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import Loader from "../components/Loader";

export default function EditProfile({ navigation, route }) {
  const { fromHome } = route?.params || {};

  const user = auth.currentUser;
  const [fields, setFields] = useState({
    username: "",
    firstname: "",
    lastname: "",
  });
  const [isClient, setIsClient] = useState(true);
  const [equip, setEquip] = useState({
    sewingMachine: false,
    serger: false,
    mobileSewingMachine: false,
    mobileSerger: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isClient ? "Profil Demandeur" : "Profil Couturier",
    });
  }, [navigation, isClient]);

  useEffect(() => {
    async function loadUserInfo() {
      if (user) {
        try {
          setLoading(true);
          const userDoc = doc(db, "users", user.uid);
          const snapshot = await getDoc(userDoc);
          if (snapshot.exists()) {
            const data = snapshot.data();
            setFields({
              username: data?.username || "",
              firstname: data?.firstname || "",
              lastname: data?.lastname || "",
            });
            setIsClient(data?.isClient !== undefined ? data.isClient : true);
            setEquip({
              sewingMachine: !!data?.sewingMachine,
              serger: !!data?.serger,
              mobileSewingMachine: !!data?.mobileSewingMachine,
              mobileSerger: !!data?.mobileSerger,
            });
          }
        } catch (error) {
          console.error("Erreur chargement:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadUserInfo();
  }, [user]);

  const handleChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleEquipSwitch = (key) => {
    setEquip((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const validateFields = () => {
    if (!fields.username.trim()) {
      showMessage({
        message: "Champ requis",
        description: "Le nom d'utilisateur est obligatoire.",
        type: "warning",
        icon: "warning",
      });
      return false;
    }
    if (!fields.firstname.trim()) {
      showMessage({
        message: "Champ requis",
        description: "Le prénom est obligatoire.",
        type: "warning",
        icon: "warning",
      });
      return false;
    }
    if (!fields.lastname.trim()) {
      showMessage({
        message: "Champ requis",
        description: "Le nom est obligatoire.",
        type: "warning",
        icon: "warning",
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateFields()) {
      return;
    }

    setSaving(true);
    if (user) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            username: fields.username.trim(),
            firstname: fields.firstname.trim(),
            lastname: fields.lastname.trim(),
            ...equip,
            updatedAt: new Date(),
          },
          { merge: true }
        );

        showMessage({
          message: "Profil enregistré",
          description: "Vos informations ont été mises à jour.",
          type: "success",
          icon: "success",
        });

        setTimeout(() => {
          fromHome ? navigation.replace("Home") : navigation.goBack();
        }, 500);
      } catch (error) {
        console.error("Erreur sauvegarde:", error);
        showMessage({
          message: "Erreur",
          description: "Impossible d'enregistrer les modifications.",
          type: "danger",
          icon: "danger",
        });
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const inputFields = [
    { key: "username", label: "Nom d'utilisateur *", placeholder: "VotreNom123" },
    { key: "firstname", label: "Prénom *", placeholder: "Jean" },
    { key: "lastname", label: "Nom *", placeholder: "Dupont" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="px-5 pt-6">
          {/* Info Header */}
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="border-l-4 bg-gray-50 px-4 py-3 mb-8"
            style={{ borderLeftColor: COLORS.primary }}
          >
            <Text
              className="text-sm text-gray-700 leading-5"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              Ces informations seront visibles publiquement sur vos projets et offres
            </Text>
          </Animated.View>

          {/* Section Informations */}
          <Animated.View entering={FadeInDown.duration(300).delay(50)}>
            <Text
              className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              Informations personnelles
            </Text>

            <View className="space-y-5">
              {inputFields.map(({ key, label, placeholder }) => (
                <View key={key}>
                  <Text
                    className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                  >
                    {label}
                  </Text>
                  <View className="bg-white border border-gray-200 px-4 py-3">
                    <TextInput
                      value={fields[key]}
                      onChangeText={(v) => handleChange(key, v)}
                      placeholder={placeholder}
                      placeholderTextColor="#9CA3AF"
                      className="text-sm text-gray-900"
                      style={{
                        fontFamily: "OpenSans_400Regular",
                        height: 36,
                        paddingVertical: 0,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Section Équipements */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(100)}
            className="mt-8"
          >
            <Text
              className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              Équipements
            </Text>

            <View className="bg-white border border-gray-200">
              {!isClient ? (
                <>
                  {/* Machine mobile */}
                  <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                    <View className="flex-1 pr-4">
                      <Text
                        className="text-sm text-gray-900 leading-5"
                        style={{ fontFamily: "OpenSans_400Regular" }}
                      >
                        Machine à coudre mobile
                      </Text>
                      <Text
                        className="text-xs text-gray-500 mt-1"
                        style={{ fontFamily: "OpenSans_400Regular" }}
                      >
                        Je peux me déplacer avec
                      </Text>
                    </View>
                    <Switch
                      value={equip.mobileSewingMachine}
                      onValueChange={() => handleEquipSwitch("mobileSewingMachine")}
                      thumbColor={equip.mobileSewingMachine ? "#fff" : "#f4f3f4"}
                      trackColor={{ true: COLORS.primary, false: "#D1D5DB" }}
                      ios_backgroundColor="#D1D5DB"
                    />
                  </View>

                  {/* Surjeteuse mobile */}
                  <View className="flex-row items-center justify-between px-4 py-4">
                    <View className="flex-1 pr-4">
                      <Text
                        className="text-sm text-gray-900 leading-5"
                        style={{ fontFamily: "OpenSans_400Regular" }}
                      >
                        Surjeteuse mobile
                      </Text>
                      <Text
                        className="text-xs text-gray-500 mt-1"
                        style={{ fontFamily: "OpenSans_400Regular" }}
                      >
                        Je peux me déplacer avec
                      </Text>
                    </View>
                    <Switch
                      value={equip.mobileSerger}
                      onValueChange={() => handleEquipSwitch("mobileSerger")}
                      thumbColor={equip.mobileSerger ? "#fff" : "#f4f3f4"}
                      trackColor={{ true: COLORS.primary, false: "#D1D5DB" }}
                      ios_backgroundColor="#D1D5DB"
                    />
                  </View>
                </>
              ) : (
                <>
                  {/* Machine à coudre */}
                  <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                    <View className="flex-1 pr-4">
                      <Text
                        className="text-sm text-gray-900 leading-5"
                        style={{ fontFamily: "OpenSans_400Regular" }}
                      >
                        Machine à coudre
                      </Text>
                      <Text
                        className="text-xs text-gray-500 mt-1"
                        style={{ fontFamily: "OpenSans_400Regular" }}
                      >
                        Je possède cet équipement
                      </Text>
                    </View>
                    <Switch
                      value={equip.sewingMachine}
                      onValueChange={() => handleEquipSwitch("sewingMachine")}
                      thumbColor={equip.sewingMachine ? "#fff" : "#f4f3f4"}
                      trackColor={{ true: COLORS.primary, false: "#D1D5DB" }}
                      ios_backgroundColor="#D1D5DB"
                    />
                  </View>

                  {/* Surjeteuse */}
                  <View className="flex-row items-center justify-between px-4 py-4">
                    <View className="flex-1 pr-4">
                      <Text
                        className="text-sm text-gray-900 leading-5"
                        style={{ fontFamily: "OpenSans_400Regular" }}
                      >
                        Surjeteuse
                      </Text>
                      <Text
                        className="text-xs text-gray-500 mt-1"
                        style={{ fontFamily: "OpenSans_400Regular" }}
                      >
                        Je possède cet équipement
                      </Text>
                    </View>
                    <Switch
                      value={equip.serger}
                      onValueChange={() => handleEquipSwitch("serger")}
                      thumbColor={equip.serger ? "#fff" : "#f4f3f4"}
                      trackColor={{ true: COLORS.primary, false: "#D1D5DB" }}
                      ios_backgroundColor="#D1D5DB"
                    />
                  </View>
                </>
              )}
            </View>

            <View className="flex-row items-center mt-2 px-1">
              <MaterialIcons name="visibility" size={12} color="#9CA3AF" />
              <Text
                className="text-xs text-gray-500 ml-1"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                Visible publiquement
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Bouton fixe */}
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
          onPress={handleSave}
          disabled={saving}
          className="py-4 items-center flex-row justify-center"
          style={{
            backgroundColor: saving ? "#D1D5DB" : COLORS.primary,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialIcons name="check" size={18} color="#fff" />
              <Text
                className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                Enregistrer
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}