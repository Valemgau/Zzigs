import React, { useCallback, useLayoutEffect, useState } from "react";
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
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import moment from "moment";
import "moment/locale/fr";
import { Image } from "expo-image";
import { COLORS } from "../styles/colors";
import Loader from "../components/Loader";
import Header from "../components/Header";

moment.locale("fr");

const ITEMS_PER_PAGE = 20;

export default function Calendar() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const userId = auth.currentUser?.uid;

  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [displayedOffers, setDisplayedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const FILTERS = [
    { key: "all", label: t("filters.all"), icon: "list" },
    { key: "pending", label: t("filters.pending"), icon: "hourglass-empty" },
    { key: "confirmed", label: t("filters.confirmed"), icon: "check-circle" },
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
              description: project.description || "",
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
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB - dateA;
      });

      setOffers(enriched);
      applyFilter(enriched, selectedFilter);
    } catch (error) {
      console.error("Erreur chargement offres:", error);
    }
  };

  const applyFilter = (offersList, filterKey) => {
    let filtered = [...offersList];

    if (filterKey !== "all") {
      filtered = filtered.filter((o) => o.status === filterKey);
    }

    setFilteredOffers(filtered);
    setDisplayedOffers(filtered.slice(0, ITEMS_PER_PAGE));
    setCurrentPage(1);
  };

  const handleFilterChange = (filterKey) => {
    setSelectedFilter(filterKey);
    applyFilter(offers, filterKey);
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        text: t("status.pending"),
        color: "#F59E0B",
        icon: "hourglass-empty",
      },
      confirmed: {
        text: t("status.accepted"),
        color: "#10B981",
        icon: "check-circle",
      },
      refused: {
        text: t("status.refused"),
        color: "#EF4444",
        icon: "cancel",
      },
    };
    return (
      badges[status] || {
        text: t("status.unknown"),
        color: "#6B7280",
        icon: "help",
      }
    );
  };

  const getContextualMessage = (offer) => {
    switch (offer.status) {
      case "pending":
        return offer.isClient
          ? t("contextual.awaitingYourDecision")
          : t("contextual.awaitingClientResponse");
      case "refused":
        return t("contextual.offerRefused");
      case "confirmed":
        return t("contextual.proposeAppointment");
      default:
        return offer.lastMessage?.text || t("contextual.newConversation");
    }
  };

  const renderOffer = ({ item, index }) => {
    const statusBadge = getStatusBadge(item.status);
    const contextualMsg = getContextualMessage(item);
    const otherUser = item.otherUser || {};

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
          className="bg-white mx-4 mb-3 rounded-2xl overflow-hidden"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Header avec photo et status */}
          <View
            className="p-4 flex-row items-center"
            style={{ backgroundColor: `${COLORS.primary}08` }}
          >
            <View className="mr-3 relative">
              {otherUser.photo ? (
                <Image
                  source={{ uri: otherUser.photo }}
                  className="w-16 h-16 rounded-full"
                  style={{
                    borderWidth: 3,
                    borderColor: COLORS.primary,
                  }}
                />
              ) : (
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: COLORS.primary,
                    borderWidth: 3,
                    borderColor: `${COLORS.primary}40`,
                  }}
                >
                  <Text className="text-white text-2xl font-bold">
                    {otherUser.username?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                </View>
              )}

              <View
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white items-center justify-center"
                style={{ backgroundColor: statusBadge.color }}
              >
                <MaterialIcons name={statusBadge.icon} size={14} color="#fff" />
              </View>
            </View>

            <View className="flex-1">
              <Text
                style={{ fontFamily: "OpenSans_700Bold" }}
                className="text-lg text-gray-900 mb-1"
                numberOfLines={1}
              >
                {otherUser.username || t("defaults.user")}
              </Text>

              <View className="flex-row items-center mb-1">
                <View
                  className="px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: item.isClient ? "#DBEAFE" : "#FEF3C7",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "OpenSans_700Bold",
                      color: item.isClient ? "#1E40AF" : "#B45309",
                    }}
                    className="text-xs"
                  >
                    {item.isClient ? t("roles.client") : t("roles.tailor")}
                  </Text>
                </View>
              </View>

              {otherUser.city && (
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="place"
                    size={14}
                    color={COLORS.primary}
                  />
                  <Text
                    style={{
                      fontFamily: "OpenSans_400Regular",
                      color: COLORS.primary,
                    }}
                    className="text-sm ml-1"
                  >
                    {otherUser.city}
                  </Text>
                </View>
              )}
            </View>

            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: statusBadge.color }}
            >
              <Text
                style={{ fontFamily: "OpenSans_600SemiBold" }}
                className="text-white text-xs"
              >
                {statusBadge.text}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-100" />

          {/* Infos offre */}
          <View className="p-4">
            {/* Projet */}
            <View className="flex-row items-center mb-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${COLORS.primary}15` }}
              >
                <MaterialIcons
                  name="content-cut"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                  className="text-gray-900 text-base"
                >
                  {item.project?.title || t("defaults.project")}
                </Text>
                {item.project?.city && (
                  <Text
                    style={{ fontFamily: "OpenSans_400Regular" }}
                    className="text-gray-600 text-sm mt-0.5"
                  >
                    {item.project.city}
                  </Text>
                )}
              </View>
            </View>

            {/* Date de création */}
            <View className="flex-row items-center mb-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${COLORS.primary}15` }}
              >
                <MaterialIcons
                  name="calendar-today"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                  className="text-gray-900 text-base"
                >
                  {moment(item.createdAt?.toDate()).format("dddd DD MMMM YYYY")}
                </Text>
                <Text
                  style={{ fontFamily: "OpenSans_400Regular" }}
                  className="text-gray-600 text-sm mt-0.5"
                >
                  {moment(item.createdAt?.toDate()).format("HH:mm")}
                </Text>
              </View>
            </View>

            {/* Message de l'offre */}
            {item.message && (
              <View className="flex-row items-start mb-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${COLORS.primary}15` }}
                >
                  <MaterialIcons
                    name="message"
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: "OpenSans_400Regular" }}
                    className="text-gray-600 text-sm"
                    numberOfLines={3}
                  >
                    {item.message}
                  </Text>
                </View>
              </View>
            )}

            {/* Prix et action */}
            <View className="flex-row items-center">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${COLORS.primary}15` }}
              >
                <MaterialIcons name="euro" size={18} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                  className="text-gray-900 text-base"
                >
                  {item.price}€
                </Text>
                <Text
                  style={{ fontFamily: "OpenSans_400Regular" }}
                  className="text-gray-600 text-sm mt-0.5"
                >
                  {contextualMsg}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={COLORS.primary}
              />
            </View>
          </View>
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
        <View
          className="w-24 h-24 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${COLORS.primary}15` }}
        >
          <MaterialIcons
            name={isFiltered ? "filter-list" : "event-busy"}
            size={48}
            color={COLORS.primary}
          />
        </View>
        <Text
          style={{ fontFamily: "OpenSans_700Bold", color: COLORS.primary }}
          className="text-xl text-center mb-2"
        >
          {isFiltered ? t("empty.noResults") : t("empty.noConversations")}
        </Text>
        <Text
          style={{ fontFamily: "OpenSans_400Regular" }}
          className="text-gray-500 text-sm text-center"
        >
          {isFiltered
            ? t("empty.tryAnotherFilter")
            : t("empty.conversationsWillAppear")}
        </Text>
      </View>
    );
  };

  if (loading) {
    return <Loader />;
  }

  if (!userId) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text
            style={{ fontFamily: "OpenSans_700Bold" }}
            className="text-gray-700 text-lg text-center mt-4"
          >
            {t("errors.userNotConnected")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text
              style={{
                fontFamily: "OpenSans_700Bold",
                color: COLORS.primary,
              }}
              className="text-2xl"
            >
              {t("chatList.header.title")}
            </Text>
            <Text
              style={{ fontFamily: "OpenSans_400Regular" }}
              className="text-sm text-gray-600 mt-1"
            >
              {filteredOffers.length}{" "}
              {filteredOffers.length > 1
                ? t("header.conversationPlural")
                : t("header.conversationSingular")}
              {selectedFilter !== "all" && ` ${t("header.filtered")}`}
            </Text>
          </View>

          <Pressable
            onPress={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-full"
            style={{
              backgroundColor: refreshing ? "#F3F4F6" : `${COLORS.primary}15`,
            }}
          >
            <MaterialIcons
              name="refresh"
              size={24}
              color={refreshing ? "#D1D5DB" : COLORS.primary}
            />
          </Pressable>
        </View>

        {/* Filtres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 px-5"
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
                style={{
                  fontFamily: "OpenSans_600SemiBold",
                  color: selectedFilter === filter.key ? "#fff" : "#6B7280",
                }}
                className="text-sm ml-1"
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Liste */}
      <FlatList
        data={displayedOffers}
        keyExtractor={(item) => item.id}
        renderItem={renderOffer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
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
