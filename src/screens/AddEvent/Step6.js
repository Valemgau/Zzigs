import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import {
  useStripe,
  usePlatformPay,
  PlatformPay,
  PlatformPayButton,
  StripeProvider,
} from "@stripe/stripe-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import ImageSlider from "../../components/ImageSlider";
import moment from "moment";
import { showMessage } from "react-native-flash-message";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

import sendNotifs from "../../utils/sendNotifs";
import i18n from "../../../i18n";

const Step6 = ({ route, navigation }) => {
  const {
    activityId,
    newParticipant,
    messageToCreator,
    adminUser,
    userinfo,
    activity,
    images,
  } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { initPlatformPay, confirmPlatformPay, isPlatformPaySupported } =
    usePlatformPay();

  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentReady, setPaymentReady] = useState(false);
  const IS_FREE = Number(activity.price ? activity?.price : 0) <= 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: activity.title.substr(0, 25) + "..",
    });
  }, [navigation, activity]);

  // Initialisation Stripe
  useEffect(() => {
    const initializePaymentSheet = async () => {
      if (IS_FREE) {
        setLoading(false);
        setPaymentReady(true);
        return;
      }
      try {
        setLoading(true); // Activation du loading au début

        // 1. Vérifier support Apple Pay
        const applePaySupported = await isPlatformPaySupported();
        setApplePayAvailable(applePaySupported);

        // 2. Récupérer les données de paiement
        const response = await fetch(
          "https://us-central1-tis-78f04.cloudfunctions.net/createApplePaymentIntent",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: Number(activity.price) * 100,
              currency: "eur",
            }),
          }
        );
        const text = await response.text();
        // console.log("Réponse serveur:", text);
        const data = JSON.parse(text);
        const { clientSecret, ephemeralKey, customer } = await data;
        setClientSecret(clientSecret);

        // 3. Initialiser le Payment Sheet
        const { error } = await initPaymentSheet({
          merchantDisplayName: "Connect & Move",
          paymentIntentClientSecret: clientSecret,
          customerId: customer,
          customerEphemeralKeySecret: ephemeralKey,
          returnURL: "connectmove://stripe-redirect", // Ajout crucial
          applePay: {
            merchantCountryCode: "FR",
            merchantIdentifier: "merchant.com.connectmove", // Remplacer par votre ID
          },
        });

        if (error) throw error;
        setPaymentReady(true); // Activation du paiement
      } catch (err) {
        Alert.alert("Erreur", err.message);
        setPaymentReady(false); // Désactivation en cas d'erreur
      } finally {
        setLoading(false); // Désactivation loading dans tous les cas
      }
    };

    initializePaymentSheet();
  }, []);

  // Gestionnaire Stripe standard
  const handleCardPayment = async () => {
    setLoading(true);
    try {
      const { error } = await presentPaymentSheet();
      if (error) throw error;
      onPaymentSuccess();
    } catch (err) {
      Alert.alert("Erreur", err.message);
    } finally {
      setLoading(false);
    }
  };

  const onPaymentSuccess = async () => {
    try {
      await firestore()
        .collection("payments")
        .add({
          amount: Number(activity.price),
          userId: auth().currentUser.uid,
          activityId: activityId,
          createdAt: moment().format(),
        });
      handleJoinActivity();
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande :", error);
    }
  };

  const handleJoinActivity = async () => {
    try {
      const currentUserUID = auth().currentUser?.uid;
      if (!currentUserUID) {
        showMessage({ message: "Non connecté.", type: "danger" });
        return;
      }

      // Récupération configuration des points
      const currentDay = new Date().getDay();
      const isWeekend = currentDay === 0 || currentDay === 6;

      const pointsDoc = await firestore()
        .collection("admin")
        .doc("defispoint")
        .get();
      const pointsConfig = pointsDoc.data();
      const eventPoints = isWeekend
        ? Number(pointsConfig?.join_weekevent) +
          Number(pointsConfig?.joint_basic_event_point)
        : Number(pointsConfig?.joint_basic_event_point);

      // Vérification participation existante À CETTE ACTIVITÉ
      const existingDefis = await firestore()
        .collection("defis")
        .where("userId", "==", currentUserUID)
        .where("type", "==", "join_event")
        .where("activityId", "==", activityId)
        .limit(1)
        .get();

      const batch = firestore().batch();
      const activityRef = firestore().collection("activities").doc(activityId);

      // Ajout des points UNIQUEMENT si première participation à CETTE activité
      if (existingDefis.empty && eventPoints > 0) {
        const defisRef = firestore().collection("defis").doc();
        batch.set(defisRef, {
          userId: currentUserUID,
          type: "join_event",
          activityId: activityId, // Nouveau champ important
          createdAt: firestore.FieldValue.serverTimestamp(),
          points: eventPoints,
        });

        // Mise à jour du solde utilisateur
        const userRef = firestore().collection("users").doc(currentUserUID);
        batch.update(userRef, {
          pieces: firestore.FieldValue.increment(eventPoints),
        });
        Alert.alert(
          "Des pièces en plus",
          `Vous avez reçu ${eventPoints} pièces pour avoir rejoint ce evènement.`
        );
      }

      // Mise à jour de l'activité (toujours ajoutée)
      batch.update(activityRef, {
        participants: firestore.FieldValue.arrayUnion({
          userId: currentUserUID,
          active: IS_FREE ? false : true,
          here: false,
          joinedAt: moment().format(),
        }),
      });

      await batch.commit();

      // Notifications
      const messageToAuthUser = {
        title: `${activity.title}`,
        desc: IS_FREE
          ? `${eventPoints} pièces en +: vous avez rejoint un nouvel évènement`
          : `${eventPoints} pièces en +: paiement réussi, vous avez rejoint un nouvel évènement`,
        type: "join_demands",
      };

      sendNotifs(adminUser, messageToCreator);
      sendNotifs(userinfo, messageToAuthUser);

      showMessage({
        message: IS_FREE
          ? "Nous vous tiendrons informé dès que l'admin aura validé votre demande."
          : "Paiement réussi, vous avez rejoint un nouvel évènement",
        type: "success",
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande :", error);
      showMessage({
        message: "Impossible d'envoyer votre demande. Veuillez réessayer.",
        type: "danger",
      });
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <Animated.View
        entering={FadeIn.duration(400)}
        className="bg-white dark:bg-gray-900"
      >
        {images && <ImageSlider images={images} />}
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(400)} className="p-5">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-2xl text-gray-900 dark:text-white"
            style={{ fontFamily: "Inter_700Bold" }}
          >
            {/* paiement sécurisé */}
            Rejoindre
          </Text>
          <Text
            className="bg-green-500 px-2 py-1 rounded-full text-base text-white dark:text-dark"
            style={{ fontFamily: "Inter_400Regular" }}
          >
            {/* paiement sécurisé */}
            {IS_FREE ? "Gratuit" : activity.price + " €"}
          </Text>
        </View>
       
        <View className="p-2">
          <Text
            className="text-lg text-gray-500 dark:text-white"
            style={{ fontFamily: "Inter_500Medium" }}
          >
            _{i18n.t("lintegralite_de_levenement")}
          </Text>
          <Text
            className="text-lg text-gray-500 dark:text-white"
            style={{ fontFamily: "Inter_500Medium" }}
          >
            _{i18n.t("la_messagerie_du_groupe")}
          </Text>
        </View>

        <Pressable
          onPress={IS_FREE ? handleJoinActivity : handleCardPayment}
          style={{ marginTop: 50 }}
          className="bg-teal-500 py-4 rounded-lg items-center"
          disabled={!paymentReady || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              className="text-white text-base"
              style={{ fontFamily: "Inter_500Medium" }}
            >
              {IS_FREE
                ? "Rejoindre dès maintenant"
                : "Carte bancaire ou Apple Pay"}
            </Text>
          )}
        </Pressable>
        {!IS_FREE && (
          <Text
            className="text-sm mt-2 text-center text-gray-400 dark:text-white"
            style={{ fontFamily: "Inter_500Medium" }}
          >
            {i18n.t("cet_achat_est_unique_et_non_remboursable")}
          </Text>
        )}
      </Animated.View>
    </View>
  );
};

export default Step6;
