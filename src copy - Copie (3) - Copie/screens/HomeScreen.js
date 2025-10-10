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
import * as TrackingTransparency from "expo-tracking-transparency";
import { Image } from "expo-image";
import Loader from "../components/Loader";
import { showMessage } from "react-native-flash-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(undefined);
  const [projects, setProjects] = useState([]);
  const [filterPostal, setFilterPostal] = useState(null);
  const [postalModalVisible, setPostalModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [postalSortedProjects, setPostalSortedProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const scrollY = useSharedValue(0);
  const lastScrollY = useRef(0);

  // === VÉRIFICATION ET AFFICHAGE MODAL NOTIFICATIONS ===
  const checkNotificationPrompt = useCallback(async () => {
    try {
      const hasSeenPrompt = await AsyncStorage.getItem("hasSeenNotificationPrompt");
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

  // === PERMISSIONS ET NOTIFICATIONS ===
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

      if (TrackingTransparency?.requestPermissionsAsync) {
        try {
          const trackingPermission =
            await TrackingTransparency.requestPermissionsAsync();
          console.log("Tracking permission:", trackingPermission.status);
        } catch (trackingError) {
          console.log("Tracking transparency non disponible:", trackingError);
        }
      }

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
        message: "Notifications activées",
        description: "Vous recevrez désormais les notifications importantes.",
        type: "success",
      });
    } else {
      showMessage({
        message: "Permission refusée",
        description: "Vous pouvez activer les notifications dans les paramètres.",
        type: "warning",
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

  // === HEADER ===
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <Header isClient={isClient} />,
    });
  }, [navigation, isClient]);

  // === RÉCUPÉRATION RÔLE ET COMPTEUR OFFRES ===
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

  // === VÉRIFICATIONS UTILISATEUR ===
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
                message: "Complétez votre profil",
                description:
                  "Veuillez renseigner vos informations personnelles.",
                type: "info",
              });
              return;
            }
            if (!data.address) {
              navigation.navigate("EditProfile", { from: "checkUser" });
              showMessage({
                message: "Adresse manquante",
                description: "Merci d'ajouter votre adresse postale.",
                type: "info",
              });
              return;
            }
            if (!data.postalCode) {
              navigation.navigate("EditLocation", { from: "checkUser" });
              showMessage({
                message: "Code postal manquant",
                description: "Merci de renseigner votre code postal.",
                type: "info",
              });
              return;
            }
            if (!data.phoneNumber) {
              navigation.navigate("EditPhoneNumber", { from: "checkUser" });
              showMessage({
                message: "Numéro de téléphone manquant",
                description: "Merci d'ajouter votre numéro de téléphone.",
                type: "info",
              });
              return;
            }
            if (!data.iban || !data.bankName || !data.bankAccountNumber) {
              navigation.navigate("EditBankInfo", { from: "checkUser" });
              showMessage({
                message: "Informations bancaires incomplètes",
                description: "Merci de renseigner vos coordonnées bancaires.",
                type: "info",
              });
              return;
            }
          } else {
            if (!data.firstname || !data.lastname) {
              navigation.navigate("EditProfile", { from: "checkUser" });
              showMessage({
                message: "Complétez votre profil",
                description: "Veuillez renseigner votre nom et prénom.",
                type: "info",
              });
              return;
            }
            if (!data.address) {
              navigation.navigate("EditLocation", { from: "checkUser" });
              showMessage({
                message: "Adresse manquante",
                description: "Merci d'ajouter votre adresse postale.",
                type: "info",
              });
              return;
            }
          }
        } catch (error) {
          console.error("Erreur vérification utilisateur :", error);
          Alert.alert("Erreur", "Impossible de vérifier votre compte.");
        }
      };

      checkUserStatus();
    }, [navigation])
  );

  // === ENRICHISSEMENT PROJETS AVEC DONNÉES UTILISATEUR ===
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

  // === CHARGEMENT PROJETS TEMPS RÉEL ===
  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));

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

          setTimeout(() => setLoading(false), 300);
        } catch (error) {
          console.error("Erreur traitement projets:", error);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Erreur snapshot projets:", error);
        Alert.alert("Erreur", "Impossible de charger les projets.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [enrichProjectsWithUser]);

  // === FILTRAGE PAR CODE POSTAL ===
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
        Alert.alert("Erreur", "Impossible de charger les projets filtrés.");
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProjects();
  }, [filterPostal, enrichProjectsWithUser]);

  // === FILTRAGE CODES POSTAUX ===
  const filteredPostalCodes = useMemo(() => {
    if (!search.trim()) return postalCodes;

    const searchTerm = search.trim().toLowerCase();
    return postalCodes.filter(
      (item) =>
        item.codePostal.toLowerCase().includes(searchTerm) ||
        item.nomCommune?.toLowerCase().includes(searchTerm)
    );
  }, [search]);

  // === GESTION SCROLL POUR ANIMATION BOUTON ===
  const handleScroll = useCallback((event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    scrollY.value = withTiming(currentScrollY > 100 ? 1 : 0, {
      duration: 300,
    });
    lastScrollY.current = currentScrollY;
  }, []);

  // === ANIMATION BOUTON FLOTTANT ===
  const fabAnimatedStyle = useAnimatedStyle(() => {
    const width = interpolate(scrollY.value, [0, 1], [180, 56]);

    return {
      width,
    };
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

  // === COMPOSANT CAROUSEL IMAGES ===
  const ImageCarousel = useCallback(
    ({ photos, projectId }) => {
      const [currentIndex, setCurrentIndex] = useState(0);
      const flatListRef = useRef(null);

      const images = photos?.length > 0
        ? photos
        : [require("../../assets/img/default.png")];

      const onViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
          setCurrentIndex(viewableItems[0].index || 0);
        }
      }).current;

      const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
      }).current;

      return (
        <View style={{ height: 200 }}>
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
              <View style={{ width: SCREEN_WIDTH - 40, height: 200 }}>
                <Image
                  source={typeof item === "string" ? { uri: item } : item}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="contain"
                />
              </View>
            )}
            scrollEnabled={images.length > 1}
          />

          {images.length > 1 && (
            <View
              className="absolute bottom-3 right-3 px-2.5 py-1.5 flex-row items-center"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12 }}
            >
              <MaterialIcons name="photo-library" size={14} color="#fff" />
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
              className="absolute bottom-3 left-0 right-0 flex-row justify-center items-center"
              style={{ gap: 6 }}
            >
              {images.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: currentIndex === index ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor:
                      currentIndex === index
                        ? COLORS.primary
                        : "rgba(255,255,255,0.5)",
                  }}
                />
              ))}
            </View>
          )}
        </View>
      );
    },
    []
  );

  // === RENDER PROJET ===
  const renderProjectItem = useCallback(
    ({ item }) => (
      <Pressable
        className="bg-white border border-gray-200 mb-4 overflow-hidden"
        onPress={() =>
          navigation.navigate("ProjectDetailsScreen", { projectId: item.id })
        }
      >
        <Animated.View entering={FadeIn.duration(100)}>
          <ImageCarousel photos={item.photos} projectId={item.id} />
          
          {item.budget && (
            <View
              className="absolute top-3 right-3 px-3 py-1.5 flex-row items-center"
              style={{ backgroundColor: COLORS.primary, borderRadius: 6 }}
            >
              <MaterialIcons name="attach-money" size={16} color="#fff" />
              <Text
                className="text-white text-sm ml-1"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                {item.budget} €
              </Text>
            </View>
          )}
        </Animated.View>

        <View className="p-4">
          <Text
            className="text-lg text-gray-900 mb-2 capitalize"
            style={{ fontFamily: "OpenSans_700Bold" }}
            numberOfLines={1}
          >
            {item.type || "Projet"}
          </Text>

          <Text
            numberOfLines={2}
            className="text-sm text-gray-600 mb-4"
            style={{ fontFamily: "OpenSans_400Regular" }}
          >
            {item.project}
          </Text>

          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
            <View className="flex-row items-center flex-1">
              {item.userPhoto ? (
                <Animated.View
                  entering={FadeIn.duration(700)}
                  className="w-10 h-10 rounded-full mr-3 bg-gray-200"
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
                  className="w-10 h-10 rounded-full mr-3 items-center justify-center"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {item.username?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </Animated.View>
              )}
              <View className="flex-1">
                <Text
                  className="text-sm text-gray-900 mb-0.5"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                  numberOfLines={1}
                >
                  {item.username || "Utilisateur"}
                </Text>
                <View className="flex-row items-center">
                  <MaterialIcons name="location-on" size={14} color="#9CA3AF" />
                  <Text
                    className="text-xs text-gray-500 ml-1"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                    numberOfLines={1}
                  >
                    {item.userCity && item.userPostalCode
                      ? `${item.userCity} (${item.userPostalCode})`
                      : "Non renseigné"}
                  </Text>
                </View>
              </View>
            </View>

            <View
              className="w-8 h-8 rounded-full items-center justify-center ml-2"
              style={{ backgroundColor: COLORS.primary + "15" }}
            >
              <MaterialIcons
                name="arrow-forward"
                size={16}
                color={COLORS.primary}
              />
            </View>
          </View>
        </View>
      </Pressable>
    ),
    [navigation, ImageCarousel]
  );

  // === RENDER ÉTATS ===
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
              ? "Aucun projet trouvé pour ce code postal"
              : "Aucun projet disponible"}
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
                Retirer le filtre
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // === RENDER PRINCIPAL ===
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Barre de filtres */}
        <View className="px-5 py-4 bg-white border-b border-gray-200">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
            contentContainerStyle={{ alignItems: "center" }}
          >
            {auth.currentUser && (
              <Pressable
                onPress={() => {
                  navigation.navigate(
                    isClient ? "ReceivedOffersScreen" : "OffersListScreen"
                  );
                }}
                className="mr-3 px-4 py-2 flex-row items-center border border-gray-300"
                style={{
                  backgroundColor:
                    pendingCount > 0 ? COLORS.primary + "15" : "#fff",
                }}
              >
                <MaterialIcons
                  name="mail-outline"
                  size={18}
                  color={pendingCount > 0 ? COLORS.primary : "#6B7280"}
                />
                <Text
                  className="text-sm ml-2"
                  style={{
                    fontFamily: "OpenSans_600SemiBold",
                    color: pendingCount > 0 ? COLORS.primary : "#6B7280",
                  }}
                >
                  {isClient ? "Offres reçues" : "Mes offres"}
                </Text>
                {pendingCount > 0 && (
                  <View
                    className="ml-2 rounded-full px-2 py-0.5 min-w-[20px] items-center"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <Text
                      className="text-white text-xs"
                      style={{ fontFamily: "OpenSans_700Bold" }}
                    >
                      {pendingCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            )}

            <Pressable
              onPress={() => setPostalModalVisible(true)}
              className="px-4 py-2 flex-row items-center border"
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
                {filterPostal || "Filtrer"}
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

        {/* Liste projets */}
        <FlatList
          data={dataToDisplay}
          keyExtractor={(item) => item.id}
          renderItem={renderProjectItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />

        {/* Bouton flottant - Uniquement pour les clients */}
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
                Nouveau projet
              </Animated.Text>
              <Animated.View style={iconAnimatedStyle}>
                <MaterialIcons name="add" size={24} color="#fff" />
              </Animated.View>
            </Pressable>
          </Animated.View>
        )}

        {/* Modal Notifications */}
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
                  Activer les notifications
                </Text>
                <Text
                  className="text-sm text-gray-600 text-center mb-6 leading-5"
                  style={{ fontFamily: "OpenSans_400Regular" }}
                >
                  Recevez des alertes en temps réel pour vos projets, offres et
                  messages importants.
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
                    Activer
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
                    Plus tard
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* Modal code postal */}
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
                  Filtrer par code postal
                </Text>
              </View>

              <View className="px-5 py-3 border-b border-gray-200">
                <View className="bg-gray-100 flex-row items-center px-4 py-3">
                  <MaterialIcons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-sm text-gray-900"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                    placeholder="Rechercher..."
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
