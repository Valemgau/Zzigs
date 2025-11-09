import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Modal,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import React, {
  useLayoutEffect,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import { auth, db } from "../../config/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  getCountFromServer,
  setDoc,
  updateDoc,
  limit,
  startAfter,
} from "firebase/firestore";
import { COLORS } from "../styles/colors";
import postalCodes from "../utils/postalcode.json";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import * as Notifications from "expo-notifications";
import { Image } from "expo-image";
import Loader from "../components/Loader";
import { showMessage } from "react-native-flash-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { useTrackingPermissions } from "expo-tracking-transparency";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PROJECTS_PER_PAGE = 10;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isClient, setIsClient] = useState(undefined);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [filterPostal, setFilterPostal] = useState(null);
  const [postalModalVisible, setPostalModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [postalSortedProjects, setPostalSortedProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [status, requestPermission] = useTrackingPermissions();

  const scrollY = useSharedValue(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (Platform.OS === "ios" && !status) {
      setTimeout(() => {
        requestPermission();
      }, 1000);
    }
  }, [status]);

  const checkNotificationPrompt = useCallback(async () => {
    try {
      const hasSeenPrompt = await AsyncStorage.getItem(
        "hasSeenNotificationPrompt"
      );
      const { status } = await Notifications.getPermissionsAsync();

      if (!hasSeenPrompt && status !== "granted") {
        setTimeout(() => {
          setNotificationModalVisible(true);
        }, 1500);
      }
    } catch (error) {
      console.error("Erreur vérification prompt notifications:", error);
    }
  }, []);

  const setupNotifications = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission notifications refusée");
        return false;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      const uid = auth.currentUser?.uid;
      if (!uid) return false;

      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, { expoPushToken: token }).catch(
        async (error) => {
          if (error.code === "not-found") {
            await setDoc(userDocRef, { expoPushToken: token }, { merge: true });
          } else {
            throw error;
          }
        }
      );

      console.log("Token Expo enregistré");

      return true;
    } catch (error) {
      console.error("Erreur setup notifications:", error);
      return false;
    }
  }, []);

  const handleActivateNotifications = async () => {
    const success = await setupNotifications();

    await AsyncStorage.setItem("hasSeenNotificationPrompt", "true");
    setNotificationModalVisible(false);

    if (success) {
      showMessage({
        message: t("notificationsEnabled"),
        description: t("notificationsEnabledDesc"),
        type: "success",
      });
    }
  };

  const handleSkipNotifications = async () => {
    await AsyncStorage.setItem("hasSeenNotificationPrompt", "true");
    setNotificationModalVisible(false);
  };

  useEffect(() => {
    checkNotificationPrompt();
  }, [checkNotificationPrompt]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <Header isClient={isClient} />,
    });
  }, [navigation, isClient]);

  const fetchUserDataAndPendingCount = useCallback(async () => {
    if (!auth.currentUser) {
      setIsClient(false);
      setPendingCount(0);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      const data = userDoc.exists() ? userDoc.data() : null;
      const isClientVal = data?.isClient === true;
      setIsClient(isClientVal);

      const offersCol = collection(db, "offers");
      const q = isClientVal
        ? query(
            offersCol,
            where("authorId", "==", auth.currentUser.uid),
            where("status", "==", "pending")
          )
        : query(
            offersCol,
            where("userId", "==", auth.currentUser.uid),
            where("status", "==", "pending")
          );

      const snapshot = await getCountFromServer(q);
      setPendingCount(snapshot.data().count);
    } catch (error) {
      console.error("Erreur récupération données utilisateur:", error);
      setIsClient(false);
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    fetchUserDataAndPendingCount();
  }, [fetchUserDataAndPendingCount]);

  useFocusEffect(
    useCallback(() => {
      const checkUserStatus = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
          await user.reload();
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (!userDoc.exists()) return;

          const data = userDoc.data();

          if (!data.isActive) {
            navigation.replace("BloqueCompte");
            return;
          }

          if (!data.emailIsVerified) {
            navigation.replace("VerifyEmail");
            return;
          }

          if (!data.isClient) {
            if (!data.firstname || !data.lastname || !data.username) {
              navigation.navigate("EditProfile", { from: "checkUser" });
              showMessage({
                message: t("completeProfile"),
                description: t("completeProfileDesc"),
                type: "info",
              });
              return;
            }
            if (!data.address) {
              navigation.navigate("EditLocation", { from: "checkUser" });
              showMessage({
                message: t("missingAddress"),
                description: t("missingAddressDesc"),
                type: "info",
              });
              return;
            }
            if (!data.postalCode) {
              navigation.navigate("EditLocation", { from: "checkUser" });
              showMessage({
                message: t("missingPostalCode"),
                description: t("missingPostalCodeDesc"),
                type: "info",
              });
              return;
            }
            if (!data.phoneNumber) {
              navigation.navigate("EditPhoneNumber", { from: "checkUser" });
              showMessage({
                message: t("missingPhoneNumber"),
                description: t("missingPhoneNumberDesc"),
                type: "info",
              });
              return;
            }
            // if (!data.iban || !data.bankName || !data.bankAccountNumber) {
            //   navigation.navigate("EditBankInfo", { from: "checkUser" });
            //   showMessage({
            //     message: t("incompleteBankInfo"),
            //     description: t("incompleteBankInfoDesc"),
            //     type: "info",
            //   });
            //   return;
            // }
          } else {
            if (!data.firstname || !data.lastname) {
              navigation.navigate("EditProfile", { from: "checkUser" });
              showMessage({
                message: t("completeProfile"),
                description: t("completeProfileNameDesc"),
                type: "info",
              });
              return;
            }
            if (!data.address) {
              navigation.navigate("EditLocation", { from: "checkUser" });
              showMessage({
                message: t("missingAddress"),
                description: t("missingAddressDesc"),
                type: "info",
              });
              return;
            }
            if (!data.phoneNumber) {
              navigation.navigate("EditPhoneNumber", { from: "checkUser" });
              showMessage({
                message: t("missingPhoneNumber"),
                description: t("missingPhoneNumberDesc"),
                type: "info",
              });
              return;
            }
          }
        } catch (error) {
          console.error("Erreur vérification utilisateur :", error);
          Alert.alert(t("error"), t("accountCheckError"));
        }
      };

      checkUserStatus();
    }, [navigation, t])
  );

  const enrichProjectsWithUser = useCallback(async (projectList) => {
    const userIds = [...new Set(projectList.map((p) => p.userId))];

    const usersData = {};
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            usersData[uid] = {
              username: data.username || "Utilisateur",
              photo: data.photo || null,
              city: data.city || "",
              postalCode: data.postalCode || "",
              phoneNumber: data.phoneNumber || "",
            };
          }
        } catch (error) {
          console.error(`Erreur chargement user ${uid}:`, error);
        }
      })
    );

    return projectList.map((proj) => ({
      ...proj,
      username: usersData[proj.userId]?.username || "Utilisateur",
      userPhoto: usersData[proj.userId]?.photo || null,
      userCity: usersData[proj.userId]?.city || "",
      userPostalCode: usersData[proj.userId]?.postalCode || "",
      userPhoneNumber: usersData[proj.userId]?.phoneNumber || "",
    }));
  }, []);

  // Chargement initial avec limite
  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      orderBy("createdAt", "desc"),
      limit(PROJECTS_PER_PAGE)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          let projs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          projs = await enrichProjectsWithUser(projs);
          setProjects(projs);
          setAllProjects(projs);

          // Garder le dernier document pour la pagination
          if (snapshot.docs.length > 0) {
            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === PROJECTS_PER_PAGE);
          } else {
            setHasMore(false);
          }

          setTimeout(() => setLoading(false), 300);
        } catch (error) {
          console.error("Erreur traitement projets:", error);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Erreur snapshot projets:", error);
        Alert.alert("Erreur", "Impossible de charger les projets");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [enrichProjectsWithUser]);

  // Fonction pour charger plus de projets
  const loadMoreProjects = async () => {
    if (!hasMore || loadingMore || !lastVisible) return;

    setLoadingMore(true);

    try {
      const q = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(PROJECTS_PER_PAGE)
      );

      const snapshot = await getDocs(q);

      if (snapshot.docs.length > 0) {
        let newProjects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        newProjects = await enrichProjectsWithUser(newProjects);

        setProjects((prev) => [...prev, ...newProjects]);
        setAllProjects((prev) => [...prev, ...newProjects]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === PROJECTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Erreur chargement plus de projets:", error);
      Alert.alert("Erreur", "Impossible de charger plus de projets");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!filterPostal) {
      setPostalSortedProjects([]);
      return;
    }

    const fetchFilteredProjects = async () => {
      setLoading(true);

      try {
        const usersQuery = query(
          collection(db, "users"),
          where("postalCode", "==", filterPostal)
        );
        const userSnapshot = await getDocs(usersQuery);
        const userIds = userSnapshot.docs.map((d) => d.id);

        if (userIds.length === 0) {
          setPostalSortedProjects([]);
          setLoading(false);
          return;
        }

        const projectsSnapshot = await getDocs(collection(db, "projects"));
        let filteredProjects = projectsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((proj) => userIds.includes(proj.userId));

        filteredProjects = await enrichProjectsWithUser(filteredProjects);
        setPostalSortedProjects(filteredProjects);
      } catch (error) {
        console.error("Erreur filtrage projets:", error);
        Alert.alert("Erreur", "Impossible de filtrer les projets");
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProjects();
  }, [filterPostal, enrichProjectsWithUser]);

  const filteredPostalCodes = useMemo(() => {
    if (!search.trim()) return postalCodes;

    const searchTerm = search.trim().toLowerCase();
    return postalCodes.filter(
      (item) =>
        item.codePostal.toLowerCase().includes(searchTerm) ||
        item.nomCommune?.toLowerCase().includes(searchTerm)
    );
  }, [search]);

  const handleScroll = useCallback((event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    scrollY.value = withTiming(currentScrollY > 100 ? 1 : 0, {
      duration: 300,
    });
    lastScrollY.current = currentScrollY;
  }, []);

  const fabAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(scrollY.value, [0, 1], [180, 56]);
    return { width };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, 0.3, 1], [1, 0, 0]),
      width: interpolate(scrollY.value, [0, 1], [130, 0]),
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      marginLeft: interpolate(scrollY.value, [0, 1], [8, 0]),
    };
  });

  const ImageCarousel = useCallback(({ photos, projectId }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    const images =
      photos?.length > 0 ? photos : [require("../../assets/img/default.png")];

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }).current;

    const viewabilityConfig = useRef({
      itemVisiblePercentThreshold: 50,
    }).current;

    return (
      <View style={{ height: 140 }}>
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${projectId}-${index}`}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_WIDTH - 40, height: 140 }}>
              <Image
                source={typeof item === "string" ? { uri: item } : item}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
          )}
          scrollEnabled={images.length > 1}
        />

        {images.length > 1 && (
          <View
            className="absolute bottom-2 right-2 px-2 py-1 flex-row items-center"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 10 }}
          >
            <MaterialIcons name="photo-library" size={12} color="#fff" />
            <Text
              className="text-white text-xs ml-1"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {currentIndex + 1}/{images.length}
            </Text>
          </View>
        )}

        {images.length > 1 && (
          <View
            className="absolute bottom-2 left-0 right-0 flex-row justify-center items-center"
            style={{ gap: 4 }}
          >
            {images.map((_, index) => (
              <View
                key={index}
                style={{
                  width: currentIndex === index ? 16 : 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor:
                    currentIndex === index
                      ? COLORS.primary
                      : "rgba(255,255,255,0.6)",
                }}
              />
            ))}
          </View>
        )}
      </View>
    );
  }, []);

  const renderProjectItem = useCallback(
    ({ item }) => (
      <Pressable
        className="bg-white mx-5 mb-3 overflow-hidden"
        style={{
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
        onPress={() =>
          navigation.navigate("ProjectDetailsScreen", { projectId: item.id })
        }
      >
        <Animated.View entering={FadeIn.duration(100)}>
          <ImageCarousel photos={item.photos} projectId={item.id} />

          {item.budget && (
            <View
              className="absolute top-2 right-2 px-2.5 py-1 flex-row items-center"
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <MaterialIcons name="attach-money" size={14} color="#fff" />
              <Text
                className="text-white text-xs ml-0.5"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                {item.budget} €
              </Text>
            </View>
          )}
        </Animated.View>

        <View className="p-3">
          <Text
            className="text-base text-gray-900 mb-1 capitalize"
            style={{ fontFamily: "OpenSans_700Bold" }}
            numberOfLines={1}
          >
            {item.type || t("project")}
          </Text>

          <Text
            numberOfLines={2}
            className="text-xs text-gray-600 mb-3 leading-4"
            style={{ fontFamily: "OpenSans_400Regular" }}
          >
            {item.project}
          </Text>

          <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
            <View className="flex-row items-center flex-1">
              {item.userPhoto ? (
                <Animated.View
                  entering={FadeIn.duration(700)}
                  className="w-8 h-8 rounded-full mr-2 bg-gray-200"
                >
                  <Image
                    source={{ uri: item.userPhoto }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 9999,
                    }}
                  />
                </Animated.View>
              ) : (
                <Animated.View
                  entering={FadeIn.duration(400)}
                  className="w-8 h-8 rounded-full mr-2 items-center justify-center"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Text
                    className="text-white text-xs"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {item.username?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </Animated.View>
              )}
              <View className="flex-1">
                <Text
                  className="text-xs text-gray-900"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                  numberOfLines={1}
                >
                  {item.username || t("user")}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <MaterialIcons name="location-on" size={11} color="#9CA3AF" />
                  <Text
                    className="text-[10px] text-gray-500 ml-0.5"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                    numberOfLines={1}
                  >
                    {item.userCity && item.userPostalCode
                      ? `${item.userCity} (${item.userPostalCode})`
                      : t("notSpecified")}
                  </Text>
                </View>
              </View>
            </View>

            <View
              className="w-7 h-7 rounded-full items-center justify-center ml-2"
              style={{ backgroundColor: COLORS.primary + "20" }}
            >
              <MaterialIcons
                name="arrow-forward"
                size={14}
                color={COLORS.primary}
              />
            </View>
          </View>
        </View>
      </Pressable>
    ),
    [navigation, ImageCarousel, t]
  );

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View className="py-4 items-center">
        {loadingMore ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Pressable
            onPress={loadMoreProjects}
            className="px-6 py-3 flex-row items-center"
            style={{
              backgroundColor: COLORS.primary + "15",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: COLORS.primary + "30",
            }}
          >
            <Text
              className="text-sm mr-2"
              style={{
                fontFamily: "OpenSans_600SemiBold",
                color: COLORS.primary,
              }}
            >
              {t("loadMore") || "Voir plus"}
            </Text>
            <MaterialIcons
              name="expand-more"
              size={18}
              color={COLORS.primary}
            />
          </Pressable>
        )}
      </View>
    );
  };

  if (loading) {
    return <Loader />;
  }

  const dataToDisplay = filterPostal ? postalSortedProjects : projects;

  if (dataToDisplay.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <MaterialIcons name="search-off" size={64} color="#D1D5DB" />
          <Text
            className="text-gray-500 text-base text-center mt-4 mb-6"
            style={{ fontFamily: "OpenSans_400Regular" }}
          >
            {filterPostal
              ? t("noProjectsForPostalCode")
              : t("noProjectsAvailable")}
          </Text>
          {filterPostal && (
            <Pressable
              onPress={() => setFilterPostal(null)}
              className="px-6 py-3 border border-gray-300"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Text
                className="text-white text-sm"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                {t("removeFilter")}
              </Text>
            </Pressable>
          )}
        </View>
        {auth.currentUser && isClient && (
          <Animated.View
            style={[
              {
                position: "absolute",
                bottom: 24,
                right: 20,
                height: 56,
                backgroundColor: COLORS.primary,
                borderRadius: 28,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              },
              fabAnimatedStyle,
            ]}
          >
            <Pressable
              onPress={() => navigation.navigate("AddProject")}
              className="flex-row items-center justify-center"
              style={({ pressed }) => ({
                opacity: pressed ? 0.9 : 1,
                height: "100%",
                width: "100%",
                paddingHorizontal: 16,
              })}
            >
              <Animated.Text
                style={[
                  {
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "OpenSans_700Bold",
                  },
                  textAnimatedStyle,
                ]}
              >
                {t("newProject")}
              </Animated.Text>
              <Animated.View style={iconAnimatedStyle}>
                <MaterialIcons name="add" size={24} color="#fff" />
              </Animated.View>
            </Pressable>
          </Animated.View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        <View className="px-5 py-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
            contentContainerStyle={{ alignItems: "center" }}
          >
            <Pressable
              onPress={() => setPostalModalVisible(true)}
              className="px-4 py-1 flex-row items-center border rounded-full"
              style={{
                backgroundColor: filterPostal
                  ? COLORS.secondary + "15"
                  : "#fff",
                borderColor: filterPostal ? COLORS.secondary : "#D1D5DB",
              }}
            >
              <MaterialIcons
                name="filter-list"
                size={18}
                color={filterPostal ? COLORS.secondary : "#6B7280"}
              />
              <Text
                className="text-sm ml-2"
                style={{
                  fontFamily: "OpenSans_600SemiBold",
                  color: filterPostal ? COLORS.secondary : "#6B7280",
                }}
              >
                {filterPostal || t("filter")}
              </Text>
              {filterPostal && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setFilterPostal(null);
                  }}
                  className="ml-2"
                >
                  <MaterialIcons
                    name="close"
                    size={16}
                    color={COLORS.secondary}
                  />
                </TouchableOpacity>
              )}
            </Pressable>
          </ScrollView>
        </View>

        <FlatList
          data={dataToDisplay}
          keyExtractor={(item) => item.id}
          renderItem={renderProjectItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListFooterComponent={!filterPostal ? renderFooter : null}
        />

        {auth.currentUser && isClient && (
          <Animated.View
            style={[
              {
                position: "absolute",
                bottom: 24,
                right: 20,
                height: 56,
                backgroundColor: COLORS.primary,
                borderRadius: 28,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              },
              fabAnimatedStyle,
            ]}
          >
            <Pressable
              onPress={() => navigation.navigate("AddProject")}
              className="flex-row items-center justify-center"
              style={({ pressed }) => ({
                opacity: pressed ? 0.9 : 1,
                height: "100%",
                width: "100%",
                paddingHorizontal: 16,
              })}
            >
              <Animated.Text
                style={[
                  {
                    color: "#fff",
                    fontSize: 15,
                    fontFamily: "OpenSans_700Bold",
                  },
                  textAnimatedStyle,
                ]}
              >
                {t("newProject")}
              </Animated.Text>
              <Animated.View style={iconAnimatedStyle}>
                <MaterialIcons name="add" size={24} color="#fff" />
              </Animated.View>
            </Pressable>
          </Animated.View>
        )}

        <Modal
          visible={notificationModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleSkipNotifications}
        >
          <View
            className="flex-1 justify-center items-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <Animated.View
              entering={FadeInDown.duration(400)}
              className="bg-white rounded-2xl overflow-hidden w-full max-w-sm"
            >
              <View className="items-center pt-8 pb-4">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{ backgroundColor: COLORS.primary + "15" }}
                >
                  <MaterialIcons
                    name="notifications-active"
                    size={40}
                    color={COLORS.primary}
                  />
                </View>
              </View>

              <View className="px-6 pb-6">
                <Text
                  className="text-xl text-gray-900 text-center mb-3"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  {t("activateNotifications")}
                </Text>
                <Text
                  className="text-sm text-gray-600 text-center mb-6 leading-5"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  {t("notificationsDesc")}
                </Text>

                <Pressable
                  onPress={handleActivateNotifications}
                  className="w-full py-4 items-center justify-center mb-3"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {t("activate")}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSkipNotifications}
                  className="w-full py-4 items-center justify-center"
                >
                  <Text
                    className="text-gray-500 text-sm"
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                  >
                    {t("later")}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        <Modal
          visible={postalModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPostalModalVisible(false)}
        >
          <TouchableOpacity
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            className="flex-1 justify-center px-5"
            activeOpacity={1}
            onPressOut={() => setPostalModalVisible(false)}
          >
            <View className="bg-white rounded overflow-hidden max-h-[70%]">
              <View
                className="px-5 py-4 border-b border-gray-200"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Text
                  className="text-white text-lg"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  {t("filterByPostalCode")}
                </Text>
              </View>

              <View className="px-5 py-3 border-b border-gray-200">
                <View className="bg-gray-100 flex-row items-center px-4 py-3">
                  <MaterialIcons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-sm text-gray-900"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                    placeholder={t("searchPlaceholder")}
                    value={search}
                    onChangeText={setSearch}
                    autoFocus
                    placeholderTextColor="#9CA3AF"
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")}>
                      <MaterialIcons name="close" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <FlatList
                data={filteredPostalCodes}
                keyExtractor={(item, idx) => `${item.codePostal}_${idx}`}
                keyboardShouldPersistTaps="always"
                renderItem={({ item }) => (
                  <Pressable
                    className="px-5 py-4 border-b border-gray-100"
                    onPress={() => {
                      setFilterPostal(item.codePostal);
                      setPostalModalVisible(false);
                      setSearch("");
                    }}
                  >
                    <Text
                      className="text-base text-gray-900"
                      style={{ fontFamily: "OpenSans_600SemiBold" }}
                    >
                      {item.codePostal}
                    </Text>
                    <Text
                      className="text-sm text-gray-500 mt-0.5"
                      style={{ fontFamily: "OpenSans_400Regular" }}
                    >
                      {item.nomCommune}
                    </Text>
                  </Pressable>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
