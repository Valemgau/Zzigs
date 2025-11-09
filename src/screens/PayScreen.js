import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  Pressable,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import {
  useStripe,
  isPlatformPaySupported,
  PlatformPayButton,
  confirmPlatformPayPayment,
} from "@stripe/stripe-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { showMessage } from "react-native-flash-message";
import { COLORS } from "../styles/colors";
import Loader from "../components/Loader";
import { API_URL, DOMAIN } from "@env";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";

export default function PayScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { appointmentId } = route.params;

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [loading, setLoading] = useState(true);
  const [paymentReady, setPaymentReady] = useState(false);
  const [isApplePaySupported, setIsApplePaySupported] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [CommissionAdmin, setCommissionAdmin] = useState(0);
  const [TVaAdmin, setTVaAdmin] = useState(0);
  const [config, setConfig] = useState({
    tvaPercent: 0,
    adminCommissionPercent: 0,
  });

  useEffect(() => {
    const checkApplePay = async () => {
      const supported = await isPlatformPaySupported();
      setIsApplePaySupported(supported);
    };
    checkApplePay();
  }, []);

  useEffect(() => {
    const fetchDataAndInit = async () => {
      setLoading(true);
      try {
        const appointRef = doc(db, "appointments", appointmentId);
        const appointSnap = await getDoc(appointRef);
        if (!appointSnap.exists()) throw new Error(t("appointmentNotFound"));
        const appointData = appointSnap.data();

        const offerRef = doc(db, "offers", appointData.offerId);
        const offerSnap = await getDoc(offerRef);
        if (!offerSnap.exists()) throw new Error(t("offerNotFound"));
        const offerData = offerSnap.data();

        const clientDoc = await getDoc(doc(db, "users", appointData.clientId));
        const couturierDoc = await getDoc(
          doc(db, "users", appointData.couturierId)
        );
        if (!clientDoc.exists() || !couturierDoc.exists())
          throw new Error(t("clientOrTailorNotFound"));
        const clientData = { id: clientDoc.id, ...clientDoc.data() };

        const couturierData = {
          id: couturierDoc.data(),
          ...couturierDoc.data(),
        };

        const configRef = doc(db, "config", "payments");
        const configSnap = await getDoc(configRef);
        const configData = configSnap.exists() ? configSnap.data() : {};
        const tvaPercent = Number(configData?.tva ?? 0);
        const adminCommissionPercent = Number(configData?.adminCommission ?? 0);
        setConfig({ tvaPercent, adminCommissionPercent });

        const priceHT = Number(offerData.price || 0);
        const tvaAmount = (priceHT * tvaPercent) / 100;
        const commissionAmount = (priceHT * adminCommissionPercent) / 100;
        const totalAmount = priceHT + tvaAmount + commissionAmount;
        setTVaAdmin(tvaAmount);
        setCommissionAdmin(commissionAmount);
        setAppointment({
          ...appointData,
          offer: offerData,
          client: clientData,
          couturier: couturierData,
          priceHT,
          tvaAmount,
          commissionAmount,
          totalAmount,
        });

        const response = await fetch(`${API_URL}/create_payment_intent.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(totalAmount * 100),
            currency: "eur",
            appointmentId,
            userId: auth.currentUser?.uid,
            client: {
              id: appointData.clientId,
              email: clientData.email,
              name: clientData.name,
            },
            couturier: {
              id: appointData.couturierId,
              email: couturierData.email,
              name: couturierData.name,
            },
            commissionPercent: adminCommissionPercent,
            tvaPercent: tvaPercent,
          }),
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(t("jsonParsingError") + ": " + e.message);
        }
        if (data.error) throw new Error(data.error);
        setClientSecret(data.clientSecret);

        const { error } = await initPaymentSheet({
          merchantDisplayName: DOMAIN,
          paymentIntentClientSecret: data.clientSecret,
          returnURL: "com.zzigs://stripe-redirect",
        });
        if (error) throw error;

        setPaymentReady(true);
      } catch (error) {
        Alert.alert(t("error"), error.message || t("paymentLoadError"));
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDataAndInit();
  }, [appointmentId, initPaymentSheet, t]);

  const handlePaymentSuccess = async () => {
    await updateDoc(doc(db, "appointments", appointmentId), {
      status: "paymentConfirmed",
      paidAt: new Date(),
    });
    await addDoc(collection(db, "payments"), {
      appointmentId,
      amount: appointment.totalAmount,
      commission: Math.round(CommissionAdmin * 100),
      tva: Math.round(TVaAdmin * 100),
      clientId: appointment.client.id,
      couturierId: appointment.couturier.id,
      status: "confirmed",
      paidAt: new Date(),
      createdAt: new Date(),
    });
    try {
      await fetch(`${API_URL}/payment_confirmed.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          email: appointment.client.email,
          amount: Math.round(appointment.totalAmount * 100),
          commission: Math.round(CommissionAdmin * 100),
          tva: Math.round(TVaAdmin * 100),
          clientData: appointment.client,
          couturierData: appointment.couturier,
          colors: { primary: COLORS.primary, secondary: COLORS.secondary },
        }),
      });
    } catch (e) {
      console.warn("Erreur envoi mails post-paiement :", e);
    }

    // showMessage({
    //   message: t("paymentSuccessful"),
    //   type: "success",
    // });
    // navigation.goBack();
    navigation.replace("SuccessPaymentScreen");0
  };

  const handleApplePayment = async () => {
    if (!clientSecret) return;

    setLoading(true);
    try {
      const { error } = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          cartItems: [
            {
              label: DOMAIN,
              amount: appointment.totalAmount.toFixed(2),
              paymentType: "Immediate",
            },
          ],
          merchantCountryCode: "FR",
          currencyCode: "EUR",
        },
      });

      if (error) {
        if (error.code === "Canceled") {
          setLoading(false);
          return;
        }
        throw error;
      }

      await handlePaymentSuccess();
    } catch (err) {
      if (err.code !== "Canceled") {
        Alert.alert(t("error"), err.message);
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { error } = await presentPaymentSheet();
      if (error) throw error;

      await handlePaymentSuccess();
    } catch (err) {
      Alert.alert(t("error"), err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const safeNumber = (value) => (typeof value === "number" ? value : 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        <View className="bg-white px-5 pt-6 pb-8 border-b border-gray-200">
          <View className="flex-row items-center mb-2">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: COLORS.primary + "15" }}
            >
              <MaterialIcons
                name="receipt-long"
                size={24}
                color={COLORS.primary}
              />
            </View>
            <View className="flex-1">
              <Text
                style={{ fontFamily: "OpenSans_700Bold" }}
                className="text-2xl text-gray-900"
              >
                {t("summary")}
              </Text>
              <Text
                style={{ fontFamily: "OpenSans_400Regular" }}
                className="text-sm text-gray-500 mt-1"
              >
                {t("checkDetailsBeforePaying")}
              </Text>
            </View>
          </View>
        </View>

        {appointment && (
          <View className="px-5 pt-6">
            <View className="bg-white rounded p-5 mb-4 border border-gray-200">
              <Text
                style={{ fontFamily: "OpenSans_700Bold" }}
                className="text-lg text-gray-900 mb-4"
              >
                {t("missionDetails")}
              </Text>

              <View className="space-y-3">
                <View className="flex-row items-start">
                  <MaterialIcons
                    name="description"
                    size={20}
                    color="#9CA3AF"
                    style={{ marginTop: 2, marginRight: 12 }}
                  />
                  <View className="flex-1">
                    <Text
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                      className="text-xs text-gray-500 mb-1"
                    >
                      {t("project")}
                    </Text>
                    <Text
                      style={{ fontFamily: "OpenSans_400Regular" }}
                      className="text-sm text-gray-900"
                      numberOfLines={2}
                    >
                      {appointment.offer?.message || "N/A"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start pt-3 border-t border-gray-100">
                  <MaterialIcons
                    name="person"
                    size={20}
                    color="#9CA3AF"
                    style={{ marginTop: 2, marginRight: 12 }}
                  />
                  <View className="flex-1">
                    <Text
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                      className="text-xs text-gray-500 mb-1"
                    >
                      {t("tailor")}
                    </Text>
                    <Text
                      style={{ fontFamily: "OpenSans_400Regular" }}
                      className="text-sm text-gray-900"
                    >
                      {appointment.client?.firstname || "N/A"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start pt-3 border-t border-gray-100">
                  <MaterialIcons
                    name="event"
                    size={20}
                    color="#9CA3AF"
                    style={{ marginTop: 2, marginRight: 12 }}
                  />
                  <View className="flex-1">
                    <Text
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                      className="text-xs text-gray-500 mb-1"
                    >
                      {t("appointmentDate")}
                    </Text>
                    <Text
                      style={{ fontFamily: "OpenSans_400Regular" }}
                      className="text-sm text-gray-900"
                    >
                      {appointment.date
                        ? new Date(appointment.date).toLocaleString("fr-FR", {
                            dateStyle: "long",
                            timeStyle: "short",
                          })
                        : "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-white rounded p-5 mb-4 border border-gray-200">
              <Text
                style={{ fontFamily: "OpenSans_700Bold" }}
                className="text-lg text-gray-900 mb-4"
              >
                {t("paymentDetails")}
              </Text>

              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text
                    style={{ fontFamily: "OpenSans_400Regular" }}
                    className="text-sm text-gray-600"
                  >
                    {t("proposedPriceExcludingTax")}
                  </Text>
                  <Text
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                    className="text-sm text-gray-900"
                  >
                    {safeNumber(appointment.priceHT).toFixed(2)} €
                  </Text>
                </View>

                {config.tvaPercent > 0 && (
                  <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                    <Text
                      style={{ fontFamily: "OpenSans_400Regular" }}
                      className="text-sm text-gray-600"
                    >
                      {t("vat")} ({config.tvaPercent}%)
                    </Text>
                    <Text
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                      className="text-sm text-gray-900"
                    >
                      {safeNumber(appointment.tvaAmount).toFixed(2)} €
                    </Text>
                  </View>
                )}

                <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                  <Text
                    style={{ fontFamily: "OpenSans_400Regular" }}
                    className="text-sm text-gray-600"
                  >
                    {t("serviceFees")} ({config.adminCommissionPercent}%)
                  </Text>
                  <Text
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                    className="text-sm text-gray-900"
                  >
                    {safeNumber(appointment.commissionAmount).toFixed(2)} €
                  </Text>
                </View>

                <View
                  className="flex-row justify-between items-center pt-4 mt-2 border-t-2"
                  style={{ borderColor: COLORS.primary }}
                >
                  <Text
                    style={{ fontFamily: "OpenSans_700Bold" }}
                    className="text-base text-gray-900"
                  >
                    {t("totalIncludingTax")}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "OpenSans_700Bold",
                      color: COLORS.primary,
                    }}
                    className="text-2xl"
                  >
                    {safeNumber(appointment.totalAmount).toFixed(2)} €
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-white rounded p-4 mb-4 border border-gray-200 flex-row items-center">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: "#22c55e15" }}
              >
                <MaterialIcons name="lock" size={20} color="#22c55e" />
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                  className="text-sm text-gray-900 mb-0.5"
                >
                  {t("securePayment")}
                </Text>
                <Text
                  style={{ fontFamily: "OpenSans_400Regular" }}
                  className="text-xs text-gray-500"
                >
                  {t("dataProtectedByStripe")}
                </Text>
              </View>
              <Image
                source={require("../../assets/img/secu-cb.jpg")}
                style={{
                  width: 60,
                  height: 60,
                  contentFit: "contain",
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        {isApplePaySupported && paymentReady && !loading && (
          <PlatformPayButton
            onPress={handleApplePayment}
            borderRadius={12}
            style={{
              width: "100%",
              height: 50,
              marginBottom: 12,
            }}
          />
        )}

        <Pressable
          onPress={handlePayment}
          disabled={!paymentReady || loading}
          className="rounded py-4 items-center justify-center"
          style={{
            backgroundColor: COLORS.primary,
            opacity: paymentReady && !loading ? 1 : 0.6,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center">
              <MaterialIcons name="payment" size={20} color="#fff" />
              <Text
                style={{ fontFamily: "OpenSans_700Bold" }}
                className="text-white text-base ml-2"
              >
                {t("pay")} {safeNumber(appointment?.totalAmount).toFixed(2)} €
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
