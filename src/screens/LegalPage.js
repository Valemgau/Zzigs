import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import i18n from "../../i18n";

const legalLinks = [
  {
    label: "Conditions Générales d’Utilisation (CGU)",
    icon: "document-text-outline",
    url: "https://connectetmove.com/termes.html",
    color: "#3B82F6",
  },
  {
    label: "Politique de Confidentialité",
    icon: "shield-checkmark-outline",
    url: "https://connectetmove.com/vie%20privee.html",
    color: "#10B981",
  },
  {
    label: "Mentions Légales",
    icon: "information-circle-outline",
    url: "https://connectetmove.com/juridique.html",
    color: "#EF4444",
  },
  {
    label: "Nous contacter",
    icon: "mail-outline",
    url: "https://connectetmove.com/contacter.html",
    color: "#3B82F6",
  },
];

export default function LegalPage() {
  return (
    <KeyboardAwareScrollView
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraHeight={200}
      className="flex-1 bg-gray-100 dark:bg-gray-900"
    >
      <View className="p-5">
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <Text
            className="text-2xl font-semibold text-gray-900 dark:text-white mb-2"
            style={{ fontFamily: "Inter_500Medium" }}
          >{i18n.t("informations_legales")}</Text>
          <Text
            className="text-sm text-gray-500 dark:text-gray-400 mb-4"
            style={{ fontFamily: "Inter_400Regular" }}
          >{i18n.t(
            "retrouvez_ici_tous_les_documents_legaux_concernant_lutilisation_de_lapplication"
          )}</Text>
          {legalLinks.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => Linking.openURL(item.url)}
              className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-4 mb-3 border border-gray-200 dark:border-gray-600"
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={item.color}
                style={{ marginRight: 16 }}
              />
              <Text
                className="flex-1 text-base font-medium text-gray-800 dark:text-gray-100"
                style={{ fontFamily: "Inter_500Medium" }}
              >
                {item.label}
              </Text>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color="#9CA3AF"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
