import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { COLORS } from "../styles/colors";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import moment from "moment";
import "moment/locale/fr";
import Loader from "../components/Loader";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next"; // Ajouter

moment.locale("fr");

const ITEMS_PER_PAGE = 20;

export default function ChatListScreen() {
  const { t } = useTranslation(); // Ajouter
  const navigation = useNavigation();
  const userId = auth.currentUser ? auth.currentUser.uid : null;

  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [displayedOffers, setDisplayedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointments, setAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const FILTERS = [
    { key: "all", label: t("filters.all"), icon: "list" },
    { key: "pending", label: t("filters.pending"), icon: "hourglass-empty" },
    { key: "confirmed", label: t("filters.confirmed"), icon: "check-circle" },
    { key: "rdv", label: t("filters.withAppointment"), icon: "event" },
    { key: "payment", label: t("filters.payment"), icon: "payment" },
    { key: "refused", label: t("filters.refused"), icon: "cancel" },
  ];

  const enrichOffersWithUsers = async (offersList) => {
    const enriched = [];

    for (const offer of offersList) {
      try {
        const isClient = offer.authorId === userId;
        const otherUserId = isClient ? offer.userId : offer.authorId;

        const userDoc = await getDoc(doc(db, "users", otherUserId));
        const userData = userDoc.exists() ? userDoc.data() : {};

        let projectInfo = {};
        if (offer.projectId) {
          const projectDoc = await getDoc(doc(db, "projects", offer.projectId));
          if (projectDoc.exists()) {
            const project = projectDoc.data();
            projectInfo = {
              title: project.type || t("defaults.project"),
              city: project.city || "",
              budget: project.budget || null,
            };
          }
        }

        const messagesRef = collection(db, "offers", offer.id, "messages");
        const messagesQuery = query(
          messagesRef,
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const messagesSnap = await getDocs(messagesQuery);
        const lastMsg = messagesSnap.docs[0]?.data();

        enriched.push({
          ...offer,
          isClient,
          otherUser: {
            id: otherUserId,
            username: userData.username || t("defaults.user"),
            photo: userData.photo || null,
            city: userData.city || "",
            postalCode: userData.postalCode || "",
            phoneNumber: userData.phoneNumber || "",
            expoPushToken: userData.expoPushToken || null,
          },
          project: projectInfo,
          lastMessage: lastMsg
            ? {
                text: lastMsg.text || "",
                createdAt: lastMsg.createdAt?.toDate() || new Date(),
                system: lastMsg.system || false,
              }
            : null,
        });
      } catch (error) {
        console.error("Erreur enrichissement offre:", error);
      }
    }

    return enriched;
  };

 const fetchAppointments = async (offerIds) => {
  if (offerIds.length === 0) return [];
  
  console.log("🎯 ChatList - fetchAppointments avec offerIds:", offerIds);
  
  const appointmentsCol = collection(db, "appointments");
  const q = query(appointmentsCol, where("offerId", "in", offerIds));
  const snap = await getDocs(q);
  
  console.log("🎯 ChatList - Appointments trouvés:", snap.docs.length);
  
  const appointments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  
  if (appointments.length > 0) {
    console.log("🎯 ChatList - Premier appointment:", JSON.stringify(appointments[0], null, 2));
  }
  
  return appointments;
};

  const fetchOffers = async () => {
    try {
      const offersRef = collection(db, "offers");

      const qCouturier = query(offersRef, where("userId", "==", userId));
      const snapCouturier = await getDocs(qCouturier);

      const qClient = query(offersRef, where("authorId", "==", userId));
      const snapClient = await getDocs(qClient);

      const allOffers = [
        ...snapCouturier.docs.map((d) => ({ id: d.id, ...d.data() })),
        ...snapClient.docs.map((d) => ({ id: d.id, ...d.data() })),
      ];

      const enriched = await enrichOffersWithUsers(allOffers);

      enriched.sort((a, b) => {
        const dateA = a.lastMessage?.createdAt || a.createdAt?.toDate() || new Date(0);
        const dateB = b.lastMessage?.createdAt || b.createdAt?.toDate() || new Date(0);
        return dateB - dateA;
      });

      const offerIds = enriched.map((o) => o.id);
      const loadedAppointments = await fetchAppointments(offerIds);

      setOffers(enriched);
      setAppointments(loadedAppointments);
      
      applyFilter(enriched, loadedAppointments, selectedFilter);
    } catch (error) {
      console.error("Erreur chargement offres:", error);
    }
  };

  const applyFilter = (offersList, appointmentsList, filterKey) => {
    let filtered = [...offersList];

    switch (filterKey) {
      case "pending":
        filtered = filtered.filter((o) => o.status === "pending");
        break;
      case "confirmed":
        filtered = filtered.filter((o) => o.status === "confirmed");
        break;
      case "refused":
        filtered = filtered.filter((o) => o.status === "refused");
        break;
      case "rdv":
        filtered = filtered.filter((o) => {
          const apt = appointmentsList.find((a) => a.offerId === o.id);
          return apt && apt.status !== "cancelled";
        });
        break;
      case "payment":
        filtered = filtered.filter((o) => {
          const apt = appointmentsList.find((a) => a.offerId === o.id);
          return apt && (apt.status === "waitPayment" || apt.status === "paymentConfirmed");
        });
        break;
      case "all":
      default:
        break;
    }

    setFilteredOffers(filtered);
    setDisplayedOffers(filtered.slice(0, ITEMS_PER_PAGE));
    setCurrentPage(1);
  };

  const handleFilterChange = (filterKey) => {
    setSelectedFilter(filterKey);
    applyFilter(offers, appointments, filterKey);
  };

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setLoading(false);
        return;
      }

      const loadData = async () => {
        setLoading(true);
        await fetchOffers();
        setLoading(false);
      };

      loadData();
    }, [userId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  };

  const loadMoreOffers = () => {
    if (loadingMore || displayedOffers.length >= filteredOffers.length) return;

    setLoadingMore(true);
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const newOffers = filteredOffers.slice(0, nextPage * ITEMS_PER_PAGE);
      setDisplayedOffers(newOffers);
      setCurrentPage(nextPage);
      setLoadingMore(false);
    }, 300);
  };

  const getAppointmentForOffer = (offerId) =>
    appointments.find((a) => a.offerId === offerId);

  const getStatusBadge = (offer) => {
    const appointment = getAppointmentForOffer(offer.id);

    if (offer.status === "confirmed" && appointment) {
      switch (appointment.status) {
        case "pending":
          return { text: t("status.appointmentProposed"), color: "#3B82F6", icon: "schedule" };
        case "confirmed":
          return { text: t("status.appointmentConfirmed"), color: "#10B981", icon: "check-circle" };
        case "inProgress":
          return { text: t("status.inProgress"), color: "#F59E0B", icon: "build" };
        case "waitPayment":
          return { text: t("status.toPay"), color: "#8B5CF6", icon: "payment" };
        case "paymentConfirmed":
          return { text: t("status.completed"), color: "#10B981", icon: "check-circle" };
        case "cancelled":
          return { text: t("status.cancelled"), color: "#EF4444", icon: "cancel" };
        default:
          return { text: t("status.accepted"), color: "#10B981", icon: "check" };
      }
    }

    switch (offer.status) {
      case "pending":
        return { text: t("status.pending"), color: "#F59E0B", icon: "hourglass-empty" };
      case "confirmed":
        return { text: t("status.accepted"), color: "#10B981", icon: "check" };
      case "refused":
        return { text: t("status.refused"), color: "#EF4444", icon: "close" };
      default:
        return { text: t("status.unknown"), color: "#6B7280", icon: "help" };
    }
  };

  const getContextualMessage = (offer, isClient) => {
    const appointment = getAppointmentForOffer(offer.id);

    if (offer.status === "pending") {
      return isClient
        ? t("contextual.awaitingYourDecision")
        : t("contextual.awaitingClientResponse");
    }

    if (offer.status === "refused") {
      return t("contextual.offerRefused");
    }

    if (offer.status === "confirmed") {
      if (!appointment) {
        return isClient
          ? t("contextual.proposeAppointment")
          : t("contextual.awaitingAppointmentProposal");
      }

      if (appointment.status === "pending") {
        return isClient
          ? t("contextual.awaitingConfirmation")
          : t("contextual.confirmAppointment");
      }

      if (appointment.status === "confirmed") {
        return t("contextual.appointmentOn", { date: moment(appointment.date).format("DD/MM à HH:mm") });
      }

      if (appointment.status === "inProgress") {
        return t("contextual.missionInProgress");
      }

      if (appointment.status === "waitPayment") {
        return isClient ? t("contextual.paymentRequired") : t("contextual.awaitingPayment");
      }

      if (appointment.status === "paymentConfirmed") {
        return t("contextual.missionCompleted");
      }

      if (appointment.status === "cancelled") {
        return t("contextual.appointmentCancelled");
      }
    }

    return offer.lastMessage?.text || t("contextual.newConversation");
  };

  const renderConversation = ({ item, index }) => {
    const statusBadge = getStatusBadge(item);
    const contextualMsg = getContextualMessage(item, item.isClient);

    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 30)}>
        <Pressable
          onPress={() =>
            navigation.navigate("ChatScreen", {
              offerId: item.id,
              isClient: item.isClient,
              otherUser: item.otherUser,
              project: item.project,
              offerData: {
                price: item.price,
                status: item.status,
                message: item.message,
              },
            })
          }
          className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <View className="mr-3 relative">
            {item.otherUser.photo ? (
              <Image
                source={{ uri: item.otherUser.photo }}
                className="w-14 h-14 rounded-full"
              />
            ) : (
              <View
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Text
                  className="text-white text-xl"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  {item.otherUser.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            <View
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white items-center justify-center"
              style={{ backgroundColor: statusBadge.color }}
            >
              <MaterialIcons name={statusBadge.icon} size={12} color="#fff" />
            </View>
          </View>

          <View className="flex-1 mr-2">
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className="text-base text-gray-900 flex-1"
                style={{ fontFamily: "OpenSans_700Bold" }}
                numberOfLines={1}
              >
                {item.otherUser.username}
              </Text>
              <Text
                className="text-xs text-gray-500 ml-2"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                {item.lastMessage?.createdAt
                  ? moment(item.lastMessage.createdAt).fromNow()
                  : moment(item.createdAt?.toDate()).fromNow()}
              </Text>
            </View>

            <View className="flex-row items-center mb-1">
              <Text
                className="text-sm flex-1"
                style={{ fontFamily: "OpenSans_600SemiBold", color: COLORS.primary }}
                numberOfLines={1}
              >
                {item.project.title}
              </Text>
              <View
                className="px-2 py-0.5 rounded ml-2"
                style={{ backgroundColor: item.isClient ? "#DBEAFE" : "#FEF3C7" }}
              >
                <Text
                  className="text-xs"
                  style={{
                    fontFamily: "OpenSans_700Bold",
                    color: item.isClient ? "#1E40AF" : "#B45309",
                  }}
                >
                  {item.isClient ? t("roles.client") : t("roles.tailor")}
                </Text>
              </View>
            </View>

            <Text
              className="text-sm text-gray-600"
              style={{ fontFamily: "OpenSans_400Regular" }}
              numberOfLines={1}
            >
              {item.lastMessage?.system ? "📢 " : ""}
              {contextualMsg}
            </Text>

            <View className="flex-row items-center mt-1">
              <MaterialIcons name="euro" size={14} color="#6B7280" />
              <Text
                className="text-sm text-gray-600 ml-1"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                {item.price}
              </Text>
            </View>
          </View>

          <MaterialIcons name="chevron-right" size={24} color="#D1D5DB" />
        </Pressable>
      </Animated.View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  const renderEmptyList = () => {
    if (loading) return null;

    const isFiltered = selectedFilter !== "all";
    
    return (
      <View className="flex-1 justify-center items-center px-6 py-20">
        <MaterialIcons 
          name={isFiltered ? "filter-list" : "chat-bubble-outline"} 
          size={80} 
          color="#D1D5DB" 
        />
        <Text
          className="text-gray-500 text-xl text-center mt-4 mb-2"
          style={{ fontFamily: "OpenSans_700Bold" }}
        >
          {isFiltered ? t("empty.noResults") : t("empty.noConversations")}
        </Text>
        <Text
          className="text-gray-400 text-sm text-center"
          style={{ fontFamily: "OpenSans_400Regular" }}
        >
          {isFiltered 
            ? t("empty.tryAnotherFilter")
            : t("empty.conversationsWillAppear")}
        </Text>
      </View>
    );
  };

  if (loading) return <Loader />;

  if (!userId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text
            className="text-gray-700 text-lg text-center mt-4"
            style={{ fontFamily: "OpenSans_600SemiBold" }}
          >
            {t("errors.userNotConnected")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text
              className="text-2xl"
              style={{ fontFamily: "OpenSans_700Bold", color: COLORS.primary }}
            >
              {t("header.title")}
            </Text>
            <Text
              className="text-sm text-gray-600 mt-1"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              {filteredOffers.length} {filteredOffers.length > 1 ? t("header.conversationPlural") : t("header.conversationSingular")}
              {selectedFilter !== "all" && ` ${t("header.filtered")}`}
            </Text>
          </View>
          
          <Pressable
            onPress={onRefresh}
            disabled={refreshing}
            className="p-2"
          >
            <MaterialIcons 
              name="refresh" 
              size={28} 
              color={refreshing ? "#D1D5DB" : COLORS.primary} 
            />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-5 px-5"
        >
          {FILTERS.map((filter) => (
            <Pressable
              key={filter.key}
              onPress={() => handleFilterChange(filter.key)}
              className="mr-2 px-4 py-2 rounded-full flex-row items-center"
              style={{
                backgroundColor:
                  selectedFilter === filter.key ? COLORS.primary : "#F3F4F6",
              }}
            >
              <MaterialIcons
                name={filter.icon}
                size={16}
                color={selectedFilter === filter.key ? "#fff" : "#6B7280"}
              />
              <Text
                className="text-sm ml-1"
                style={{
                  fontFamily: "OpenSans_700Bold",
                  color: selectedFilter === filter.key ? "#fff" : "#6B7280",
                }}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={displayedOffers}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreOffers}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}
