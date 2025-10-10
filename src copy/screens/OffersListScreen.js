import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import MapView, { Marker } from "react-native-maps";
import { auth, db } from "../../config/firebase";
import { COLORS } from "../styles/colors";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { showMessage } from "react-native-flash-message";
import sendNotifs from "../utils/sendNotifs";
import moment from "moment";
import "moment/locale/fr";
import Loader from "../components/Loader";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

moment.locale("fr");

const ITEMS_PER_PAGE = 5;

const getCoordsFromPostal = async (postalCode, city = "") => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&city=${encodeURIComponent(
        city
      )}&country=france&format=json`
    );
    const data = await response.json();
    if (data.length) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error("Erreur géocodage:", error);
  }
  return null;
};

export default function OffersListScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const userId = auth.currentUser?.uid;

  const [offers, setOffers] = useState([]);
  const [displayedOffers, setDisplayedOffers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsData, setClientsData] = useState({});
  const [mapCoords, setMapCoords] = useState({});

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchAppointments = useCallback(async (offerIds) => {
    if (offerIds.length === 0) return [];

    try {
      const appointmentsCol = collection(db, "appointments");
      const q = query(appointmentsCol, where("offerId", "in", offerIds));
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Erreur chargement RDV:", error);
      return [];
    }
  }, []);

  const fetchClientsData = async (clientIds) => {
    const clients = {};
    await Promise.all(
      clientIds.map(async (clientId) => {
        try {
          const clientDoc = await getDoc(doc(db, "users", clientId));
          if (clientDoc.exists()) {
            const data = clientDoc.data();
            clients[clientId] = {
              username: data.username || t("client"),
              photo: data.photo || null,
              phoneNumber: data.phoneNumber || null,
              address: data.address || null,
              city: data.city || null,
              postalCode: data.postalCode || null,
              expoPushToken: data.expoPushToken || null,
            };
          }
        } catch (error) {
          console.error(`Erreur client ${clientId}:`, error);
        }
      })
    );
    return clients;
  };

  const loadMapCoordinates = async (clientsData) => {
    const coords = {};
    const promises = Object.entries(clientsData).map(
      async ([clientId, client]) => {
        if (client.address && client.postalCode && client.city) {
          const coord = await getCoordsFromPostal(
            client.postalCode,
            client.city
          );
          if (coord) {
            coords[clientId] = coord;
          }
        }
      }
    );
    await Promise.all(promises);
    return coords;
  };

  useEffect(() => {
    if (!userId) {
      setError(t("userNotConnected"));
      setLoading(false);
      return;
    }

    const fetchOffersAndAppointments = async () => {
      setLoading(true);
      try {
        const offersRef = collection(db, "offers");
        const q = query(offersRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        const offersData = await Promise.all(
          querySnapshot.docs.map(async (docOffer) => {
            const offerData = docOffer.data();
            let projectInfo = {
              title: t("project"),
              city: "",
              budget: null,
              photos: [],
            };

            if (offerData.projectId) {
              try {
                const projectDoc = await getDoc(
                  doc(db, "projects", offerData.projectId)
                );
                if (projectDoc.exists()) {
                  const project = projectDoc.data();
                  projectInfo = {
                    title: project.type || t("project"),
                    city: project.city || "",
                    budget: project.budget || null,
                    photos: project.photos || [],
                  };
                }
              } catch (error) {
                console.error("Erreur chargement projet:", error);
              }
            }

            return {
              id: docOffer.id,
              ...offerData,
              project: projectInfo,
            };
          })
        );

        const offerIds = offersData.map((offer) => offer.id);
        const loadedAppointments = await fetchAppointments(offerIds);

        const clientIds = Array.from(
          new Set(offersData.map((o) => o.authorId).filter(Boolean))
        );
        const clients = await fetchClientsData(clientIds);
        const coords = await loadMapCoordinates(clients);

        setOffers(offersData);
        setAppointments(loadedAppointments);
        setClientsData(clients);
        setMapCoords(coords);
        setDisplayedOffers(offersData.slice(0, ITEMS_PER_PAGE));
        setCurrentPage(1);
      } catch (error) {
        console.error("Erreur chargement offres:", error);
        setError(t("offersLoadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchOffersAndAppointments();
  }, [userId, fetchAppointments, t]);

  const loadMoreOffers = () => {
    if (loadingMore || displayedOffers.length >= offers.length) return;

    setLoadingMore(true);
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const newOffers = offers.slice(0, nextPage * ITEMS_PER_PAGE);
      setDisplayedOffers(newOffers);
      setCurrentPage(nextPage);
      setLoadingMore(false);
    }, 300);
  };

  const getAppointmentForOffer = useCallback(
    (offerId) => appointments.find((a) => a.offerId === offerId),
    [appointments]
  );

  const handleUpdateAppointment = useCallback(
    async (appointmentId, newStatus, offer) => {
      try {
        await updateDoc(doc(db, "appointments", appointmentId), {
          status: newStatus,
        });

        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointmentId ? { ...a, status: newStatus } : a
          )
        );

        const client = clientsData[offer.authorId];

        let msgClient;
        if (newStatus === "confirmed") {
          msgClient = {
            title: t("appointmentConfirmedTitle"),
            desc: t("appointmentConfirmedDesc", { project: offer.project.title || t("theProject") }),
            type: "appointment_confirmed",
          };
        } else if (newStatus === "refused") {
          msgClient = {
            title: t("appointmentRefusedTitle"),
            desc: t("appointmentRefusedDesc", { project: offer.project.title || t("theProject") }),
            type: "appointment_refused",
          };
        } else if (newStatus === "waitPayment") {
          msgClient = {
            title: t("missionCompletedTitle"),
            desc: t("missionCompletedDesc", { project: offer.project.title || t("theProject") }),
            type: "mission_completed",
          };
        }

        if (client?.expoPushToken && msgClient) {
          await sendNotifs(
            { id: offer.authorId, expoPushToken: client.expoPushToken },
            msgClient
          );
        }

        const statusMessages = {
          confirmed: t("appointmentConfirmed"),
          refused: t("appointmentRefused"),
          waitPayment: t("missionMarkedCompleted"),
        };

        showMessage({
          message: statusMessages[newStatus] || t("appointmentUpdated"),
          description:
            newStatus === "confirmed"
              ? t("clientNotified")
              : newStatus === "waitPayment"
              ? t("clientCanPayNow")
              : "",
          type: "success",
          icon: "success",
        });
      } catch (error) {
        console.error("Erreur mise à jour RDV:", error);
        showMessage({
          message: t("updateError"),
          type: "danger",
          icon: "danger",
        });
      }
    },
    [clientsData, t]
  );

  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason("");
    setCancelModalVisible(true);
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      showMessage({
        message: t("reasonRequired"),
        description: t("reasonRequiredDesc"),
        type: "warning",
      });
      return;
    }

    try {
      await updateDoc(doc(db, "appointments", selectedAppointment.id), {
        status: "cancelled",
        cancelReason: cancelReason.trim(),
        cancelledAt: serverTimestamp(),
        cancelledBy: userId,
      });

      const offer = offers.find((o) => o.id === selectedAppointment.offerId);
      const client = clientsData[offer?.authorId];

      const msgClient = {
        title: t("appointmentCancelledTitle"),
        desc: t("appointmentCancelledDesc", { 
          project: offer?.project.title || t("theProject"),
          reason: cancelReason.trim()
        }),
        type: "appointment_cancelled",
      };

      if (client?.expoPushToken) {
        await sendNotifs(
          { id: offer.authorId, expoPushToken: client.expoPushToken },
          msgClient
        );
      }

      showMessage({
        message: t("appointmentCancelled"),
        description: t("clientInformedCancellation"),
        type: "success",
      });

      setCancelModalVisible(false);

      const offerIds = offers.map((o) => o.id);
      const loadedAppointments = await fetchAppointments(offerIds);
      setAppointments(loadedAppointments);
    } catch (error) {
      console.error("Erreur annulation RDV :", error);
      showMessage({
        message: t("error"),
        description: t("cancelAppointmentError"),
        type: "danger",
      });
    }
  };

  const handleCallPhone = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderOffer = useCallback(
    ({ item, index }) => {
      const appointment = getAppointmentForOffer(item.id);
      const isAccepted = item.status === "confirmed";
      const client = clientsData[item.authorId];
      const coords = mapCoords[item.authorId];
      const showMap =
        isAccepted &&
        appointment?.status === "confirmed" &&
        client?.address &&
        coords;

      return (
        <Animated.View
          entering={FadeInDown.duration(300).delay(index * 50)}
          className="bg-white mb-8 overflow-hidden border-2 border-gray-200"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {showMap && (
            <View style={{ height: 240, width: "100%", position: "relative" }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={coords}
                  title={t("appointment")}
                  description={client.address}
                >
                  <View
                    className="w-12 h-12 items-center justify-center"
                    style={{
                      backgroundColor: COLORS.primary,
                      shadowColor: COLORS.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.4,
                      shadowRadius: 4,
                    }}
                  >
                    <MaterialIcons name="place" size={28} color="#fff" />
                  </View>
                </Marker>
              </MapView>

              <View
                className="absolute bottom-0 left-0 right-0 p-4"
                style={{
                  backgroundColor: "rgba(0,0,0,0.75)",
                }}
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="place" size={20} color="#fff" />
                  <Text
                    className="text-white text-sm ml-2 flex-1"
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                    numberOfLines={2}
                  >
                    {client.address}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View className="p-5 border-b border-gray-100">
            <View className="flex-row items-center mb-3">
              {client?.photo ? (
                <Image
                  source={{ uri: client.photo }}
                  className="w-14 h-14 bg-gray-200 mr-3"
                />
              ) : (
                <View
                  className="w-14 h-14 mr-3 items-center justify-center"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Text
                    className="text-white text-xl"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {client?.username?.charAt(0)?.toUpperCase() || "C"}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <Text
                  className="text-base text-gray-900 mb-1"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  {client?.username || t("client")}
                </Text>
                <View className="flex-row items-center">
                  <MaterialIcons name="work" size={14} color="#9CA3AF" />
                  <Text
                    className="text-sm text-gray-600 ml-1"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                  >
                    {t("requester")}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between items-start mb-2">
              <Text
                className="text-xl flex-1 mr-2"
                style={{
                  fontFamily: "OpenSans_700Bold",
                  color: COLORS.primary,
                }}
                numberOfLines={1}
              >
                {item.project.title}
              </Text>
              {item.project.budget && (
                <View
                  className="px-4 py-1.5 flex-row items-center"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <MaterialIcons name="euro" size={16} color="#fff" />
                  <Text
                    className="text-white text-sm ml-1"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {item.project.budget}
                  </Text>
                </View>
              )}
            </View>

            <Text
              className="text-lg text-gray-700 mb-1"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("yourOffer")} : {item.price} €
            </Text>

            {item.message && (
              <Text
                className="text-sm text-gray-600 mt-2"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                {item.message}
              </Text>
            )}

            <View className="mt-4">
              <View
                className="px-4 py-2 self-start"
                style={{
                  backgroundColor:
                    item?.status === "pending"
                      ? "#FFA50020"
                      : item?.status === "confirmed"
                      ? "#10B98120"
                      : "#EF444420",
                }}
              >
                <Text
                  className="text-xs"
                  style={{
                    fontFamily: "OpenSans_700Bold",
                    color:
                      item?.status === "pending"
                        ? "#F59E0B"
                        : item?.status === "confirmed"
                        ? "#10B981"
                        : "#EF4444",
                  }}
                >
                  {item?.status === "pending"
                    ? t("waitingForClient")
                    : item?.status === "confirmed"
                    ? t("accepted")
                    : t("refused")}
                </Text>
              </View>
            </View>
          </View>

          {isAccepted && appointment && (
            <View className="p-5 border-t border-gray-200">
              {appointment.status === "pending" && (
                <View className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-3">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="schedule" size={22} color="#3B82F6" />
                    <Text
                      className="text-sm text-blue-800 ml-2"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("appointmentProposal")}
                    </Text>
                  </View>
                  <Text
                    className="text-4xl text-blue-900 mb-1"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {moment(appointment.date).format("dddd D MMMM")}
                  </Text>
                  <Text
                    className="text-2xl text-blue-800 mb-3"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {t("at")} {moment(appointment.date).format("HH:mm")}
                  </Text>
                  <Text
                    className="text-xs text-blue-700 mb-3"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                  >
                    {t("appointmentProposalDesc")}
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      className="flex-1 py-3"
                      style={{ backgroundColor: "#10B981" }}
                      onPress={() =>
                        handleUpdateAppointment(
                          appointment.id,
                          "confirmed",
                          item
                        )
                      }
                    >
                      <Text
                        className="text-white text-sm text-center"
                        style={{ fontFamily: "OpenSans_700Bold" }}
                      >
                        {t("accept")}
                      </Text>
                    </Pressable>
                    <Pressable
                      className="flex-1 py-3"
                      style={{ backgroundColor: "#EF4444" }}
                      onPress={() =>
                        handleUpdateAppointment(appointment.id, "refused", item)
                      }
                    >
                      <Text
                        className="text-white text-sm text-center"
                        style={{ fontFamily: "OpenSans_700Bold" }}
                      >
                        {t("refuse")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {appointment.status === "confirmed" && (
                <View className="bg-green-50 border-l-4 border-green-500 p-4 mb-3">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons
                      name="check-circle"
                      size={22}
                      color="#10B981"
                    />
                    <Text
                      className="text-sm text-green-800 ml-2"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("confirmedAppointment")}
                    </Text>
                  </View>
                  <Text
                    className="text-4xl text-green-900 mb-1"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {moment(appointment.date).format("dddd D MMMM")}
                  </Text>
                  <Text
                    className="text-2xl text-green-800 mb-2"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {t("at")} {moment(appointment.date).format("HH:mm")}
                  </Text>
                  <Text
                    className="text-xs text-green-700 mb-3"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                  >
                    {t("confirmedAppointmentDesc")}
                  </Text>
                  <Pressable
                    className="py-3 mb-2"
                    style={{ backgroundColor: COLORS.primary }}
                    onPress={() =>
                      handleUpdateAppointment(
                        appointment.id,
                        "waitPayment",
                        item
                      )
                    }
                  >
                    <Text
                      className="text-white text-sm text-center"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("missionCompleted")}
                    </Text>
                  </Pressable>
                </View>
              )}

              {appointment.status === "inProgress" && (
                <View className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-3">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons
                      name="hourglass-empty"
                      size={22}
                      color="#F59E0B"
                    />
                    <Text
                      className="text-sm text-orange-800 ml-2"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("missionInProgress")}
                    </Text>
                  </View>
                  <Text
                    className="text-xs text-orange-700 mb-3"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                  >
                    {t("missionInProgressDesc")}
                  </Text>
                  <Pressable
                    className="py-3"
                    style={{ backgroundColor: COLORS.primary }}
                    onPress={() =>
                      handleUpdateAppointment(
                        appointment.id,
                        "waitPayment",
                        item
                      )
                    }
                  >
                    <Text
                      className="text-white text-sm text-center"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("missionCompleted")}
                    </Text>
                  </Pressable>
                </View>
              )}

              {appointment.status === "waitPayment" && (
                <View className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-3">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="payment" size={22} color="#8B5CF6" />
                    <Text
                      className="text-sm text-purple-800 ml-2"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("waitingForPayment")}
                    </Text>
                  </View>
                  <Text
                    className="text-xs text-purple-700"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                  >
                    {t("waitingForPaymentDesc", { price: item.price })}
                  </Text>
                </View>
              )}

              {appointment.status === "paymentConfirmed" && (
                <View className="bg-green-50 border-l-4 border-green-500 p-4 mb-3">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons
                      name="check-circle"
                      size={22}
                      color="#10B981"
                    />
                    <Text
                      className="text-sm text-green-800 ml-2"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("paymentConfirmed")}
                    </Text>
                  </View>
                  <Text
                    className="text-xs text-green-700"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                  >
                    {t("paymentConfirmedDesc", { price: item.price })}
                  </Text>
                </View>
              )}

              {appointment.status === "refused" && (
                <View className="bg-red-50 border-l-4 border-red-500 p-4 mb-3">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="cancel" size={22} color="#EF4444" />
                    <Text
                      className="text-sm text-red-800 ml-2"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("appointmentRefusedStatus")}
                    </Text>
                  </View>
                  <Text
                    className="text-xs text-red-700"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                  >
                    {t("appointmentRefusedStatusDesc")}
                  </Text>
                </View>
              )}

              {appointment.status === "cancelled" && (
                <View className="bg-red-50 border-l-4 border-red-500 p-4 mb-3">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="cancel" size={22} color="#EF4444" />
                    <Text
                      className="text-sm text-red-800 ml-2"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("missionCancelled")}
                    </Text>
                  </View>
                  {appointment.cancelReason && (
                    <Text
                      className="text-xs text-red-700"
                      style={{ fontFamily: "OpenSans_400Regular" }}
                    >
                      {t("reason")} : {appointment.cancelReason}
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          <View className="p-5 border-t border-gray-100 flex-row flex-wrap gap-2">
            {isAccepted &&
              appointment &&
              (appointment.status === "pending" ||
                appointment.status === "confirmed") && (
                <>
                  {client?.phoneNumber && (
                    <Pressable
                      onPress={() => handleCallPhone(client.phoneNumber)}
                      className="px-5 py-3 flex-1"
                      style={{ backgroundColor: "#10B981", minWidth: 140 }}
                    >
                      <View className="flex-row items-center justify-center">
                        <MaterialIcons name="phone" size={18} color="#fff" />
                        <Text
                          className="text-white text-sm ml-2"
                          style={{ fontFamily: "OpenSans_700Bold" }}
                        >
                          {t("call")}
                        </Text>
                      </View>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => openCancelModal(appointment)}
                    className="px-5 py-3 flex-1"
                    style={{ backgroundColor: "#EF4444", minWidth: 140 }}
                  >
                    <Text
                      className="text-white text-sm text-center"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("cancel")}
                    </Text>
                  </Pressable>
                </>
              )}
          </View>
        </Animated.View>
      );
    },
    [
      getAppointmentForOffer,
      handleUpdateAppointment,
      handleCallPhone,
      clientsData,
      mapCoords,
      t,
    ]
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text
            className="text-gray-700 text-lg text-center mt-4"
            style={{ fontFamily: "OpenSans_600SemiBold" }}
          >
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (offers.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <MaterialIcons name="inbox" size={64} color="#D1D5DB" />
          <Text
            className="text-gray-500 text-lg text-center mt-4 mb-6"
            style={{ fontFamily: "OpenSans_600SemiBold" }}
          >
            {t("noOffersSent")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={displayedOffers}
        keyExtractor={(item) => item.id}
        renderItem={renderOffer}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreOffers}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <TouchableOpacity
            className="flex-1 justify-center px-5"
            activeOpacity={1}
            onPressOut={() => setCancelModalVisible(false)}
          >
            <View className="bg-white p-6">
              <Text
                className="text-2xl mb-5 text-center"
                style={{ fontFamily: "OpenSans_700Bold", color: "#EF4444" }}
              >
                {t("cancelMission")}
              </Text>

              <Text
                className="text-sm text-gray-700 mb-3"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                {t("indicateCancellationReason")}
              </Text>

              <TextInput
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder={t("cancelReasonPlaceholder")}
                placeholderTextColor="#9CA3AF"
                multiline
                className="bg-gray-50 border border-gray-300 p-4 mb-5 min-h-[120px] text-base"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  textAlignVertical: "top",
                }}
              />

              <View className="flex-row justify-end">
                <Pressable
                  onPress={() => setCancelModalVisible(false)}
                  className="px-5 py-3 mr-2 bg-gray-300"
                >
                  <Text
                    className="text-gray-700 text-sm"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {t("back")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleCancelAppointment}
                  disabled={!cancelReason.trim()}
                  className="px-5 py-3"
                  style={{
                    backgroundColor: !cancelReason.trim()
                      ? "#D1D5DB"
                      : "#EF4444",
                  }}
                >
                  <Text
                    className="text-white text-sm"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {t("confirmCancellation")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
