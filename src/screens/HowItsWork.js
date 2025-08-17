import React from "react";
import { ScrollView, View, Text, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import i18n from "../../i18n";

const HowItWorks = ({ navigation }) => {
  const sections = [
    {
      title: "Objectifs de Connect & Move",
      icon: "bulb-outline",
      color: "#2563EB",
      items: [
        "Faciliter la rencontre entre passionnés",
        "Encourager la pratique d'activités variées",
        "Créer une communauté dynamique",
        "Offrir des opportunités exclusives",
      ],
    },
    {
      title: "Comment utiliser l'application",
      icon: "help-circle-outline",
      color: "#059669",
      items: [
        "Inscription et création de profil",
        "Recherche d'activités et de partenaires",
        "Participation et organisation d'événements",
        "Engagement communautaire",
      ],
    },
    {
      title: "Système de points et fidélité",
      icon: "star-outline",
      color: "#D97706",
      items: [
        "Inviter un ami non-premium : 20 points",
        "Inviter un ami premium : 100 points",
        "Participer à une activité : 10 points",
        "400 points = 1 mois premium offert",
        "900 points = 2 mois premium offerts",
      ],
    },
    {
      title: "Programme de défis",
      icon: "trophy-outline",
      color: "#DC2626",
      items: [
        "Défis quotidiens, hebdomadaires et mensuels",
        "Défis collectifs et événementiels",
        "Gagnez des badges et des titres honorifiques",
        "Grimpez dans les classements",
      ],
    },
    {
      title: "Avantages exclusifs",
      icon: "gift-outline",
      color: "#7C3AED",
      items: [
        "Offres spéciales chez nos partenaires",
        "Accès à des événements exclusifs",
        "Fonctionnalités premium",
      ],
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <Animated.View entering={FadeInDown.duration(500)} className="mb-20 px-6">
        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className="text-3xl mb-8 dark:text-white py-4"
        >
          {i18n.t("tarifs_titre")}
        </Text>

        {[
          {
            color: "green",
            icon: "bicycle-outline",
            title: i18n.t("plan_free_label"),
            details: [i18n.t("plan_free_ideal"), i18n.t("plan_free_price")],
            features: i18n.t("plan_free_features", { returnObjects: true }),
          },
          {
            color: "blue",
            icon: "walk-outline",
            title: i18n.t("plan_premium_label"),
            details: [
              i18n.t("plan_premium_price_month"),
              i18n.t("plan_premium_price_year"),
              i18n.t("plan_premium_ideal"),
            ],
            features: i18n.t("plan_premium_features", { returnObjects: true }),
          },
          {
            color: "purple",
            icon: "business-outline",
            title: i18n.t("plan_business_label"),
            details: [
              i18n.t("plan_business_price_month"),
              i18n.t("plan_business_price_year"),
              i18n.t("plan_business_ideal"),
            ],
            features: i18n.t("plan_business_features", { returnObjects: true }),
          },
        ].map((plan, i) => (
          <View key={i} className="mb-10">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 items-center justify-center mr-3">
                <Ionicons name={plan.icon} size={20} color={plan.color} />
              </View>
              <Text
                style={{ fontFamily: "Inter_500Medium" }}
                className="text-xl font-semibold text-gray-700 dark:text-white"
              >
                {plan.title}
              </Text>
            </View>
            <View className="bg-white dark:bg-gray-800 rounded p-4">
              {plan.details.map((detail, idx) => (
                <Text
                  key={idx}
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-gray-600 dark:text-gray-300 mb-2"
                >
                  {detail}
                </Text>
              ))}
              <View className="mt-2">
                {plan.features.map((feature, idx) => (
                  <View key={idx} className="flex-row items-start py-1">
                    <View className="w-1 h-1 rounded-full bg-blue-500 mr-3 mt-2" />
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      className="text-gray-600 dark:text-gray-300"
                    >
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}

        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className="text-2xl mb-4 dark:text-white"
        >
          {i18n.t("parrainage_titre")}
        </Text>
        <Text
          style={{ fontFamily: "Inter_400Regular" }}
          className="mb-6 text-gray-600 dark:text-gray-300"
        >
          {i18n.t("parrainage_description")}
        </Text>

        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className="mb-2 text-lg dark:text-white"
        >
          {i18n.t("parrainage_actions_titre")}
        </Text>
        {[i18n.t("parrainage_action_1"), i18n.t("parrainage_action_2")].map(
          (action, i) => (
            <Text
              key={i}
              style={{ fontFamily: "Inter_400Regular" }}
              className="text-gray-600 dark:text-gray-300 mb-1"
            >
              {action}
            </Text>
          )
        )}

        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className="mt-4 mb-2 text-lg dark:text-white"
        >
          {i18n.t("parrainage_seuils_titre")}
        </Text>
        {[
          i18n.t("parrainage_seuil_1"),
          i18n.t("parrainage_seuil_2"),
          i18n.t("parrainage_seuil_3"),
          i18n.t("parrainage_seuil_4"),
        ].map((seuil, i) => (
          <Text
            key={i}
            style={{ fontFamily: "Inter_400Regular" }}
            className="text-gray-600 dark:text-gray-300 mb-1"
          >
            {seuil}
          </Text>
        ))}

        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className="mt-6 mb-3 text-lg dark:text-white"
        >
          {i18n.t("parrainage_filleul_titre")}
        </Text>
        <Text
          style={{ fontFamily: "Inter_400Regular" }}
          className="text-gray-600 dark:text-gray-300 mb-2"
        >
          {i18n.t("parrainage_filleul_bonus")}
        </Text>
        <Text
          style={{ fontFamily: "Inter_400Regular" }}
          className="text-gray-600 dark:text-gray-300 mb-3 ml-3"
        >
          {i18n.t("parrainage_filleul_bonus_explication")}
        </Text>
        <Text
          style={{ fontFamily: "Inter_400Regular" }}
          className="text-gray-600 dark:text-gray-300 mb-2"
        >
          {i18n.t("parrainage_filleul_premium")}
        </Text>
        <Text
          style={{ fontFamily: "Inter_400Regular" }}
          className="text-gray-600 dark:text-gray-300 mb-1 ml-3"
        >
          {i18n.t("parrainage_filleul_premium_explication1")}
        </Text>
        <Text
          style={{ fontFamily: "Inter_400Regular" }}
          className="text-gray-600 dark:text-gray-300 mb-6 ml-3"
        >
          {i18n.t("parrainage_filleul_premium_explication2")}
        </Text>

        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className="text-2xl mb-4 dark:text-white"
        >
          {i18n.t("particuliers_titre")}
        </Text>
        {[
          i18n.t("particuliers_feature_1"),
          i18n.t("particuliers_feature_2"),
          i18n.t("particuliers_feature_3"),
          i18n.t("particuliers_feature_4"),
        ].map((text, i) => (
          <View key={i} className="flex-row items-start py-1">
            <View className="w-1 h-1 rounded-full bg-blue-500 mr-3 mt-2" />
            <Text
              style={{ fontFamily: "Inter_400Regular" }}
              className="text-gray-600 dark:text-gray-300"
            >
              {text}
            </Text>
          </View>
        ))}

        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className="mt-8 mb-4 text-2xl dark:text-white"
        >
          {i18n.t("entreprises_titre")}
        </Text>
        {[
          i18n.t("entreprises_feature_1"),
          i18n.t("entreprises_feature_2"),
          i18n.t("entreprises_feature_3"),
          i18n.t("entreprises_feature_4"),
          i18n.t("entreprises_feature_5"),
        ].map((text, i) => (
          <View key={i} className="flex-row items-start py-1">
            <View className="w-1 h-1 rounded-full bg-blue-500 mr-3 mt-2" />
            <Text
              style={{ fontFamily: "Inter_400Regular" }}
              className="text-gray-600 dark:text-gray-300"
            >
              {text}
            </Text>
          </View>
        ))}

        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className="mt-8 text-2xl mb-4 dark:text-white"
        >
          {i18n.t("communaute_titre")}
        </Text>
        <Text
          style={{ fontFamily: "Inter_400Regular" }}
          className="text-gray-600 dark:text-gray-300 mb-2"
        >
          {i18n.t("communaute_description")}
        </Text>
        {[
          i18n.t("communaute_point_1"),
          i18n.t("communaute_point_2"),
          i18n.t("communaute_point_3"),
        ].map((text, i) => (
          <View key={i} className="flex-row items-start py-1">
            <View className="w-1 h-1 rounded-full bg-blue-500 mr-3 mt-2" />
            <Text
              style={{ fontFamily: "Inter_400Regular" }}
              className="text-gray-600 dark:text-gray-300"
            >
              {text}
            </Text>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
};

export default HowItWorks;
