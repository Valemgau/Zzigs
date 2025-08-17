import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  UIManager,
  LayoutAnimation,
  ActivityIndicator,
  Alert, // Importer ActivityIndicator
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import grantPromotionalEntitlement from "../utils/grantPromotionalEntitlement";
import Purchases from "react-native-purchases";
import i18n from "../../i18n";

// ... (Vos autres imports et la configuration de LayoutAnimation)

// --- Composants UI (CoinBalanceCard, ExchangeOptionCard, FaqItem restent les mêmes) ---
// Composant pour afficher le solde de pièces
const CoinBalanceCard = ({ coins }) => (
  <Animated.View
    entering={FadeInDown.duration(500).delay(100)}
    className="bg-white dark:bg-gray-800 rounded-xl  p-6 mb-8 mx-4 flex-row items-center justify-between"
  >
    <View>
      <Text
        className="text-gray-500 dark:text-gray-400 text-sm mb-1"
        style={{ fontFamily: "Inter_400Regular" }}
      >
        {i18n.t("solde_actuel")}
      </Text>
      <Text
        className="text-gray-900 dark:text-white text-3xl font-bold"
        style={{ fontFamily: "Inter_600SemiBold" }}
      >
        {coins} pièces
      </Text>
    </View>
    <View className="bg-yellow-400 dark:bg-yellow-500 p-3 rounded-full">
      <MaterialCommunityIcons name="bitcoin" size={32} color="white" />
    </View>
  </Animated.View>
);

