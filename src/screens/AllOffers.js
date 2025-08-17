import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Pressable,
} from "react-native";
import Purchases from "react-native-purchases";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../i18n";

const AllOffers = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("gratuit");
  const [subscriptionState, setSubscriptionState] = useState(null);
  const [offerings, setOfferings] = useState(null);

  const fetchSubscriptionState = async () => {
    try {
      const purchaserInfo = await Purchases.getCustomerInfo();
      const entitlements = purchaserInfo.entitlements.active;

      let subType = "gratuit";
      if (entitlements.pro) {
        subType = "pro";
      } else if (entitlements.premium) {
        subType = "premium";
      }

      setActiveTab(subType);
      setSubscriptionState(subType);
      updateUserSubscriptionInFirebase(subType);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'état d'abonnement :",
        error
      );
    }
  };

  const updateUserSubscriptionInFirebase = async (subscriptionType) => {
    const userUID = auth().currentUser?.uid;

    if (!userUID) {
      console.error("Utilisateur non connecté.");
      return;
    }

    try {
      await firestore().collection("users").doc(userUID).update({
        sub: subscriptionType,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Abonnement mis à jour : ${subscriptionType}`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de Firebase :", error);
    }
  };

  const fetchOfferings = async () => {
    try {
      const fetchedOfferings = await Purchases.getOfferings();
      if (fetchedOfferings.current) {
        setOfferings(fetchedOfferings.current);
      } else {
        console.log("Aucune offre disponible.");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des offres :", error);
    }
  };

  useEffect(() => {
    fetchSubscriptionState();
    fetchOfferings();
  }, []);

  const handlePurchase = async (packageToPurchase) => {
    try {
      const purchaserInfo = await Purchases.purchasePackage(packageToPurchase);

      if (purchaserInfo.customerInfo.entitlements.active) {
        const activeEntitlement = Object.keys(
          purchaserInfo.customerInfo.entitlements.active
        )[0];

        const userUID = auth().currentUser?.uid;

        if (!userUID) {
          showMessage({
            message: "Erreur",
            description: "Utilisateur non connecté.",
            type: "danger",
          });
          return;
        }

        await firestore().collection("users").doc(userUID).update({
          sub: activeEntitlement,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        await AsyncStorage.setItem("sub", activeEntitlement);

        showMessage({
          message: "Achat réussi",
          description: `Votre abonnement (${activeEntitlement}) a été activé avec succès, veuillez fermer l'application et la réouvrir pour voir les changements.`,
          type: "info",
        });
        navigation.goBack();
      }
    } catch (error) {
      if (!error.userCancelled) {
        console.error("Erreur lors de l'achat :", error);
        showMessage({
          message: "Erreur",
          description: "L'achat a échoué. Veuillez réessayer.",
          type: "danger",
        });
      }
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      "Annuler l'abonnement",
      "Pour annuler votre abonnement, veuillez accéder aux paramètres de votre compte sur l'App Store ou Google Play."
    );
  };

  const renderOffers = (type) => {
    if (!offerings)
      return <Text className="text-gray-500">{i18n.t("chargement")}</Text>;

    const filteredPackages = offerings.availablePackages.filter((pkg) =>
      type === "premium"
        ? pkg.identifier.includes("premium")
        : pkg.identifier.includes("pro")
    );

    if (filteredPackages.length === 0) {
      return (
        <Text className="text-gray-500">
          {i18n.t("aucune_offre_disponible")}
        </Text>
      );
    }

    return filteredPackages.map((pkg) => (
      <Pressable
        key={pkg.identifier}
        onPress={() => handlePurchase(pkg)}
        className="bg-gray-50 dark:bg-blue-900 rounded p-4 mb-4 flex-row items-center justify-between"
      >
        <View>
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {pkg.product.title}
          </Text>
          <Text className="text-gray-600 dark:text-gray-300">
            {pkg.product.priceString}
          </Text>
        </View>
        <Ionicons name="cart-outline" size={24} color="#2563EB" />
      </Pressable>
    ));
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Tabs */}
      <View className="flex-row justify-between bg-white dark:bg-gray-900 p-4 rounded-b-xl">
        {["gratuit", "premium", "pro"].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`p-2 rounded-full flex-1 mx-1 items-center ${
              activeTab === tab ? "bg-blue-500" : "bg-transparent"
            }`}
          >
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className={`capitalize text-base ${
                activeTab === tab ? "text-white" : "text-blue-500"
              }`}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>
      {/* Contenu */}

      <ScrollView className="flex-1 px-6 pt-6">
        <Text
          style={{ fontFamily: "Inter_700Bold" }}
          className="capitalize text-2xl text-gray-900 dark:text-white mb-4 text-center"
        >
          {activeTab === "gratuit" && i18n.t("formule_gratuite")}
          {activeTab === "premium" && i18n.t("formule_premium")}
          {activeTab === "pro" && i18n.t("formule_entreprise")}
        </Text>

        {activeTab === "gratuit"
          ? subscriptionState !== "gratuit" && (
              // <TouchableOpacity
              //   onPress={handleCancelSubscription}
              //   className="bg-red-500 p-4 rounded-full flex-row items-center justify-center"
              // >
              //   <Ionicons name="close-circle-outline" size={20} color="#FFF" />
              //   <Text
              //     style={{ fontFamily: "Inter_700Bold" }}
              //     className="ml-2 text-white text-base"
              //   >
              //     Revenir à la formule gratuite
              //   </Text>
              // </TouchableOpacity>
              <Text></Text>
            )
          : renderOffers(activeTab)}
        <Animated.View entering={FadeIn.duration(200)}>
          {activeTab === "gratuit" && (
            <View>
              {[
                "acces_limite_aux_fonctionnalites_de_base",
                "10_messages_max_par_jour",
                "5_likes_aux_partenaires_max_par_jour",
              ].map((key, index) => (
                <View
                  key={index}
                  style={{ flexDirection: "row", marginBottom: 8 }}
                >
                  <Text style={{ marginRight: 5 }}>-</Text>
                  <Text className="text-lg text-gray-600 dark:text-gray-400">
                    {i18n.t(key)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === "premium" && (
            <View className="px-4">
              {i18n
                .t("plan_premium_features", { returnObjects: true })
                .map((text, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      marginBottom: 8,
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={{ marginRight: 5 }}>-</Text>
                    <Text className="flex-1 text-lg text-gray-600 dark:text-gray-400">
                      {text}
                    </Text>
                    {index !== 0 &&
                      index !==
                        i18n.t("plan_premium_features", { returnObjects: true })
                          .length -
                          1 && (
                        <Text
                          className="bg-green-500 px-2 py-1 rounded-full text-white text-sm"
                          style={{ marginLeft: 5 }}
                        >
                          {i18n.t("new")}
                        </Text>
                      )}
                  </View>
                ))}
            </View>
          )}

          {activeTab === "pro" && (
            <View className="px-4">
              {i18n
                .t("plan_business_features", { returnObjects: true })
                .map((feature, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      marginBottom: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Text style={{ marginRight: 5 }}>-</Text>
                    <Text className="flex-1 text-lg text-gray-600 dark:text-gray-400">
                      {feature}
                    </Text>
                    {index !== 0 && (
                      <Text
                        className="bg-green-500 px-2 py-1 rounded-full text-white text-sm self-start"
                        style={{ marginLeft: 5 }}
                      >
                        {i18n.t("new")}
                      </Text>
                    )}
                  </View>
                ))}
            </View>
          )}
        </Animated.View>

        {/* Liste des offres ou bouton d'annulation */}

        {/* {renderOffers(activeTab)} */}
      </ScrollView>
    </View>
  );
};

export default AllOffers;
