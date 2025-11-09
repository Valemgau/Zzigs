import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from "react-native";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { COLORS } from "../styles/colors";
import { MaterialIcons } from "@expo/vector-icons";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import Loader from "../components/Loader";
import { Image } from "expo-image";

const LANGUAGES = [
  {
    code: "fr",
    label: "Français",
    nativeName: "Français",
    flag: require("../../assets/img/fr.png"),
  },
  {
    code: "en",
    label: "English",
    nativeName: "English",
    flag: require("../../assets/img/en.png"),
  },
  {
    code: "de",
    label: "Allemand",
    nativeName: "Deutsch",
    flag: require("../../assets/img/de.webp"),
  },
  {
    code: "es",
    label: "Espagnol",
    nativeName: "Español",
    flag: require("../../assets/img/es.webp"),
  },
  {
    code: "it",
    label: "Italien",
    nativeName: "Italiano",
    flag: require("../../assets/img/it.png"),
  },
];

export default function EditLanguage({ navigation }) {
  const { t, i18n } = useTranslation();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState(i18n.language || "fr");
  const [updating, setUpdating] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t("language"),
    });
  }, [navigation, t]);

  useEffect(() => {
    const loadLang = async () => {
      if (user) {
        setLoading(true);
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (
              data.language &&
              LANGUAGES.find((l) => l.code === data.language)
            ) {
              setSelectedLang(data.language);
            }
          }
        } catch (error) {
          console.error("Erreur chargement langue:", error);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    loadLang();
  }, [user]);

  const handleSelectLang = async (code) => {
    if (code === selectedLang) return;

    setUpdating(true);

    try {
      setSelectedLang(code);
      i18n.changeLanguage(code);

      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          language: code,
          updatedAt: new Date(),
        });
      }

      showMessage({
        message: t("languageChanged"),
        description: t("languageChangedDesc"),
        type: "success",
        icon: "success",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Erreur changement langue:", error);
      showMessage({
        message: t("error"),
        description: t("languageChangeError"),
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

  const renderItem = ({ item, index }) => {
    const isSelected = item.code === selectedLang;

    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
        <Pressable
          onPress={() => handleSelectLang(item.code)}
          disabled={updating}
          className="mb-3"
          style={{
            opacity: updating && !isSelected ? 0.5 : 1,
          }}
        >
          <View
            className="bg-white border-2 px-4 py-4 flex-row items-center"
            style={{
              borderColor: isSelected ? COLORS.primary : "#E5E7EB",
            }}
          >
            <View
              className="w-12 h-12 items-center justify-center mr-4"
              style={{
                backgroundColor: "#F9FAFB",
              }}
            >
              <Image
                source={item.flag}
                style={{ width: 32, height: 24 }}
                contentFit="contain"
              />
            </View>

            <View className="flex-1">
              <Text
                className="text-base font-bold mb-1"
                style={{
                  fontFamily: "OpenSans_700Bold",
                  color: isSelected ? COLORS.primary : "#111827",
                }}
              >
                {item.label}
              </Text>
              <Text
                className="text-sm"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  color: "#6B7280",
                }}
              >
                {item.nativeName}
              </Text>
            </View>

            {isSelected ? (
              <View
                className="w-6 h-6 items-center justify-center"
                style={{ backgroundColor: COLORS.primary }}
              >
                <MaterialIcons name="check" size={18} color="#fff" />
              </View>
            ) : (
              <View
                className="w-6 h-6 border-2"
                style={{ borderColor: "#D1D5DB" }}
              />
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-6 pb-8">
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="border-l-4 bg-gray-50 px-4 py-3 mb-6"
            style={{ borderLeftColor: COLORS.secondary }}
          >
            <Text
              className="text-sm text-gray-700 leading-5"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              {t("chooseDisplayLanguage")}
            </Text>
          </Animated.View>

          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            scrollEnabled={false}
            extraData={selectedLang}
          />

          <Animated.View
            entering={FadeInDown.duration(300).delay(150)}
            className="bg-blue-50 border-l-4 px-4 py-3 mt-4"
            style={{ borderLeftColor: COLORS.primary }}
          >
            <Text
              className="text-xs font-bold mb-1"
              style={{
                fontFamily: "OpenSans_700Bold",
                color: COLORS.primary,
              }}
            >
              {t("note")}
            </Text>
            <Text
              className="text-xs text-gray-700"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              {t("languageChangeNote")}
            </Text>
          </Animated.View>
        </View>
      </ScrollView>

      {updating && <Loader />}
    </SafeAreaView>
  );
}