// Composant pour une option d'échange
const ExchangeOptionCard = ({
  item,
  index,
  onPressExchange,
  userCoins,
  isExchanging,
  exchangingItemId,
}) => {
  // Déterminer si CE bouton spécifique est en cours d'échange OU si un autre échange est en cours
  const isCurrentlyExchanging = isExchanging && exchangingItemId === item.id;
  const isAnyExchanging = isExchanging && exchangingItemId !== null; // Un échange est en cours

  // Désactivé si coût non chargé OU si pièces insuffisantes OU si un échange est en cours
  const isDisabled =
    item.cost === null || userCoins < item.cost || isAnyExchanging;
  const showLoading = isCurrentlyExchanging; // Afficher le spinner uniquement pour cet item

  return (
    <Animated.View
      // ... (props Animated.View inchangées)
      className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 mx-4 flex-row items-center"
    >
      {/* ... (Icône et Textes inchangés) ... */}
      <View className={`p-3 rounded-lg mr-4 ${item.bgColor}`}>
        <Ionicons name={item.icon} size={24} color="white" />
      </View>
      <View className="flex-1 mr-2">
        <Text
          className="text-gray-900 dark:text-white font-semibold text-base"
          style={{ fontFamily: "Inter_500Medium" }}
        >
          {item.name}
        </Text>
        <Text
          className="text-yellow-600 dark:text-yellow-400 text-sm"
          style={{ fontFamily: "Inter_400Regular" }}
        >
          {item.cost !== null ? `${item.cost} pièces` : "chargement"}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onPressExchange(item.id, item.cost)}
        disabled={isDisabled || showLoading} // Désactiver si un échange est en cours
        className={`py-2 px-4 rounded-full min-w-[90px] flex items-center justify-center ${
          // min-width pour éviter le saut de taille
          isDisabled && !showLoading
            ? "bg-gray-400 dark:bg-gray-600 opacity-70" // Style désactivé normal
            : showLoading
            ? "bg-blue-300 dark:bg-blue-800" // Style pendant le chargement de cet item
            : "bg-blue-500 dark:bg-blue-600" // Style actif
        }`}
      >
        {showLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text
            className="text-white font-bold text-sm"
            style={{ fontFamily: "Inter_600SemiBold" }}
          >
            {i18n.t("échanger")}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Composant pour une question FAQ (Accordion)
const FaqItem = ({ item, onPress, isExpanded }) => {
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onPress();
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl  mb-4 mx-4 overflow-hidden">
      <TouchableOpacity
        onPress={toggleExpand}
        className="p-4 flex-row items-center justify-between"
        activeOpacity={0.8}
      >
        <Text
          className="text-gray-900 dark:text-white font-semibold text-base flex-1 mr-3"
          style={{ fontFamily: "Inter_500Medium" }}
        >
          {item.question}
        </Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={22}
          color={isExpanded ? "#3B82F6" : "#6B7280"} // Blue-500 or Gray-500
        />
      </TouchableOpacity>
      {isExpanded && (
        <View className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          {item.answers.map((answer, index) => (
            <Text
              key={index}
              style={{ fontFamily: "Inter_400Regular" }}
              className="text-gray-600 dark:text-gray-300 text-sm mb-2 leading-relaxed"
            >
              • {answer}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

// --- Page Principale ---

const CoinsPage = ({ navigation }) => {
  const [userCoins, setUserCoins] = useState(0);
  const [subscriptionPrices, setSubscriptionPrices] = useState({
    // Initialiser avec null pour indiquer le chargement
    premium_month: null,
    premium_year: null,
    pro_month: null,
    pro_year: null,
  });
  const [isLoading, setIsLoading] = useState(true); // État pour le chargement initial
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isExchanging, setIsExchanging] = useState(false); // État pour l'échange en cours
  const [exchangingItemId, setExchangingItemId] = useState(null); // Quel item est en cours d'échange

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true); // Commencer le chargement
      const userUID = auth().currentUser?.uid;

      if (userUID) {
        try {
          // Créer les promesses pour les deux requêtes Firestore
          const userDocPromise = firestore()
            .collection("users")
            .doc(userUID)
            .get();

          const exchangeDocPromise = firestore()
            .collection("admin") // Collection 'admin'
            .doc("exchangepoints") // Document 'exchangepoints'
            .get();

          // Exécuter les promesses en parallèle
          const [userDoc, exchangeDoc] = await Promise.all([
            userDocPromise,
            exchangeDocPromise,
          ]);

          // Traiter les résultats
          if (userDoc.exists) {
            setUserCoins(userDoc.data()?.pieces || 0);
          } else {
            setUserCoins(0); // Mettre 0 si le document utilisateur n'existe pas
          }

          if (exchangeDoc.exists) {
            const pricesData = exchangeDoc.data();
            // Mettre à jour l'état avec les prix récupérés ou null si non trouvés
            setSubscriptionPrices({
              premium_month: pricesData?.premium_month ?? null,
              premium_year: pricesData?.premium_year ?? null,
              pro_month: pricesData?.pro_month ?? null,
              pro_year: pricesData?.pro_year ?? null,
            });
          } else {
            console.warn(
              "Document 'exchangepoints' non trouvé dans la collection 'admin'."
            );
            // Laisser les prix à null
            setSubscriptionPrices({
              premium_month: null,
              premium_year: null,
              pro_month: null,
              pro_year: null,
            });
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données :", error);
          // Gérer l'erreur (par exemple, afficher un message à l'utilisateur)
          setUserCoins(0); // Réinitialiser les pièces en cas d'erreur
          setSubscriptionPrices({
            premium_month: null,
            premium_year: null,
            pro_month: null,
            pro_year: null,
          }); // Réinitialiser les prix
        } finally {
          setIsLoading(false); // Fin du chargement (succès ou échec)
        }
      } else {
        console.log("Utilisateur non connecté.");
        setIsLoading(false); // Fin du chargement si pas d'UID
        // Vous pourriez vouloir rediriger l'utilisateur vers la page de connexion ici
      }
    };

    fetchInitialData();
  }, []); // Le tableau vide assure que l'effet s'exécute une seule fois au montage

  // Structure des options d'échange (sera mise à jour avec les prix réels)
  const exchangeOptions = [
    {
      id: "premium_month", // Correspond à la clé dans Firestore et state
      name: "Abonnement Premium (1 mois)",
      cost: subscriptionPrices.premium_month, // Utilise l'état
      icon: "star-outline",
      bgColor: "bg-purple-500",
    },
    {
      id: "pro_month",
      name: "Abonnement Pro (1 mois)",
      cost: subscriptionPrices.pro_month, // Utilise l'état
      icon: "rocket-outline",
      bgColor: "bg-green-500",
    },
    // Ajoutez les versions annuelles si vous le souhaitez
    {
      id: "premium_year",
      name: "Abonnement Premium (1 an)",
      cost: subscriptionPrices.premium_year, // Utilise l'état
      icon: "calendar-outline", // ou autre icône pertinente
      bgColor: "bg-indigo-500",
    },
    {
      id: "pro_year",
      name: "Abonnement Pro (1 an)",
      cost: subscriptionPrices.pro_year, // Utilise l'état
      icon: "speedometer-outline", // ou autre icône pertinente
      bgColor: "bg-teal-500",
    },
  ];

  // Données pour la section FAQ (inchangées)
  const faqData = [
    {
      id: "earn",
      question: "Comment gagner plus de pièces ?",
      answers: [
        "Invitez des amis via votre lien de parrainage unique.",
        "Complétez votre profil utilisateur à 100%.",
        "Participez aux défis hebdomadaires.",
        "Regardez des vidéos promotionnelles (si disponible).",
      ],
    },
    {
      id: "spend",
      question: "Où puis-je utiliser mes pièces ?",
      answers: [
        "Échangez-les contre des abonnements Premium ou Pro.",
        "Débloquez des fonctionnalités exclusives.",
        "Obtenez des réductions sur certains services partenaires.",
      ],
    },
    {
      id: "value",
      question: "Quelle est la valeur d'une pièce ?",
      answers: [
        "La valeur d'échange des pièces est déterminée par les récompenses disponibles.",
        "Les pièces n'ont pas de valeur monétaire directe et ne peuvent être achetées.",
      ],
    },
  ];

  const handleToggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // --- Mapper itemId aux détails de l'entitlement ---
  const getEntitlementDetails = (itemId) => {
    switch (itemId) {
      case "premium_month":
        return {
          entitlementId: "premium",
          durationDays: 31,
          duration: "monthly",
        };
      case "premium_year":
        return {
          entitlementId: "premium",
          durationDays: 365,
          duration: "yearly",
        };
      case "pro_month":
        return { entitlementId: "pro", durationDays: 31, duration: "monthly" };
      case "pro_year":
        return { entitlementId: "pro", durationDays: 365, duration: "yearly" };
      default:
        return null; // ID non reconnu
    }
  };

  // Fonction à appeler lors du clic sur "Échanger"
  const handleExchangePress = async (itemId, itemCost) => {
    if (itemCost === null) {
      Alert.alert("Erreur", "Le coût de cet article n'est pas disponible.");
      return;
    }

    const userUID = auth().currentUser?.uid;
    if (!userUID) {
      Alert.alert("Erreur", "Utilisateur non authentifié.");
      return;
    }

    // 1. Vérifier si assez de pièces (déjà fait par disabled, mais double check)
    if (userCoins < itemCost) {
      Alert.alert(
        "Pièces insuffisantes",
        "Vous n'avez pas assez de pièces pour cet échange."
      );
      return;
    }

    const entitlementDetails = getEntitlementDetails(itemId);
    if (!entitlementDetails) {
      Alert.alert("Erreur", "Type d'abonnement non reconnu.");
      return;
    }

    // Démarrer l'indicateur de chargement pour cet item
    setExchangingItemId(itemId);
    setIsExchanging(true);

    try {
      // 2. Transaction Firestore pour déduire les pièces
      await firestore().runTransaction(async (transaction) => {
        const userRef = firestore().collection("users").doc(userUID);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error("Document utilisateur non trouvé.");
        }

        const currentPoints = userDoc.data()?.pieces || 0;

        // Re-vérification cruciale à l'intérieur de la transaction
        if (currentPoints < itemCost) {
          throw new Error("Pièces insuffisantes (vérification transaction).");
        }

        const newPoints = currentPoints - itemCost;
        transaction.update(userRef, { pieces: newPoints });

        // On ne met pas à jour l'état local ici, mais après le succès complet
        console.log(
          `Transaction Firestore réussie: ${currentPoints} -> ${newPoints} pièces`
        );
      });

      // Si la transaction réussit :
      // 3. Appeler la fonction pour accorder l'entitlement via RevenueCat
      const customerInfo = await Purchases.getCustomerInfo();
      const appUserId = customerInfo.originalAppUserId; // ID utilisateur RevenueCat

      if (!appUserId) {
        throw new Error("Impossible de récupérer l'ID utilisateur RevenueCat.");
      }

      const { entitlementId, durationDays, duration } = entitlementDetails;
      await grantPromotionalEntitlement(
        appUserId,
        entitlementId,
        durationDays,
        duration
      );
      console.log("Entitlement accordé avec succès via le backend/RevenueCat.");

      // 4. Mettre à jour l'état local des pièces APRES succès complet
      setUserCoins((prevCoins) => prevCoins - itemCost);

      // 5. Rafraîchir les infos RevenueCat localement et afficher succès
      await Purchases.syncPurchases(); // ou getCustomerInfo()
      Alert.alert(
        "Échange réussi !",
        `Vous avez échangé ${itemCost} pièces contre l'abonnement ${entitlementDetails.entitlementId} (${duration}). L'abonnement est actif. Veuillez redémarrer l'application pour voir tous les changements.`
        // "Veuillez redémarrer l'application pour voir tous les changements." // Si nécessaire
      );
      navigation.goBack(); // Retour à la page précédente après succès
    } catch (error) {
      // 6. Gérer les erreurs (Firestore ou RevenueCat/Backend)
      console.error("Erreur lors de l'échange :", error);
      Alert.alert(
        "Échec de l'échange",
        error.message || "Une erreur est survenue. Veuillez réessayer."
      );
      // Note : Si la transaction Firestore a échoué, les points n'ont pas été déduits.
      // Si grantPromotionalEntitlement échoue APRES la transaction, les points SONT déduits.
      // Vous pourriez envisager une logique de compensation (Cloud Function ?) mais c'est complexe.
    } finally {
      // Arrêter l'indicateur de chargement
      setIsExchanging(false);
      setExchangingItemId(null);
    }
  };

  // Afficher un indicateur de chargement pendant la récupération des données
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  // Afficher la page une fois les données chargées
  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-900">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(600)} className="pt-6 pb-2">
          {/* Section Solde */}
          <CoinBalanceCard coins={userCoins} />

          {/* Section Échanger les pièces */}
          <View className="mb-6">
            <Text
              className="text-xl font-semibold text-gray-800 dark:text-gray-200 mx-4 mb-4"
              style={{ fontFamily: "Inter_600SemiBold" }}
            >
              {i18n.t("echanger_mes_pieces")}
            </Text>
            {exchangeOptions.map((item, index) => (
              <ExchangeOptionCard
                key={item.id}
                item={item}
                index={index}
                onPressExchange={handleExchangePress}
                userCoins={userCoins}
                isExchanging={isExchanging} // Passer l'état global
                exchangingItemId={exchangingItemId}
              />
            ))}
          </View>

          {/* Section FAQ */}
          <View className="mb-6">
            <Text
              className="text-xl font-semibold text-gray-800 dark:text-gray-200 mx-4 mb-4"
              style={{ fontFamily: "Inter_600SemiBold" }}
            >
              {i18n.t("comment_ca_marche")}
            </Text>
            {faqData.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.duration(500).delay(600 + index * 100)}
              >
                <FaqItem
                  item={item}
                  onPress={() => handleToggleFaq(item.id)}
                  isExpanded={expandedFaq === item.id}
                />
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CoinsPage;

// N'oubliez pas d'importer et configurer vos polices Inter_xxx
