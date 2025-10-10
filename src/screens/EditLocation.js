import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { COLORS } from "../styles/colors";
import { CommonActions } from "@react-navigation/native";
import { showMessage } from "react-native-flash-message";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Loader from "../components/Loader";
import { useTranslation } from "react-i18next";

const GOOGLE_API_KEY = process.env.GOOGLE_MAP_API_GEOCODING;

export default function EditLocation({ navigation, route }) {
  const { newProfile } = route?.params || {};
  const { t } = useTranslation();
  const user = auth.currentUser;
  
  const [fields, setFields] = useState({
    address: "",
    postalCode: "",
    city: "",
    department: "",
  });
  const [search, setSearch] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    async function loadUserInfo() {
      if (user) {
        setLoading(true);
        try {
          const userDoc = doc(db, "users", user.uid);
          const snapshot = await getDoc(userDoc);
          if (snapshot.exists()) {
            const data = snapshot.data();
            setFields({
              address: data?.address || "",
              postalCode: data?.postalCode || "",
              city: data?.city || "",
              department: data?.department || "",
            });
            setSearch(data?.address || "");
          }
        } catch (error) {
          console.error("Erreur chargement:", error);
        }
        setLoading(false);
      }
    }
    loadUserInfo();
  }, [user]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t("myLocation"),
    });
  }, [navigation, t]);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (search.length < 3) {
        setPredictions([]);
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        search
      )}&types=address&language=fr&components=country:FR&key=${GOOGLE_API_KEY}`;
      
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data?.predictions) {
          setPredictions(data.predictions);
        } else {
          setPredictions([]);
        }
      } catch (error) {
        console.error("Erreur autocomplétion:", error);
        setPredictions([]);
      }
    };

    const timeoutId = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const fetchFullAddress = async (place_id) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=address_component,formatted_address&language=fr&key=${GOOGLE_API_KEY}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      
      let fullAddress = data?.result?.formatted_address || "";
      let city = "";
      let postalCode = "";
      let department = "";

      if (data?.result?.address_components) {
        for (let comp of data.result.address_components) {
          if (comp.types.includes("locality") || comp.types.includes("postal_town")) {
            city = comp.long_name;
          }
          if (comp.types.includes("postal_code")) {
            postalCode = comp.long_name;
          }
          if (comp.types.includes("administrative_area_level_2")) {
            department = comp.long_name;
          }
        }
      }
      
      return { postalCode, city, department, address: fullAddress };
    } catch (error) {
      console.error("Erreur détails adresse:", error);
      return {};
    }
  };

  const handleAddressSelect = async (prediction) => {
    setUpdating(true);
    setSearch(prediction.description);
    setShowPredictions(false);

    const address = await fetchFullAddress(prediction.place_id);

    const newFields = {
      address: address.address || prediction.description || "",
      postalCode: address.postalCode || "",
      city: address.city || "",
      department: address.department || "",
    };

    setFields(newFields);

    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          ...newFields,
          updatedAt: new Date(),
        });
        
        showMessage({
          message: t("addressSaved"),
          description: t("locationUpdated"),
          type: "success",
          icon: "success",
        });
      } catch (error) {
        console.error("Erreur sauvegarde:", error);
        showMessage({
          message: t("error"),
          description: t("addressSaveError"),
          type: "danger",
          icon: "danger",
        });
      }
    }

    setPredictions([]);
    setUpdating(false);
  };

  const handleManualSave = async () => {
    if (!fields.address.trim() || !fields.postalCode.trim() || !fields.city.trim()) {
      showMessage({
        message: t("requiredFields"),
        description: t("requiredFieldsDesc"),
        type: "warning",
        icon: "warning",
      });
      return;
    }

    setUpdating(true);
    
    try {
      await updateDoc(doc(db, "users", user.uid), {
        address: fields.address.trim(),
        postalCode: fields.postalCode.trim(),
        city: fields.city.trim(),
        department: fields.department.trim(),
        updatedAt: new Date(),
      });

      showMessage({
        message: t("success"),
        description: t("locationUpdated"),
        type: "success",
        icon: "success",
      });

    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      showMessage({
        message: t("error"),
        description: t("savingError"),
        type: "danger",
        icon: "danger",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-5 pt-6 pb-32">
            <Animated.View
              entering={FadeInDown.duration(300)}
              className="border-l-4 bg-gray-50 px-4 py-3 mb-8"
              style={{ borderLeftColor: COLORS.secondary }}
            >
              <Text
                className="text-sm text-gray-700 leading-5"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                {t("locationInfo")}
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(300).delay(100)}
              className="mb-8"
            >
              <Text
                className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                {t("searchAddress")}
              </Text>
              
              <View className="bg-white border border-gray-200">
                <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
                  <MaterialIcons name="search" size={20} color="#6B7280" />
                  <TextInput
                    ref={inputRef}
                    value={search}
                    onChangeText={(text) => {
                      setSearch(text);
                      setShowPredictions(true);
                    }}
                    onFocus={() => setShowPredictions(true)}
                    placeholder={t("searchAddressPlaceholder")}
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 text-sm text-gray-900"
                    style={{ fontFamily: "OpenSans_400Regular", height: 36 }}
                  />
                  {updating && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )}
                </View>

                {showPredictions && predictions.length > 0 && (
                  <View className="max-h-60">
                    <FlatList
                      data={predictions}
                      keyExtractor={(item) => item.place_id}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <Pressable
                          onPress={() => handleAddressSelect(item)}
                          className="px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                          disabled={updating}
                        >
                          <View className="flex-row items-start">
                            <MaterialIcons
                              name="place"
                              size={16}
                              color={COLORS.primary}
                              style={{ marginTop: 2 }}
                            />
                            <Text
                              className="flex-1 ml-3 text-sm text-gray-700"
                              style={{ fontFamily: "OpenSans_400Regular" }}
                              numberOfLines={2}
                            >
                              {item.description}
                            </Text>
                          </View>
                        </Pressable>
                      )}
                    />
                  </View>
                )}
              </View>
            </Animated.View>

            <View className="flex-row items-center my-8">
              <View className="flex-1 h-px bg-gray-300" />
              <Text
                className="px-4 text-xs text-gray-400 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                {t("orManualEntry")}
              </Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            <Animated.View entering={FadeInDown.duration(300).delay(200)}>
              <View className="space-y-5">
                <View>
                  <Text
                    className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                  >
                    {t("fullAddress")}
                  </Text>
                  <View className="bg-white border border-gray-200 px-4 py-3">
                    <TextInput
                      value={fields.address}
                      onChangeText={(text) =>
                        setFields((prev) => ({ ...prev, address: text }))
                      }
                      placeholder={t("addressPlaceholder")}
                      placeholderTextColor="#9CA3AF"
                      className="text-sm text-gray-900"
                      style={{ fontFamily: "OpenSans_400Regular", height: 36, paddingVertical: 0 }}
                    />
                  </View>
                </View>

                <View>
                  <Text
                    className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                  >
                    {t("postalCode")} *
                  </Text>
                  <View className="bg-white border border-gray-200 px-4 py-3">
                    <TextInput
                      value={fields.postalCode}
                      onChangeText={(text) =>
                        setFields((prev) => ({ ...prev, postalCode: text }))
                      }
                      placeholder={t("postalCodePlaceholder")}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={5}
                      className="text-sm text-gray-900"
                      style={{ fontFamily: "OpenSans_400Regular", height: 36, paddingVertical: 0 }}
                    />
                  </View>
                </View>

                <View>
                  <Text
                    className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                  >
                    {t("city")} *
                  </Text>
                  <View className="bg-white border border-gray-200 px-4 py-3">
                    <TextInput
                      value={fields.city}
                      onChangeText={(text) =>
                        setFields((prev) => ({ ...prev, city: text }))
                      }
                      placeholder={t("cityPlaceholder")}
                      placeholderTextColor="#9CA3AF"
                      className="text-sm text-gray-900"
                      style={{ fontFamily: "OpenSans_400Regular", height: 36, paddingVertical: 0 }}
                    />
                  </View>
                </View>

                <View>
                  <Text
                    className="text-xs text-gray-500 mb-2 uppercase tracking-wider"
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                  >
                    {t("department")}
                  </Text>
                  <View className="bg-white border border-gray-200 px-4 py-3">
                    <TextInput
                      value={fields.department}
                      onChangeText={(text) =>
                        setFields((prev) => ({ ...prev, department: text }))
                      }
                      placeholder={t("departmentPlaceholder")}
                      placeholderTextColor="#9CA3AF"
                      className="text-sm text-gray-900"
                      style={{ fontFamily: "OpenSans_400Regular", height: 36, paddingVertical: 0 }}
                    />
                  </View>
                </View>
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
            onPress={handleManualSave}
            disabled={updating}
            className="py-4 items-center flex-row justify-center"
            style={{
              backgroundColor: updating ? "#D1D5DB" : COLORS.primary,
            }}
          >
            {updating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialIcons name="check" size={18} color="#fff" />
                <Text
                  className="text-sm font-bold text-white ml-2 uppercase tracking-wider"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  {newProfile ? t("continue") : t("save")}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
