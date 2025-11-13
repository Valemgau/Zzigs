import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Keyboard,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import {
  GiftedChat,
  Bubble,
  InputToolbar,
  Send,
  SystemMessage,
} from "react-native-gifted-chat";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { COLORS } from "../styles/colors";
import { MaterialIcons } from "@expo/vector-icons";
import { showMessage } from "react-native-flash-message";
import { Calendar } from "react-native-calendars";
import moment from "moment";
import "moment/locale/fr";
import sendNotifs from "../utils/sendNotifs";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

moment.locale("fr");

export default function ChatScreen() {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const {
    offerId,
    isClient,
    otherUser,
    project,
    offerData: initialOfferData,
  } = route.params;

  const userId = auth.currentUser?.uid;
  const currentUser = auth.currentUser;

  const [messages, setMessages] = useState([]);
  const [offerData, setOfferData] = useState(initialOfferData);
  const [appointment, setAppointment] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);

  // Header collapse state
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const headerHeight = useRef(new Animated.Value(1)).current;

  // Modals
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  // Form states
  const [newPrice, setNewPrice] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const availableTimes = [
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
  ];

  // Récupérer les données du user actuel
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!userId) return;

      try {
        const currentUserDoc = await getDoc(doc(db, "users", userId));
        if (currentUserDoc.exists()) {
          setCurrentUserData(currentUserDoc.data());
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des données utilisateur:",
          error
        );
      }
    };

    fetchCurrentUser();
  }, [userId]);

  // Helper pour obtenir le nom complet du user actuel
  const getCurrentUserDisplayName = () => {
    if (currentUserData?.firstname && currentUserData?.lastname) {
      return `${currentUserData.firstname} ${currentUserData.lastname}`;
    }
    if (currentUserData?.firstname) {
      return currentUserData.firstname;
    }
    if (currentUser?.email) {
      return currentUser.email.split("@")[0];
    }
    return t("chat.defaults.user");
  };

  // Toggle header
  const toggleHeader = () => {
    const toValue = headerExpanded ? 0 : 1;
    Animated.timing(headerHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setHeaderExpanded(!headerExpanded);
  };

  // Écouter les messages en temps réel
  useEffect(() => {
    const messagesRef = collection(db, "offers", offerId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const createdAt =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date();

        return {
          _id: docSnap.id,
          text: data.text || "",
          createdAt: createdAt,
          user: {
            _id: data.userId || "system",
            name: data.userName || t("chat.defaults.system"),
          },
          system: data.system || false,
        };
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [offerId, t]);

  // Écouter les changements de l'offre
  useEffect(() => {
    const offerRef = doc(db, "offers", offerId);
    const unsubscribe = onSnapshot(offerRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOfferData({
          price: data.price,
          status: data.status,
          message: data.message,
        });
      }
    });

    return () => unsubscribe();
  }, [offerId]);

  // Écouter les rendez-vous
  useEffect(() => {
    const appointmentsRef = collection(db, "appointments");
    const unsubscribe = onSnapshot(appointmentsRef, (snapshot) => {
      const apt = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .find((a) => a.offerId === offerId);
      setAppointment(apt || null);
    });

    return () => unsubscribe();
  }, [offerId]);

  // Envoyer un message
  const onSend = useCallback(
    async (newMessages = []) => {
      try {
        const message = newMessages[0];
        const messagesRef = collection(db, "offers", offerId, "messages");

        await addDoc(messagesRef, {
          text: message.text,
          createdAt: serverTimestamp(),
          userId: userId,
          userName: getCurrentUserDisplayName(),
          system: false,
        });

        // Notification à l'autre utilisateur
        const otherUserDoc = await getDoc(doc(db, "users", otherUser.id));
        const otherUserData = otherUserDoc.exists()
          ? otherUserDoc.data()
          : null;

        if (otherUserData?.expoPushToken) {
          await sendNotifs(
            { id: otherUser.id, ...otherUserData },
            {
              title: t("chat.notifications.newMessage", {
                userName: getCurrentUserDisplayName(),
              }),
              body: message.text.substring(0, 100),
              type: "new_message",
            }
          );
        }
      } catch (error) {
        console.error("Erreur envoi message:", error);
        showMessage({
          message: t("chat.flashMessages.errorTitle"),
          description: t("chat.flashMessages.errorSendMessage"),
          type: "danger",
        });
      }
    },
    [offerId, userId, otherUser.id, currentUserData, t]
  );

  // Envoyer un message système
  const sendSystemMessage = async (text) => {
    try {
      const messagesRef = collection(db, "offers", offerId, "messages");
      await addDoc(messagesRef, {
        text,
        createdAt: serverTimestamp(),
        userId: "system",
        userName: t("chat.defaults.system"),
        system: true,
      });
    } catch (error) {
      console.error("Erreur envoi message système:", error);
    }
  };

  // CLIENT : Accepter l'offre
  const handleAcceptOffer = async () => {
    try {
      await updateDoc(doc(db, "offers", offerId), {
        status: "confirmed",
      });

      await sendSystemMessage(
        t("chat.systemMessages.offerAccepted", { price: offerData.price })
      );

      const couturierDoc = await getDoc(doc(db, "users", otherUser.id));
      const couturierData = couturierDoc.exists() ? couturierDoc.data() : null;

      if (couturierData?.expoPushToken) {
        await sendNotifs(
          { id: otherUser.id, ...couturierData },
          {
            title: t("chat.notifications.offerAccepted"),
            body: t("chat.notifications.offerAcceptedDesc", {
              price: offerData.price,
              projectTitle: project.title,
            }),
            type: "offer_accepted",
          }
        );
      }

      showMessage({
        message: t("chat.flashMessages.offerAcceptedTitle"),
        description: t("chat.flashMessages.offerAcceptedDesc"),
        type: "success",
      });

      setStatusModalVisible(false);
    } catch (error) {
      console.error("Erreur acceptation offre:", error);
      showMessage({
        message: t("chat.flashMessages.errorTitle"),
        description: t("chat.flashMessages.errorAcceptOffer"),
        type: "danger",
      });
    }
  };

  // CLIENT : Refuser l'offre
  const handleRefuseOffer = async () => {
    try {
      await updateDoc(doc(db, "offers", offerId), {
        status: "refused",
      });

      await sendSystemMessage(t("chat.systemMessages.offerRefused"));

      const couturierDoc = await getDoc(doc(db, "users", otherUser.id));
      const couturierData = couturierDoc.exists() ? couturierDoc.data() : null;

      if (couturierData?.expoPushToken) {
        await sendNotifs(
          { id: otherUser.id, ...couturierData },
          {
            title: t("chat.notifications.offerRefusedTitle"),
            body: t("chat.notifications.offerRefusedDesc", {
              projectTitle: project.title,
            }),
            type: "offer_refused",
          }
        );
      }

      showMessage({
        message: t("chat.flashMessages.offerRefusedTitle"),
        description: t("chat.flashMessages.offerRefusedDesc"),
        type: "success",
      });

      setStatusModalVisible(false);
    } catch (error) {
      console.error("Erreur refus offre:", error);
      showMessage({
        message: t("chat.flashMessages.errorTitle"),
        description: t("chat.flashMessages.errorRefuseOffer"),
        type: "danger",
      });
    }
  };

  // COUTURIER : Modifier le prix
  const handleUpdatePrice = async () => {
    const price = parseFloat(newPrice);
    if (!price || price <= 0) {
      showMessage({
        message: t("chat.flashMessages.invalidPrice"),
        description: t("chat.flashMessages.invalidPriceDesc"),
        type: "warning",
      });
      return;
    }

    try {
      await updateDoc(doc(db, "offers", offerId), {
        price: price,
      });

      await sendSystemMessage(
        t("chat.systemMessages.priceModified", {
          oldPrice: offerData.price,
          newPrice: price,
        })
      );

      const clientDoc = await getDoc(doc(db, "users", otherUser.id));
      const clientData = clientDoc.exists() ? clientDoc.data() : null;

      if (clientData?.expoPushToken) {
        await sendNotifs(
          { id: otherUser.id, ...clientData },
          {
            title: t("chat.notifications.priceModifiedTitle"),
            body: t("chat.notifications.priceModifiedDesc", { price }),
            type: "price_changed",
          }
        );
      }

      showMessage({
        message: t("chat.flashMessages.priceModifiedTitle"),
        description: t("chat.flashMessages.priceModifiedDesc"),
        type: "success",
      });

      setPriceModalVisible(false);
      setNewPrice("");
    } catch (error) {
      console.error("Erreur modification prix:", error);
      showMessage({
        message: t("chat.flashMessages.errorTitle"),
        description: t("chat.flashMessages.errorModifyPrice"),
        type: "danger",
      });
    }
  };

  // CLIENT : Proposer un rendez-vous
  const handleProposeAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      showMessage({
        message: t("chat.flashMessages.dateTimeRequired"),
        description: t("chat.flashMessages.dateTimeRequiredDesc"),
        type: "warning",
      });
      return;
    }

    try {
      const appointmentDate = `${selectedDate}T${selectedTime}:00`;

      await addDoc(collection(db, "appointments"), {
        offerId: offerId,
        clientId: userId,
        couturierId: otherUser.id,
        date: appointmentDate,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      await sendSystemMessage(
        t("chat.systemMessages.appointmentProposed", {
          date: moment(appointmentDate).format("dddd D MMMM à HH:mm"),
        })
      );

      const couturierDoc = await getDoc(doc(db, "users", otherUser.id));
      const couturierData = couturierDoc.exists() ? couturierDoc.data() : null;

      if (couturierData?.expoPushToken) {
        await sendNotifs(
          { id: otherUser.id, ...couturierData },
          {
            title: t("chat.notifications.newAppointmentTitle"),
            body: t("chat.notifications.newAppointmentDesc", {
              date: moment(appointmentDate).format("D MMMM à HH:mm"),
            }),
            type: "appointment_pending",
          }
        );
      }

      showMessage({
        message: t("chat.flashMessages.appointmentProposedTitle"),
        description: t("chat.flashMessages.appointmentProposedDesc"),
        type: "success",
      });

      setAppointmentModalVisible(false);
      setSelectedDate(null);
      setSelectedTime(null);
      setShowTimePicker(false);
    } catch (error) {
      console.error("Erreur proposition rendez-vous:", error);
      showMessage({
        message: t("chat.flashMessages.errorTitle"),
        description: t("chat.flashMessages.errorProposeAppointment"),
        type: "danger",
      });
    }
  };

  // COUTURIER : Confirmer rendez-vous
  const handleConfirmAppointment = async () => {
    try {
      await updateDoc(doc(db, "appointments", appointment.id), {
        status: "confirmed",
      });

      await sendSystemMessage(
        t("chat.systemMessages.appointmentConfirmed", {
          date: moment(appointment.date).format("dddd D MMMM à HH:mm"),
        })
      );

      const clientDoc = await getDoc(doc(db, "users", otherUser.id));
      const clientData = clientDoc.exists() ? clientDoc.data() : null;

      if (clientData?.expoPushToken) {
        await sendNotifs(
          { id: otherUser.id, ...clientData },
          {
            title: t("chat.notifications.appointmentConfirmedTitle"),
            body: t("chat.notifications.appointmentConfirmedDesc", {
              date: moment(appointment.date).format("D MMMM à HH:mm"),
            }),
            type: "appointment_confirmed",
          }
        );
      }

      showMessage({
        message: t("chat.flashMessages.appointmentConfirmedTitle"),
        type: "success",
      });
    } catch (error) {
      console.error("Erreur confirmation rendez-vous:", error);
      showMessage({
        message: t("chat.flashMessages.errorTitle"),
        type: "danger",
      });
    }
  };

  // COUTURIER : Refuser rendez-vous
  const handleRefuseAppointment = async () => {
    try {
      await updateDoc(doc(db, "appointments", appointment.id), {
        status: "refused",
      });

      await sendSystemMessage(t("chat.systemMessages.appointmentRefused"));

      const clientDoc = await getDoc(doc(db, "users", otherUser.id));
      const clientData = clientDoc.exists() ? clientDoc.data() : null;

      if (clientData?.expoPushToken) {
        await sendNotifs(
          { id: otherUser.id, ...clientData },
          {
            title: t("chat.notifications.appointmentRefusedTitle"),
            body: t("chat.notifications.appointmentRefusedDesc"),
            type: "appointment_refused",
          }
        );
      }

      showMessage({
        message: t("chat.flashMessages.appointmentRefusedTitle"),
        type: "success",
      });
    } catch (error) {
      console.error("Erreur refus rendez-vous:", error);
      showMessage({
        message: t("chat.flashMessages.errorTitle"),
        type: "danger",
      });
    }
  };

  // Annuler rendez-vous
  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      showMessage({
        message: t("chat.flashMessages.reasonRequired"),
        description: t("chat.flashMessages.reasonRequiredDesc"),
        type: "warning",
      });
      return;
    }

    try {
      await updateDoc(doc(db, "appointments", appointment.id), {
        status: "cancelled",
        cancelReason: cancelReason.trim(),
        cancelledAt: serverTimestamp(),
        cancelledBy: userId,
      });

      await sendSystemMessage(
        t("chat.systemMessages.appointmentCancelled", {
          reason: cancelReason.trim(),
        })
      );

      const otherUserDoc = await getDoc(doc(db, "users", otherUser.id));
      const otherUserData = otherUserDoc.exists() ? otherUserDoc.data() : null;

      if (otherUserData?.expoPushToken) {
        await sendNotifs(
          { id: otherUser.id, ...otherUserData },
          {
            title: t("chat.notifications.appointmentCancelledTitle"),
            body: t("chat.notifications.appointmentCancelledDesc", {
              reason: cancelReason.trim(),
            }),
            type: "appointment_cancelled",
          }
        );
      }

      showMessage({
        message: t("chat.flashMessages.appointmentCancelledTitle"),
        type: "success",
      });

      setCancelModalVisible(false);
      setCancelReason("");
    } catch (error) {
      console.error("Erreur annulation rendez-vous:", error);
      showMessage({
        message: t("chat.flashMessages.errorTitle"),
        type: "danger",
      });
    }
  };

  // COUTURIER : Démarrer la mission
  const handleMarkInProgress = async () => {
    try {
      await updateDoc(doc(db, "appointments", appointment.id), {
        status: "inProgress",
      });

      await sendSystemMessage(t("chat.systemMessages.missionStarted"));

      showMessage({
        message: t("chat.flashMessages.missionInProgressTitle"),
        type: "success",
      });
    } catch (error) {
      console.error("Erreur:", error);
      showMessage({
        message: t("chat.flashMessages.errorTitle"),
        type: "danger",
      });
    }
  };

  // COUTURIER : Marquer terminé
  const handleMarkCompleted = async () => {
    try {
      await updateDoc(doc(db, "appointments", appointment.id), {
        status: "waitPayment",
      });

      await sendSystemMessage(
        t("chat.systemMessages.missionCompleted", { price: offerData.price })
      );

      const clientDoc = await getDoc(doc(db, "users", otherUser.id));
      const clientData = clientDoc.exists() ? clientDoc.data() : null;

      if (clientData?.expoPushToken) {
        await sendNotifs(
          { id: otherUser.id, ...clientData },
          {
            title: t("chat.notifications.missionCompletedTitle"),
            body: t("chat.notifications.missionCompletedDesc", {
              price: offerData.price,
            }),
            type: "mission_completed",
          }
        );
      }

      showMessage({
        message: t("chat.flashMessages.missionCompletedTitle"),
        description: t("chat.flashMessages.missionCompletedDesc"),
        type: "success",
      });
    } catch (error) {
      console.error("Erreur:", error);
      showMessage({
        message: t("chat.flashMessages.errorTitle"),
        type: "danger",
      });
    }
  };

  // Appeler
  const handleCall = async () => {
    const otherUserDoc = await getDoc(doc(db, "users", otherUser.id));
    const otherUserData = otherUserDoc.exists() ? otherUserDoc.data() : null;
    const phoneNumber = otherUserData?.phoneNumber;

    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      showMessage({
        message: t("chat.flashMessages.noPhoneNumber"),
        description: t("chat.flashMessages.noPhoneNumberDesc"),
        type: "warning",
      });
    }
  };

  // Envoyer SMS
  const handleSMS = async () => {
    const otherUserDoc = await getDoc(doc(db, "users", otherUser.id));
    const otherUserData = otherUserDoc.exists() ? otherUserDoc.data() : null;
    const phoneNumber = otherUserData?.phoneNumber;

    if (phoneNumber) {
      Linking.openURL(`sms:${phoneNumber}`);
    } else {
      showMessage({
        message: t("chat.flashMessages.noPhoneNumber"),
        description: t("chat.flashMessages.noPhoneNumberDesc"),
        type: "warning",
      });
    }
  };

  // Render personnalisés GiftedChat
  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: COLORS.primary,
            paddingHorizontal: 4,
            paddingVertical: 2,
          },
          left: {
            backgroundColor: "#F3F4F6",
            paddingHorizontal: 4,
            paddingVertical: 2,
          },
        }}
        textStyle={{
          right: {
            color: "#fff",
            fontFamily: "OpenSans_400Regular",
          },
          left: {
            color: "#1F2937",
            fontFamily: "OpenSans_400Regular",
          },
        }}
      />
    );
  };

  const renderSystemMessage = (props) => {
    return (
      <SystemMessage
        {...props}
        containerStyle={{
          marginBottom: 10,
        }}
        textStyle={{
          fontSize: 13,
          color: "#6B7280",
          fontFamily: "OpenSans_600SemiBold",
        }}
      />
    );
  };

  const renderInputToolbar = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: "#fff",
          borderTopColor: "#E5E7EB",
          borderTopWidth: 1,
          paddingVertical: 6,
          paddingHorizontal: 8,
          marginBottom: 0,
        }}
        primaryStyle={{
          alignItems: "center",
        }}
      />
    );
  };

  const renderSend = (props) => {
    return (
      <Send
        {...props}
        containerStyle={{ justifyContent: "center", paddingHorizontal: 8 }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: COLORS.primary }}
        >
          <MaterialIcons name="send" size={20} color="#fff" />
        </View>
      </Send>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "confirmed":
        return "#10B981";
      case "refused":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const animatedInfoBarHeight = headerHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150],
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1">
            {/* Header */}
            <View className="bg-white px-4 py-3 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Pressable
                    onPress={() => navigation.goBack()}
                    className="mr-3"
                  >
                    <MaterialIcons
                      name="arrow-back"
                      size={24}
                      color="#1F2937"
                    />
                  </Pressable>

                  {otherUser.photo ? (
                    <Image
                      source={{ uri: otherUser.photo }}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  ) : (
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      <Text
                        className="text-white text-sm"
                        style={{ fontFamily: "OpenSans_700Bold" }}
                      >
                        {otherUser.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View className="flex-1">
                    <Text
                      className="text-base text-gray-900"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                      numberOfLines={1}
                    >
                      {otherUser.username}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{
                        fontFamily: "OpenSans_600SemiBold",
                        color: COLORS.primary,
                      }}
                      numberOfLines={1}
                    >
                      {project.title}
                    </Text>
                  </View>
                </View>

                {/* Boutons appel, SMS et collapse */}
                <View className="flex-row gap-2">
                  {offerData.status === "confirmed" && (
                    <>
                      <Pressable onPress={handleSMS} className="p-2">
                        <MaterialIcons
                          name="message"
                          size={24}
                          color={COLORS.primary}
                        />
                      </Pressable>
                      <Pressable onPress={handleCall} className="p-2">
                        <MaterialIcons
                          name="phone"
                          size={24}
                          color={COLORS.primary}
                        />
                      </Pressable>
                    </>
                  )}
                  <Pressable onPress={toggleHeader} className="p-2">
                    <MaterialIcons
                      name={headerExpanded ? "expand-less" : "expand-more"}
                      size={24}
                      color="#6B7280"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Info bar - Collapsable */}
              <Animated.View
                style={{
                  maxHeight: animatedInfoBarHeight,
                  overflow: "hidden",
                }}
              >
                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <View
                      className="w-2 h-2 rounded-full mr-2"
                      style={{
                        backgroundColor: getStatusColor(offerData.status),
                      }}
                    />
                    <Text
                      className="text-xs text-gray-600"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {offerData.status === "pending"
                        ? t("chat.status.pending")
                        : offerData.status === "confirmed"
                        ? t("chat.status.accepted")
                        : t("chat.status.refused")}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <MaterialIcons name="euro" size={16} color="#6B7280" />
                    <Text
                      className="text-sm text-gray-700 ml-1"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {offerData.price}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* Bandeau d'information contextuelle - Collapsable */}
            <Animated.View
              style={{
                maxHeight: animatedInfoBarHeight,
                overflow: "hidden",
              }}
              className="bg-blue-50 border-b border-blue-100"
            >
              <View className="px-4 py-3">
                {isClient && offerData.status === "pending" && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="info" size={18} color="#3B82F6" />
                    <Text
                      className="text-sm text-blue-800 ml-2 flex-1"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("chat.infoBar.clientPendingDecision")}
                    </Text>
                  </View>
                )}

                {!isClient && offerData.status === "pending" && (
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="hourglass-empty"
                      size={18}
                      color="#F59E0B"
                    />
                    <Text
                      className="text-sm text-orange-800 ml-2 flex-1"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("chat.infoBar.tailorWaitingClient")}
                    </Text>
                  </View>
                )}

                {isClient &&
                  offerData.status === "confirmed" &&
                  !appointment && (
                    <View className="flex-row items-center">
                      <MaterialIcons name="event" size={18} color="#3B82F6" />
                      <Text
                        className="text-sm text-blue-800 ml-2 flex-1"
                        style={{ fontFamily: "OpenSans_600SemiBold" }}
                      >
                        {t("chat.infoBar.clientMustProposeAppointment")}
                      </Text>
                    </View>
                  )}

                {!isClient &&
                  offerData.status === "confirmed" &&
                  !appointment && (
                    <View className="flex-row items-center">
                      <MaterialIcons
                        name="event-note"
                        size={18}
                        color="#F59E0B"
                      />
                      <Text
                        className="text-sm text-orange-800 ml-2 flex-1"
                        style={{ fontFamily: "OpenSans_600SemiBold" }}
                      >
                        {t("chat.infoBar.tailorWaitingAppointment")}
                      </Text>
                    </View>
                  )}

                {isClient && appointment?.status === "pending" && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="schedule" size={18} color="#F59E0B" />
                    <Text
                      className="text-sm text-orange-800 ml-2 flex-1"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("chat.infoBar.clientWaitingConfirmation")}
                    </Text>
                  </View>
                )}

                {!isClient && appointment?.status === "pending" && (
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="event-available"
                      size={18}
                      color="#3B82F6"
                    />
                    <Text
                      className="text-sm text-blue-800 ml-2 flex-1"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("chat.infoBar.tailorMustConfirm")}
                    </Text>
                  </View>
                )}

                {appointment?.status === "confirmed" && (
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="check-circle"
                      size={18}
                      color="#10B981"
                    />
                    <Text
                      className="text-sm text-green-800 ml-2 flex-1"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("chat.infoBar.appointmentConfirmed", {
                        date: moment(appointment.date).format("DD/MM à HH:mm"),
                      })}
                    </Text>
                  </View>
                )}

                {appointment?.status === "inProgress" && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="build" size={18} color="#F59E0B" />
                    <Text
                      className="text-sm text-orange-800 ml-2 flex-1"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("chat.infoBar.missionInProgress")}
                    </Text>
                  </View>
                )}

                {isClient && appointment?.status === "waitPayment" && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="payment" size={18} color="#8B5CF6" />
                    <Text
                      className="text-sm text-purple-800 ml-2 flex-1"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("chat.infoBar.clientMustPay")}
                    </Text>
                  </View>
                )}

                {!isClient && appointment?.status === "waitPayment" && (
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="hourglass-empty"
                      size={18}
                      color="#8B5CF6"
                    />
                    <Text
                      className="text-sm text-purple-800 ml-2 flex-1"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("chat.infoBar.tailorWaitingPayment")}
                    </Text>
                  </View>
                )}

                {appointment?.status === "paymentConfirmed" && (
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="check-circle"
                      size={18}
                      color="#10B981"
                    />
                    <Text
                      className="text-sm text-green-800 ml-2 flex-1"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("chat.infoBar.missionCompletedPaid")}
                    </Text>
                  </View>
                )}

                {appointment?.status === "cancelled" && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="cancel" size={18} color="#EF4444" />
                    <Text
                      className="text-sm text-red-800 ml-2 flex-1"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("chat.infoBar.appointmentCancelled")}
                    </Text>
                  </View>
                )}

                {offerData.status === "refused" && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="cancel" size={18} color="#EF4444" />
                    <Text
                      className="text-sm text-red-800 ml-2 flex-1"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {t("chat.infoBar.offerRefused")}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Action buttons */}
            <View className="bg-white border-b border-gray-200 px-3 py-2">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {/* Actions CLIENT */}
                {isClient && (
                  <>
                    {offerData.status === "pending" && (
                      <Pressable
                        onPress={() => setStatusModalVisible(true)}
                        className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                        style={{ backgroundColor: "#10B981" }}
                      >
                        <MaterialIcons
                          name="check-circle"
                          size={16}
                          color="#fff"
                        />
                        <Text
                          className="text-white text-xs ml-1"
                          style={{ fontFamily: "OpenSans_700Bold" }}
                        >
                          {t("chat.buttons.acceptRefuse")}
                        </Text>
                      </Pressable>
                    )}

                    {offerData.status === "confirmed" && !appointment && (
                      <Pressable
                        onPress={() => setAppointmentModalVisible(true)}
                        className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                        style={{ backgroundColor: COLORS.primary }}
                      >
                        <MaterialIcons name="event" size={16} color="#fff" />
                        <Text
                          className="text-white text-xs ml-1"
                          style={{ fontFamily: "OpenSans_700Bold" }}
                        >
                          {t("chat.buttons.proposeAppointment")}
                        </Text>
                      </Pressable>
                    )}

                    {appointment &&
                      (appointment.status === "pending" ||
                        appointment.status === "confirmed") && (
                        <Pressable
                          onPress={() => setCancelModalVisible(true)}
                          className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                          style={{ backgroundColor: "#EF4444" }}
                        >
                          <MaterialIcons name="cancel" size={16} color="#fff" />
                          <Text
                            className="text-white text-xs ml-1"
                            style={{ fontFamily: "OpenSans_700Bold" }}
                          >
                            {t("chat.buttons.cancelAppointment")}
                          </Text>
                        </Pressable>
                      )}

                    {appointment?.status === "waitPayment" && (
                      <Pressable
                        onPress={() => {
                          navigation.navigate("PayScreen", {
                            appointmentId: appointment.id,
                            amount: offerData.price,
                          });
                        }}
                        className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                        style={{ backgroundColor: "#8B5CF6" }}
                      >
                        <MaterialIcons name="payment" size={16} color="#fff" />
                        <Text
                          className="text-white text-xs ml-1"
                          style={{ fontFamily: "OpenSans_700Bold" }}
                        >
                          {t("chat.buttons.pay", { amount: offerData.price })}
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}

                {/* Actions COUTURIER */}
                {!isClient && (
                  <>
                    {(offerData.status === "pending" ||
                      offerData.status === "confirmed") &&
                      appointment?.status !== "waitPayment" &&
                      appointment?.status !== "paymentConfirmed" && (
                        <Pressable
                          onPress={() => setPriceModalVisible(true)}
                          className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                          style={{ backgroundColor: COLORS.primary }}
                        >
                          <MaterialIcons name="euro" size={16} color="#fff" />
                          <Text
                            className="text-white text-xs ml-1"
                            style={{ fontFamily: "OpenSans_700Bold" }}
                          >
                            {t("chat.buttons.modifyPrice")}
                          </Text>
                        </Pressable>
                      )}

                    {appointment?.status === "pending" && (
                      <>
                        <Pressable
                          onPress={handleConfirmAppointment}
                          className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                          style={{ backgroundColor: "#10B981" }}
                        >
                          <MaterialIcons name="check" size={16} color="#fff" />
                          <Text
                            className="text-white text-xs ml-1"
                            style={{ fontFamily: "OpenSans_700Bold" }}
                          >
                            {t("chat.buttons.confirmAppointment")}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={handleRefuseAppointment}
                          className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                          style={{ backgroundColor: "#EF4444" }}
                        >
                          <MaterialIcons name="close" size={16} color="#fff" />
                          <Text
                            className="text-white text-xs ml-1"
                            style={{ fontFamily: "OpenSans_700Bold" }}
                          >
                            {t("chat.buttons.refuseAppointment")}
                          </Text>
                        </Pressable>
                      </>
                    )}

                    {appointment?.status === "confirmed" && (
                      <>
                        <Pressable
                          onPress={handleMarkInProgress}
                          className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                          style={{ backgroundColor: "#F59E0B" }}
                        >
                          <MaterialIcons name="build" size={16} color="#fff" />
                          <Text
                            className="text-white text-xs ml-1"
                            style={{ fontFamily: "OpenSans_700Bold" }}
                          >
                            {t("chat.buttons.start")}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => setCancelModalVisible(true)}
                          className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                          style={{ backgroundColor: "#EF4444" }}
                        >
                          <MaterialIcons name="cancel" size={16} color="#fff" />
                          <Text
                            className="text-white text-xs ml-1"
                            style={{ fontFamily: "OpenSans_700Bold" }}
                          >
                            {t("chat.buttons.cancel")}
                          </Text>
                        </Pressable>
                      </>
                    )}

                    {appointment?.status === "inProgress" && (
                      <Pressable
                        onPress={handleMarkCompleted}
                        className="mr-2 px-4 py-2 rounded-full flex-row items-center"
                        style={{ backgroundColor: "#10B981" }}
                      >
                        <MaterialIcons
                          name="check-circle"
                          size={16}
                          color="#fff"
                        />
                        <Text
                          className="text-white text-xs ml-1"
                          style={{ fontFamily: "OpenSans_700Bold" }}
                        >
                          {t("chat.buttons.completed")}
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </ScrollView>
            </View>

            {/* Chat */}
            <GiftedChat
              messages={messages}
              onSend={(messages) => onSend(messages)}
              user={{
                _id: userId,
              }}
              renderBubble={renderBubble}
              renderSystemMessage={renderSystemMessage}
              renderInputToolbar={renderInputToolbar}
              renderSend={renderSend}
              placeholder={t("chat.input.placeholder")}
              alwaysShowSend
              scrollToBottom
              locale="fr"
              timeFormat="HH:mm"
              dateFormat="DD/MM/YYYY"
              showUserAvatar={false}
              bottomOffset={-330}
              minInputToolbarHeight={56}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Modal Accepter/Refuser (Client) */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-center px-5"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPressOut={() => setStatusModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-white p-6 rounded-2xl">
              <Text
                className="text-2xl mb-5 text-center"
                style={{
                  fontFamily: "OpenSans_700Bold",
                  color: COLORS.primary,
                }}
              >
                {t("chat.modals.decision.title")}
              </Text>

              <View className="mb-6 p-4 bg-gray-50 rounded-lg">
                <Text
                  className="text-sm text-gray-600 mb-2"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  {t("chat.modals.decision.proposedPrice")}
                </Text>
                <View className="flex-row items-center">
                  <MaterialIcons name="euro" size={24} color={COLORS.primary} />
                  <Text
                    className="text-3xl ml-2"
                    style={{
                      fontFamily: "OpenSans_700Bold",
                      color: COLORS.primary,
                    }}
                  >
                    {offerData.price}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleAcceptOffer}
                className="mb-3 py-4 rounded-xl"
                style={{ backgroundColor: "#10B981" }}
              >
                <Text
                  className="text-white text-center text-base"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  {t("chat.modals.decision.acceptButton")}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleRefuseOffer}
                className="mb-3 py-4 rounded-xl"
                style={{ backgroundColor: "#EF4444" }}
              >
                <Text
                  className="text-white text-center text-base"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  {t("chat.modals.decision.refuseButton")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setStatusModalVisible(false)}
                className="py-3"
              >
                <Text
                  className="text-gray-600 text-center"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {t("chat.modals.decision.cancelButton")}
                </Text>
              </Pressable>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal Modifier prix (Couturier) */}
      <Modal
        visible={priceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPriceModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <TouchableOpacity
            className="flex-1 justify-center px-5"
            activeOpacity={1}
            onPressOut={() => setPriceModalVisible(false)}
          >
            <TouchableOpacity activeOpacity={1}>
              <View className="bg-white p-6 rounded-2xl">
                <Text
                  className="text-2xl mb-5 text-center"
                  style={{
                    fontFamily: "OpenSans_700Bold",
                    color: COLORS.primary,
                  }}
                >
                  {t("chat.modals.price.title")}
                </Text>

                <View className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <Text
                    className="text-xs text-gray-600 mb-1"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                  >
                    {t("chat.modals.price.currentPrice")}
                  </Text>
                  <View className="flex-row items-center">
                    <MaterialIcons name="euro" size={20} color="#6B7280" />
                    <Text
                      className="text-2xl ml-1 text-gray-700"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {offerData.price}
                    </Text>
                  </View>
                </View>

                <TextInput
                  value={newPrice}
                  onChangeText={setNewPrice}
                  placeholder={t("chat.modals.price.placeholder")}
                  keyboardType="numeric"
                  className="bg-gray-50 border-2 border-gray-200 p-4 mb-5 rounded-xl text-lg"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                />

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      setPriceModalVisible(false);
                      setNewPrice("");
                    }}
                    className="flex-1 px-5 py-4 bg-gray-200 rounded-xl"
                  >
                    <Text
                      className="text-gray-700 text-center text-sm"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("chat.modals.price.cancelButton")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUpdatePrice}
                    disabled={!newPrice}
                    className="flex-1 px-5 py-4 rounded-xl"
                    style={{
                      backgroundColor: !newPrice ? "#D1D5DB" : COLORS.primary,
                    }}
                  >
                    <Text
                      className="text-white text-center text-sm"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("chat.modals.price.modifyButton")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal RDV (Client) */}
      <Modal
        visible={appointmentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAppointmentModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-center px-5"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPressOut={() => setAppointmentModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-white p-6 rounded-2xl max-h-[80%]">
              <Text
                className="text-2xl mb-5 text-center"
                style={{
                  fontFamily: "OpenSans_700Bold",
                  color: COLORS.primary,
                }}
              >
                {t("chat.modals.appointment.title")}
              </Text>

              {!selectedDate && (
                <Calendar
                  onDayPress={(day) => {
                    setSelectedDate(day.dateString);
                    setShowTimePicker(true);
                  }}
                  minDate={new Date().toISOString().split("T")[0]}
                  markedDates={
                    selectedDate
                      ? {
                          [selectedDate]: {
                            selected: true,
                            selectedColor: COLORS.primary,
                          },
                        }
                      : {}
                  }
                  theme={{
                    selectedDayBackgroundColor: COLORS.primary,
                    todayTextColor: COLORS.primary,
                    arrowColor: COLORS.primary,
                  }}
                />
              )}

              {selectedDate && showTimePicker && (
                <>
                  <Text
                    className="text-lg text-center mb-4"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {moment(selectedDate).format("dddd D MMMM YYYY")}
                  </Text>
                  <ScrollView style={{ maxHeight: 250 }} className="mb-4">
                    {availableTimes.map((time) => (
                      <Pressable
                        key={time}
                        onPress={() => setSelectedTime(time)}
                        className={`py-3 px-4 mb-2 rounded-xl border-2 ${
                          selectedTime === time
                            ? "border-transparent"
                            : "border-gray-200"
                        }`}
                        style={{
                          backgroundColor:
                            selectedTime === time ? COLORS.primary : "#F9FAFB",
                        }}
                      >
                        <Text
                          className="text-center text-base"
                          style={{
                            fontFamily: "OpenSans_700Bold",
                            color: selectedTime === time ? "#fff" : "#374151",
                          }}
                        >
                          {time}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              <View className="flex-row gap-2 mt-4">
                <Pressable
                  onPress={() => {
                    setAppointmentModalVisible(false);
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setShowTimePicker(false);
                  }}
                  className="flex-1 px-5 py-4 bg-gray-200 rounded-xl"
                >
                  <Text
                    className="text-gray-700 text-center text-sm"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {t("chat.modals.appointment.cancelButton")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleProposeAppointment}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 px-5 py-4 rounded-xl"
                  style={{
                    backgroundColor:
                      !selectedDate || !selectedTime
                        ? "#D1D5DB"
                        : COLORS.primary,
                  }}
                >
                  <Text
                    className="text-white text-center text-sm"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {t("chat.modals.appointment.proposeButton")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal Annulation */}
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
            <TouchableOpacity activeOpacity={1}>
              <View className="bg-white p-6 rounded-2xl">
                <Text
                  className="text-2xl mb-5 text-center"
                  style={{ fontFamily: "OpenSans_700Bold", color: "#EF4444" }}
                >
                  {t("chat.modals.cancelAppointment.title")}
                </Text>

                <Text
                  className="text-sm text-gray-700 mb-3"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  {t("chat.modals.cancelAppointment.description")}
                </Text>

                <TextInput
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  placeholder={t("chat.modals.cancelAppointment.placeholder")}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  className="bg-gray-50 border-2 border-gray-200 p-4 mb-5 rounded-xl min-h-[120px] text-base"
                  style={{
                    fontFamily: "OpenSans_400Regular",
                    textAlignVertical: "top",
                  }}
                />

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      setCancelModalVisible(false);
                      setCancelReason("");
                    }}
                    className="flex-1 px-5 py-4 bg-gray-200 rounded-xl"
                  >
                    <Text
                      className="text-gray-700 text-center text-sm"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("chat.modals.cancelAppointment.backButton")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCancelAppointment}
                    disabled={!cancelReason.trim()}
                    className="flex-1 px-5 py-4 rounded-xl"
                    style={{
                      backgroundColor: !cancelReason.trim()
                        ? "#D1D5DB"
                        : "#EF4444",
                    }}
                  >
                    <Text
                      className="text-white text-center text-sm"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {t("chat.modals.cancelAppointment.confirmButton")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
