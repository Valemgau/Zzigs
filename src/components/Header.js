import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../styles/colors";
import { auth, db } from "../../config/firebase";
import { useTranslation } from "react-i18next";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

const Header = ({ isClient }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [authUser, setAuthUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) {
      setIsReady(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (authUser && isClient !== undefined && isClient !== null) {
      const timer = setTimeout(() => {
        setIsReady(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [authUser, isClient]);

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
            // 3. RDV en attente de confirmation du couturier (on peut le compter ou pas)
            // else if (appointment?.status === "pending") {
            //   count++;
            // }
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

  const handleMenu = () => {
    navigation.navigate("SettingsScreen");
  };

  const handleLogin = () => {
    navigation.navigate("PasswordPage");
  };

  const handleChat = () => {
    navigation.navigate("ChatListScreen");
  };

  const handleCalendar = () => {
    navigation.navigate("Calendar");
  };

  if (!isReady) {
    return (
      <View
        className="flex-row items-center justify-between px-5 border-b border-gray-200"
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          backgroundColor: "#fff",
        }}
      >
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text
              className="text-white text-xl"
              style={{
                fontFamily: "OpenSans_700Bold",
                color: COLORS.secondary,
              }}
            >
              z
            </Text>
          </View>
        </View>
        <View style={{ minHeight: 40, minWidth: 40 }} />
      </View>
    );
  }

  return (
    <View
      className="flex-row items-center justify-between px-5 border-b border-gray-200"
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: 12,
        backgroundColor: "#fff",
      }}
    >
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text
            className="text-white text-xl"
            style={{ fontFamily: "OpenSans_700Bold", color: COLORS.secondary }}
          >
            z
          </Text>
        </View>

        {/* Badge rôle à gauche */}
        {authUser && (
          <Text
            className="text-sm"
            style={{
              fontFamily: "OpenSans_600SemiBold",
              color: COLORS.primary,
            }}
          >
            {isClient ? t("customer") : t("tailor")}
          </Text>
        )}
      </View>

      <Animated.View
        className="flex-row items-center"
        style={{ minHeight: 40, opacity: fadeAnim }}
      >
        {authUser ? (
          <>
            {/* Icône Calendrier avec badge */}
            <Pressable
              onPress={handleCalendar}
              className="w-10 h-10 rounded-full items-center justify-center mr-2 relative"
              style={{ backgroundColor: COLORS.primary + "15" }}
            >
              <MaterialIcons
                name="calendar-today"
                size={22}
                color={COLORS.primary}
              />

              {/* Badge compteur */}
              {pendingActionsCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "#EF4444",
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    className="text-white text-xs"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {pendingActionsCount > 9 ? "9+" : pendingActionsCount}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Icône Chat avec badge */}
            <Pressable
              onPress={handleChat}
              className="w-10 h-10 rounded-full items-center justify-center mr-2 relative"
              style={{ backgroundColor: COLORS.primary + "15" }}
            >
              <MaterialIcons
                name="chat-bubble"
                size={22}
                color={COLORS.primary}
              />

              {/* Badge compteur */}
              {pendingActionsCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "#EF4444",
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    className="text-white text-xs"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {pendingActionsCount > 9 ? "9+" : pendingActionsCount}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Menu */}
            <Pressable
              onPress={handleMenu}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: COLORS.primary + "15" }}
            >
              <MaterialIcons name="menu" size={24} color={COLORS.primary} />
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={handleLogin}
            className="px-2 py-2 flex-row items-center rounded-full"
            style={{ backgroundColor: COLORS.primary }}
          >
            <MaterialIcons name="login" size={18} color="#fff" />
            <Text
              className="text-white text-sm ml-2"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("login")}
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

export default Header;
