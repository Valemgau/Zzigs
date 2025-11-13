import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../styles/colors";
import { auth, db } from "../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { useTranslation } from "react-i18next";

export default function HeaderProjects({
  title,
  subtitle,
  leftButton,
  rightButton,
  showBorder = true,
  welcomeMessage = null,
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Écouter les actions requises en temps réel
  useEffect(() => {
    if (!authUser?.uid) {
      setPendingActionsCount(0);
      return;
    }

    const calculatePendingActions = async () => {
      try {
        let count = 0;
        const userId = authUser.uid;
        const offersRef = collection(db, "offers");

        // Récupérer mes offres (en tant que client ou couturier)
        const qCouturier = query(offersRef, where("userId", "==", userId));
        const qClient = query(offersRef, where("authorId", "==", userId));

        const [snapCouturier, snapClient] = await Promise.all([
          getDocs(qCouturier),
          getDocs(qClient),
        ]);

        const myOffers = [
          ...snapCouturier.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            isClient: false,
          })),
          ...snapClient.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            isClient: true,
          })),
        ];

        // Récupérer tous les rendez-vous associés
        const offerIds = myOffers.map((o) => o.id);
        let appointments = [];

        if (offerIds.length > 0) {
          // Firestore limite à 10 éléments dans "in", donc on découpe si nécessaire
          const chunks = [];
          for (let i = 0; i < offerIds.length; i += 10) {
            chunks.push(offerIds.slice(i, i + 10));
          }

          for (const chunk of chunks) {
            const appointmentsQuery = query(
              collection(db, "appointments"),
              where("offerId", "in", chunk)
            );
            const appointmentsSnap = await getDocs(appointmentsQuery);
            appointments.push(
              ...appointmentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
            );
          }
        }

        // Calculer les actions requises
        for (const offer of myOffers) {
          const appointment = appointments.find((a) => a.offerId === offer.id);

          if (offer.isClient) {
            // JE SUIS CLIENT
            // 1. Offre en attente de ma décision
            if (offer.status === "pending") {
              count++;
            }
            // 2. Paiement requis
            else if (appointment?.status === "waitPayment") {
              count++;
            }
          } else {
            // JE SUIS COUTURIER
            // 1. Client n'a pas encore répondu à mon offre
            if (offer.status === "pending") {
              count++;
            }
            // 2. RDV proposé par le client, je dois confirmer/refuser
            else if (appointment?.status === "pending") {
              count++;
            }
          }
        }

        setPendingActionsCount(count);
      } catch (error) {
        console.error("Erreur calcul actions requises:", error);
        setPendingActionsCount(0);
      }
    };

    // Écouter les changements en temps réel
    const offersRef = collection(db, "offers");
    const qCouturier = query(offersRef, where("userId", "==", authUser.uid));
    const qClient = query(offersRef, where("authorId", "==", authUser.uid));

    const unsubscribe1 = onSnapshot(qCouturier, () => {
      calculatePendingActions();
    });

    const unsubscribe2 = onSnapshot(qClient, () => {
      calculatePendingActions();
    });

    // Calcul initial
    calculatePendingActions();

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [authUser]);

  return (
    <View
      className="px-5 py-4 bg-white"
      style={showBorder && { borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}
    >
      {/* Message de bienvenue optionnel */}
      {welcomeMessage && (
        <View className="mb-2">
          <Text
            style={{
              fontFamily: "OpenSans_600SemiBold",
              color: COLORS.primary,
            }}
            className="text-lg"
          >
            {welcomeMessage} 👋
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mb-3">
        {/* Section gauche - Titre et sous-titre */}
        <View className="flex-1">
          <Text
            style={{
              fontFamily: "OpenSans_700Bold",
              color: COLORS.primary,
            }}
            className="text-2xl"
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{ fontFamily: "OpenSans_400Regular" }}
              className="text-sm text-gray-600 mt-1"
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Section droite - Boutons */}
        <View className="flex-row items-center">
          {/* Bouton gauche (généralement refresh) */}
          {leftButton && (
            <Pressable
              onPress={leftButton.onPress}
              disabled={leftButton.loading}
              className="p-2 rounded-full mr-2"
              style={{
                backgroundColor: leftButton.loading
                  ? "#F3F4F6"
                  : `${COLORS.primary}15`,
              }}
            >
              {leftButton.loading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <MaterialIcons
                  name={leftButton.icon || "refresh"}
                  size={24}
                  color={COLORS.primary}
                />
              )}
            </Pressable>
          )}

          {/* Bouton droit (généralement action principale) */}
          {rightButton && (
            <Pressable
              onPress={rightButton.onPress}
              disabled={rightButton.disabled}
              className="px-4 py-2 rounded-full flex-row items-center"
              style={{
                backgroundColor: rightButton.disabled
                  ? "#D1D5DB"
                  : rightButton.backgroundColor || COLORS.primary,
              }}
            >
              {rightButton.icon && (
                <MaterialIcons
                  name={rightButton.icon}
                  size={20}
                  color={rightButton.iconColor || "#fff"}
                />
              )}
              {rightButton.label && (
                <Text
                  style={{
                    fontFamily: "OpenSans_600SemiBold",
                    color: rightButton.textColor || "#fff",
                  }}
                  className={`text-sm ${rightButton.icon ? "ml-1" : ""}`}
                >
                  {rightButton.label}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* Barre d'icônes de navigation */}
      <View className="flex-row items-center justify-around pt-3 border-t border-gray-100">
        <Pressable
          onPress={() => navigation.navigate("Calendar")}
          className="flex-1 items-center py-2 relative"
        >
          <View className="relative">
            <MaterialIcons name="event" size={24} color={COLORS.primary} />
            {/* Badge compteur pour Calendrier */}
            {pendingActionsCount > 0 && (
              <View
                className="absolute -top-1 -right-1 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#EF4444",
                  minWidth: 16,
                  height: 16,
                  paddingHorizontal: 3,
                }}
              >
                <Text
                  className="text-white"
                  style={{ 
                    fontFamily: "OpenSans_700Bold",
                    fontSize: 10
                  }}
                >
                  {pendingActionsCount > 9 ? "9+" : pendingActionsCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              fontFamily: "OpenSans_600SemiBold",
              color: COLORS.primary
            }}
            className="text-xs mt-1"
          >
            {t("headerProjects.calendar")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("ChatListScreen")}
          className="flex-1 items-center py-2 relative"
        >
          <View className="relative">
            <MaterialIcons name="chat" size={24} color={COLORS.primary} />
            {/* Badge compteur pour Messages */}
            {pendingActionsCount > 0 && (
              <View
                className="absolute -top-1 -right-1 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#EF4444",
                  minWidth: 16,
                  height: 16,
                  paddingHorizontal: 3,
                }}
              >
                <Text
                  className="text-white"
                  style={{ 
                    fontFamily: "OpenSans_700Bold",
                    fontSize: 10
                  }}
                >
                  {pendingActionsCount > 9 ? "9+" : pendingActionsCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              fontFamily: "OpenSans_600SemiBold",
              color: COLORS.primary
            }}
            className="text-xs mt-1"
          >
            {t("headerProjects.messages")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate("SettingsScreen")}
          className="flex-1 items-center py-2"
        >
          <MaterialIcons name="account-circle" size={24} color={COLORS.primary} />
          <Text
            style={{
              fontFamily: "OpenSans_600SemiBold",
              color: COLORS.primary
            }}
            className="text-xs mt-1"
          >
            {t("headerProjects.settings")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}