import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  FlatList,
  RefreshControl,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native";

import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import Header from "../components/Header";
import moment from "moment";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SharedTransition,
  SlideInUp,
} from "react-native-reanimated";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { COLORS } from "../styles/colors";
import { FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as Constants from "expo-constants";
import * as Device from "expo-device";
import { openSettings } from "../utils/allFunctions";
import sendNotifs from "../utils/sendNotifs";
import FlashMessage, { showMessage } from "react-native-flash-message";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import Purchases from "react-native-purchases";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FastImage from "react-native-fast-image";
import InfoCard from "../components/InfoCard";
import PageLoader from "../components/Loaders/PageLoader";
import { getDistance } from "geolib";
import Loader from "../components/Loader";

import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import i18n from "../../i18n";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// --- Constantes ---
const ENTITLEMENT_LEVELS = {
  GRATUIT: "gratuit",
  PRO: "pro",
  PREMIUM: "premium",
};
const AVERAGE_SPEED_KMH = 60; // Vitesse moyenne pour l'estimation du temps de trajet
const EARTH_RADIUS_KM = 6371; // Rayon de la Terre en km

const Home = ({ route }) => {
  // --- Hooks et Thème ---
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const navigation = useNavigation();
  const currentUser = auth().currentUser; // Obtenir une seule fois
  const selectedCategory = route?.params?.selectedCategory || null;
  const user = auth().currentUser;

  // --- États ---
  const [notif, setNotif] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [parrain, setParrain] = useState(true);
  const [entitlement, setEntitlement] = useState(ENTITLEMENT_LEVELS.GRATUIT);
  const [userLocation, setUserLocation] = useState(null);
  const [userPostalCode, setUserPostalCode] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLocationWarning, setShowLocationWarning] = useState(false); // Pour gérer l'affichage du message d'avertissement
  const [
    showNotificationPermissionWarning,
    setShowNotificationPermissionWarning,
  ] = useState(false); // Pour gérer l'avertissement des notifs

  // --- Références pour les listeners de notification ---
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  // Récupère la localisation et le code postal
  const getUserLocationAndPostalCode = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setShowLocationWarning(true); // Active l'affichage du message
        return;
      }
      setShowLocationWarning(false); // Désactive si la permission est accordée

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);

      // Géocodage inverse pour obtenir l'adresse (incluant le code postal)
      let address = await Location.reverseGeocodeAsync(location.coords);
      // Vérification plus robuste de l'existence de l'adresse et du code postal
      if (address && address.length > 0 && address[0]?.postalCode) {
        setUserPostalCode(address[0].postalCode);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la localisation :",
        error
      );
      setShowLocationWarning(true); // Affiche aussi le message en cas d'erreur
    }
  }, []); // useCallback pour la stabilité de la référence

  // Récupère les informations utilisateur et l'abonnement
  const fetchInitialUserData = useCallback(async () => {
    if (!currentUser) {
      setEntitlement(""); // ou une valeur par défaut appropriée
      setLoading(false);
      return;
    }

    try {
      // Récupérer l'info utilisateur
      const userDoc = await firestore()
        .collection("users")
        .doc(currentUser.uid)
        .get();
      if (userDoc.exists) {
        setUserInfo(userDoc.data());
      }

      // Récupérer l'abonnement (Entitlement)
      const purchaserInfo = await Purchases.getCustomerInfo();
      const entitlements = purchaserInfo.entitlements.active;

      let currentEntitlement = ENTITLEMENT_LEVELS.GRATUIT;
      if (entitlements.premium) {
        // Vérifier premium en premier s'il est supérieur
        currentEntitlement = ENTITLEMENT_LEVELS.PREMIUM;
      } else if (entitlements.pro) {
        currentEntitlement = ENTITLEMENT_LEVELS.PRO;
      }

      setEntitlement(currentEntitlement);
      await AsyncStorage.setItem("sub", currentEntitlement);

      // Mise à jour Firestore (optionnel, dépend si 'sub' doit être synchro)
      await firestore()
        .collection("users")
        .doc(currentUser.uid)
        .set({ sub: currentEntitlement }, { merge: true }); // Utiliser set avec merge:true est plus sûr qu'update
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données initiales utilisateur :",
        error
      );
      setEntitlement("Erreur"); // Indique un problème
    } finally {
      // setLoading(false) est géré par fetchActivities car c'est souvent le plus long
    }
  }, [currentUser]); // Dépend de currentUser

  // Fonction pour enregistrer le token push
  const registerForPushNotificationsAsync = useCallback(async () => {
    if (!Device.isDevice) return null; // Pas de token sur simulateur

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        setShowNotificationPermissionWarning(true); // Avertir l'utilisateur
        return null;
      }
      setShowNotificationPermissionWarning(false);

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId, // Chemin plus sûr
      });
      return token.data;
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement pour les notifications push:",
        error
      );
      return null;
    }
  }, []);

  // Ajoute le token à l'utilisateur Firestore
  const addExpoPushTokenToUser = useCallback(
    async (token) => {
      if (!token || !currentUser) return; // Vérifier token et utilisateur

      try {
        await firestore()
          .collection("users")
          .doc(currentUser.uid)
          .set({ expoPushToken: token }, { merge: true }); // Utiliser set avec merge
      } catch (error) {
        console.error("Erreur lors de l'ajout du token Expo Push :", error);
      }
    },
    [currentUser]
  ); // Dépend de currentUser

  // Calcul du temps de trajet estimé (Haversine)
  const calculateTravelTime = useCallback((lat1, lon1, lat2, lon2) => {
    // Fonction interne pour convertir degrés en radians
    const toRad = (value) => (value * Math.PI) / 180;

    const R = EARTH_RADIUS_KM;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const radLat1 = toRad(lat1);
    const radLat2 = toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(radLat1) *
        Math.cos(radLat2) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; 
    const estimatedTimeHours = distance / AVERAGE_SPEED_KMH;


    const totalMinutes = Math.round(estimatedTimeHours * 60);

    if (totalMinutes < 60) {
      return `+${totalMinutes}min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `+${hours}h${minutes > 0 ? String(minutes).padStart(2, "0") : ""}`; // Formatage hh:mm
    }
  }, []); // Aucune dépendance externe directe

  // Récupère les activités
  const fetchActivities = useCallback(async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Début de la journée

    let query = firestore().collection("activities");

    // Filtre catégorie
    if (selectedCategory?.id && selectedCategory.id !== "all") {
      query = query.where("categoryId", "==", selectedCategory.id);
    }

    // Récupération
    const activitiesSnapshot = await query.orderBy("date", "desc").get();
    const activitiesDataPromises = activitiesSnapshot.docs.map(async (doc) => {
      const activityData = doc.data();
      const userId = activityData.creatorId;

      let creatorData = {
        username: "Inconnu",
        sub: ENTITLEMENT_LEVELS.GRATUIT,
        photoURL: null,
      };

      try {
        const userDoc = await firestore().collection("users").doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          creatorData = {
            username: userData.username || "Utilisateur",
            sub: userData.sub || ENTITLEMENT_LEVELS.GRATUIT,
            photoURL: userData.photoURL,
          };
        }
      } catch (userError) {
        console.warn(
          `Impossible de récupérer les infos pour l'utilisateur ${userId}:`,
          userError
        );
      }

      // 🔹 Parsing de la string "JJ/MM/YYYY"
      const dateString = activityData.date;
      const dateParts = dateString.split("/").map(Number);
      const activityDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);

      if (activityDate < today) {
        return null; // activité passée
      }

      return {
        id: doc.id,
        ...activityData,
        activityDate,
        creatorName: creatorData.username,
        creatorSub: creatorData.sub,
        creatorAvatar: creatorData.photoURL,
      };
    });

    const resolvedActivitiesData = await Promise.all(activitiesDataPromises);
    const validActivities = resolvedActivitiesData.filter((a) => a !== null);

    // Distance / tri
    const activitiesWithDistance = validActivities.map((activity) => {
      if (
        userLocation?.coords &&
        activity.coordinates?.latitude &&
        activity.coordinates?.longitude
      ) {
        const travelTime = calculateTravelTime(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          activity.coordinates.latitude,
          activity.coordinates.longitude
        );
        const distanceForSort = getDistance(
          { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude },
          { latitude: activity.coordinates.latitude, longitude: activity.coordinates.longitude }
        );
        return { ...activity, travelTime, distanceForSort };
      }
      return { ...activity, travelTime: null, distanceForSort: Infinity };
    });

    const sortedActivities = userLocation
      ? [...activitiesWithDistance].sort((a, b) => a.distanceForSort - b.distanceForSort)
      : activitiesWithDistance;

    setActivities(sortedActivities);
  } catch (error) {
    console.error("Erreur lors de la récupération des évènements :", error);
  } finally {
    setLoading(false);
  }
}, [selectedCategory, userLocation, calculateTravelTime]);
 // Dépendances

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Configuration de l'en-tête
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <Header />, // Assurez-vous que Header est correctement importé/défini
    });
  }, [navigation]); // Dépend de navigation

  // Style de la barre de statut en fonction du focus
  useFocusEffect(
    useCallback(() => {
      const isLight = colorScheme !== "dark"; // Ou basé sur isDarkMode
      StatusBar.setBarStyle(isLight ? "dark-content" : "light-content");
      // Pas besoin de cleanup qui inverse, useFocusEffect le gère
    }, [colorScheme])
  );

  // Récupération des données utilisateur et abonnement au focus
  useFocusEffect(
    useCallback(() => {
      fetchInitialUserData();
      return () => {
        // console.log("Screen lost focus");
      };
    }, [fetchInitialUserData]) 
  );

  // Récupération de la localisation (une seule fois au montage)
  useEffect(() => {
    getUserLocationAndPostalCode();
  }, [getUserLocationAndPostalCode]); // getUserLocationAndPostalCode est dans useCallback

  // Enregistrement pour les notifications push (une seule fois au montage)
  useEffect(() => {
    const managePushToken = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        addExpoPushTokenToUser(token);
      }
    };
    managePushToken();
  }, [registerForPushNotificationsAsync, addExpoPushTokenToUser]); 

  
  useEffect(() => {
   
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification reçue:", notification);
        // Potentiellement mettre à jour un badge, etc.
      });

    
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Réponse à la notification:", response);
        // Naviguer vers l'écran approprié basé sur la notification
        navigation.navigate("Notifications");
      });

    // Cleanup: supprimer les listeners au démontage
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]); // Dépend de navigation pour le listener de réponse

  // Fetch des activités quand la catégorie ou la localisation change (et au focus)

  useEffect(() => {
    fetchActivities();
    requestTrackingPermissionsAsync();
  }, [selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      const checkCluf = async () => {
        try {
          const accepted = await AsyncStorage.getItem("clufAccepted");
          if (accepted !== "true") {
            navigation.navigate("ClufPage");
          }
        } catch (e) {
          // Optionnel : gérer l'erreur
        }
      };
      setTimeout(() => {
        checkCluf();
      }, 500);
    }, [navigation])
  );

  // Affichage des messages d'avertissement (si nécessaire)
  useEffect(() => {
    if (showLocationWarning) {
      showMessage({
        message:
          "L'accès à la localisation est nécessaire pour trier les évènements par proximité.",
        type: "warning",
        duration: 5000, // Afficher pendant 5 secondes
      });
      // Optionnel: remettre à false après un délai si vous ne voulez pas le remontrer sans nouvelle tentative
      // const timer = setTimeout(() => setShowLocationWarning(false), 6000);
      // return () => clearTimeout(timer);
    }
  }, [showLocationWarning]);

  useEffect(() => {
    if (showNotificationPermissionWarning) {
      showMessage({
        message:
          "Les permissions de notification sont requises pour recevoir des alertes.",
        type: "warning",
        duration: 5000,
      });
    }
  }, [showNotificationPermissionWarning]);

  const formatDisplayDate = (dateString) => {
    // Implémentez votre logique de formatage de date ici
    // Exemple simple:
    try {
      const parts = dateString.split("/"); // Assume JJ/MM/AAAA
      const date = new Date(parts[2], parts[1] - 1, parts[0]);
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch (e) {
      return dateString; // Retourne la chaîne originale en cas d'erreur
    }
  };

  const formatLocationText = (locationString) => {
    // Implémentez votre logique de formatage de lieu ici
    return locationString || "Lieu non spécifié";
  };

  const formatDistance = (distanceInMeters) => {
    if (
      distanceInMeters === null ||
      distanceInMeters === undefined ||
      distanceInMeters === Infinity ||
      isNaN(distanceInMeters)
    ) {
      return null;
    }
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)} m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)} km`; // Une décimale pour les km
    }
  };
  // --- Fin Helpers ---

  const ActivityItem = React.memo(({ item, userInfo, userPostalCode }) => {
    const navigation = useNavigation();
    const { colorScheme } = useColorScheme(); // Pour obtenir le thème dark/light si besoin pour les icônes par ex.
    const isDarkMode = colorScheme === "dark";

    // --- Préparation des données ---
    const imageUrl = item.images?.[0];
    const displayDate = formatDisplayDate(item.date);
    const locationText = formatLocationText(item.location); // Formatage du lieu
    const travelTimeText = item.travelTime; // Directement la chaîne "+Xmin" ou "+XhY"
    const distanceText = formatDistance(item.distanceForSort); // Formatage "X m" ou "Y.Z km"

    const avatarFallback = require("../../assets/img/user.png"); // Assurez-vous que le chemin est correct

    const handlePress = () => {
      navigation.navigate("ActivityDetails", {
        userInfo,
        activityId: item.id,
        image: imageUrl,
        // Passez les données pertinentes à l'écran de détails
        travelTime: item.travelTime,
        distanceInMeters: item.distanceForSort, // Passez la valeur numérique si besoin pour d'autres calculs
        userPostalCode,
      });
    };

    return (
      <Animated.View
        entering={FadeIn.duration(100)}
        exiting={FadeOut.duration(150)}
        className="mb-6 mx-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-md dark:shadow-black/40 border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <Pressable onPress={handlePress} className="flex-col">
          {/* === Section Image === */}
          <FastImage
            source={
              imageUrl
                ? { uri: imageUrl, priority: FastImage.priority.normal }
                : avatarFallback // Utiliser une image fallback si pas d'URL
            }
            style={{ width: "100%", aspectRatio: 16 / 9 }}
            resizeMode={FastImage.resizeMode.cover}
          />

          {/* === Bloc d'informations Principal === */}
          <View className="p-4">
            {/* Titre */}
            <Text
              style={{ fontFamily: "Inter_600SemiBold" }}
              className="text-lg text-gray-900 dark:text-white mb-3"
              numberOfLines={2}
            >
              {item.title || "Événement"}
            </Text>

            {/* Ligne d'infos clés */}
            <View className="flex-row items-center flex-wrap mb-4">
              {/* Date */}
              <View className="flex-row items-center mr-4 mb-1">
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={isDarkMode ? "#9CA3AF" : "#6B7280"} // Gris adapté au thème
                  style={{ marginRight: 6 }} // Utiliser style pour le margin pour éviter conflit className
                />
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-xs text-gray-600 dark:text-gray-300"
                >
                  {displayDate}
                </Text>
              </View>

              {/* Lieu */}
              <View className="flex-row items-center mr-4 mb-1">
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-xs text-gray-600 dark:text-gray-300"
                >
                  {locationText}
                </Text>
              </View>

              {/* Temps de trajet estimé (si disponible) */}
              {travelTimeText && (
                <View className="flex-row items-center mr-4 mb-1">
                  <Ionicons
                    name="time-outline" // Ou "walk-outline", "car-outline" selon le contexte
                    size={16}
                    color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{ fontFamily: "Inter_400Regular" }}
                    className="text-xs text-gray-600 dark:text-gray-300"
                  >
                    Environ {travelTimeText} de route
                  </Text>
                </View>
              )}
            </View>

            {/* Séparateur */}
            <View className="border-t border-gray-100 dark:border-gray-700 my-2"></View>

            {/* === Section Créateur et Badge === */}
            <View className="flex-row items-center justify-between pt-2">
              {/* Avatar, Nom, Distance */}
              <View className="flex-row items-center flex-1 mr-3">
                <Image
                  source={
                    item.creatorAvatar
                      ? { uri: item.creatorAvatar }
                      : avatarFallback
                  }
                  className="w-8 h-8 rounded-full"
                />
                <View className="ml-2 flex-1">
                  {/* Nom Créateur */}
                  <Text
                    style={{ fontFamily: "Inter_500Medium" }}
                    className="text-sm text-gray-700 dark:text-gray-300"
                    numberOfLines={1}
                  >
                    Par {item.creatorName || "Organisateur"}
                  </Text>
                  {/* Distance formatée (si disponible) */}
                  {distanceText && (
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                      numberOfLines={1}
                    >
                      À {distanceText} {/* Affiche "X m" ou "Y.Z km" */}
                    </Text>
                  )}
                </View>
              </View>

              {/* Badge Pro/Perso */}
              <View
                className={`py-0.5 px-2 rounded ${
                  item.creatorSub === "pro" || item.creatorSub === "premium" // Considérer premium comme pro pour le badge? Adaptez si besoin.
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-blue-100 dark:bg-blue-900"
                }`}
              >
                <Text
                  style={{ fontFamily: "Inter_500Medium" }}
                  className={`text-xs font-medium ${
                    item.creatorSub === "pro" || item.creatorSub === "premium"
                      ? "text-green-700 dark:text-green-200"
                      : "text-blue-700 dark:text-blue-200"
                  }`}
                >
                  {item.creatorSub === "pro" || item.creatorSub === "premium"
                    ? "PRO"
                    : "PERSO"}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  });

  const renderActivity = useCallback(
    ({ item }) => <ActivityItem item={item} />,
    [navigation, userPostalCode]
  );

  if (loading) {
    return (
      <View className="flex-1">
        <Loader />
      </View>
    ); // Loader de page
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <FlatList
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          // Conteneur pour les cartes et l'en-tête "Les plus récents"
          // Ajout de padding horizontal ici pour aligner avec le contenu de la liste
          <View className="px-1 pt-7">
            {/* --- Cartes d'information --- */}
            <InfoCard
              isVisible={parrain && !!user} // Utiliser !!user pour forcer en booléen
              iconSource={require("../../assets/icons/gift.png")}
              iconBgClass="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-full mr-4"
              iconTintClass="tint-emerald-600 dark:tint-emerald-400"
              iconSizeClass="w-10 h-10" // Taille spécifique pour cette carte
              cardBgClass="bg-emerald-50 dark:bg-gray-800" // Légèrement différent du code original ? J'ai pris emerald-100
              borderClass="border border-gray-100 dark:border-gray-700"
              title="Invitez vos amis, gagnez ensemble !"
              titleClass="text-gray-900 dark:text-white text-lg" // Police Medium appliquée dans InfoCard
              description="Partagez votre code et profitez d'avantages exclusifs."
              descriptionClass="text-gray-600 dark:text-gray-300" // Police Regular appliquée dans InfoCard
              buttonText="Parrainer"
              buttonBgClass="bg-emerald-500 dark:bg-orange-600"
              onButtonPress={() =>
                navigation.navigate("Profil", { screen: "ReferralPage" })
              }
              onClosePress={() => setParrain(false)} // Passer la fonction pour fermer
            />
            <InfoCard
              isVisible={!userLocation}
              iconSource={require("../../assets/icons/location.png")}
              // Note: L'original avait un fond blanc/gris pour l'icône, différent des autres. Standardisé ici.
              iconBgClass="bg-yellow-100 dark:bg-yellow-800 p-3 rounded-full mr-4"
              iconSizeClass="w-12 h-12" // Taille standard
              cardBgClass="bg-yellow-50 dark:bg-yellow-900"
              borderClass="border border-yellow-300 dark:border-yellow-700" // Bordure ajoutée pour cohérence
              // Pas de titre explicite dans l'original
              description="Activez votre localisation pour voir les évènements les plus proches de chez vous."
              descriptionClass="text-yellow-700 dark:text-yellow-300 text-base" // Taille ajustée vs original (lg)
              buttonText="Activer la localisation"
              buttonBgClass="bg-yellow-500 dark:bg-yellow-600"
              onButtonPress={openSettings}
            />
            <InfoCard
              isVisible={notif}
              iconSource={require("../../assets/icons/notifications.png")}
              // Note: L'original avait un fond blanc/gris pour l'icône. Standardisé ici.
              iconBgClass="bg-orange-100 dark:bg-orange-800 p-3 rounded-full mr-4"
              iconSizeClass="w-12 h-12" // Taille standard
              cardBgClass="bg-orange-50 dark:bg-orange-900"
              borderClass="border border-orange-300 dark:border-orange-700" // Bordure ajoutée pour cohérence
              // Pas de titre explicite dans l'original
              description="Recevez des alertes pour les nouveautés et évènements près de chez vous."
              descriptionClass="text-orange-700 dark:text-orange-300 text-base" // Taille ajustée vs original (lg) & couleur dark corrigée
              buttonText="Activer les notifications"
              buttonBgClass="bg-orange-500 dark:bg-orange-600"
              onButtonPress={openSettings}
            />
            <InfoCard
              isVisible={!user}
              iconSource={require("../../assets/icons/salut.png")}
              // Note: L'original avait un fond blanc/gris pour l'icône. Standardisé ici.
              iconBgClass="bg-blue-100 dark:bg-blue-800 p-3 rounded-full mr-4"
              iconSizeClass="w-12 h-12" // Taille standard
              cardBgClass="bg-blue-50 dark:bg-blue-900"
              borderClass="border border-blue-300 dark:border-blue-700" // Bordure ajoutée pour cohérence
              // Pas de titre explicite dans l'original
              description="Interagissez avec des sportifs près de chez vous."
              descriptionClass="text-blue-600 dark:text-blue-300 text-base" // Taille ajustée vs original (lg) & couleur corrigée
              buttonText="Connexion"
              buttonBgClass="bg-blue-500 dark:bg-blue-600"
              onButtonPress={() => navigation.jumpTo("Compte")}
            />
            {/* --- Section "Les plus récents" & Filtres --- */}
            {/* Afficher cette section seulement si des activités existent ou un filtre est appliqué ? */}
            {(activities.length > 0 || selectedCategory) && (
              <View className="flex-row justify-between items-center mt-2 mb-4 w-full">
                {/* Titre "Les plus récents" (Conditionné par la présence d'activités) */}
                {activities.length > 0 && (
                  <Text
                    style={{ fontFamily: "Inter_500Medium" }}
                    className="text-xl dark:text-white"
                  >
                    {selectedCategory
                      ? selectedCategory.name
                      : i18n.t("les_plus_recents")}
                  </Text>
                )}
                {/* Espace flexible pour pousser les filtres à droite si le titre est caché */}
                {activities.length === 0 && <View className="flex-1" />}

                {/* Conteneur pour Code Postal et Bouton Filtrer */}
                <View className="flex-row items-center">
                  {/* Affichage Code Postal (Conditionné) */}
                  {userPostalCode && activities.length > 0 && (
                    <Pressable
                      // onPress={() => showMessage({ message: `Affichage pour ${userPostalCode}`, type: "info" })}
                      className="mr-2 py-1 px-3 bg-blue-100 dark:bg-gray-700 rounded-full" // Padding ajusté
                    >
                      <Text
                        style={{ fontFamily: "Inter_400Regular" }}
                        className="text-blue-600 dark:text-blue-300 text-sm" // Taille ajustée
                      >
                        {userPostalCode}
                      </Text>
                    </Pressable>
                  )}
                  {/* Bouton Filtrer */}
                  <Pressable
                    onPress={() => {
                      if (selectedCategory) {
                        navigation.setParams({ selectedCategory: null }); // Ou votre logique de reset
                      } else {
                        navigation.navigate("Categories");
                      }
                    }}
                    // Classes dynamiques pour le fond basé sur selectedCategory
                    className={`py-1 px-3 rounded-full ${
                      selectedCategory
                        ? "bg-red-200 dark:bg-red-700" // Style quand filtre actif
                        : "bg-blue-100 dark:bg-blue-700" // Style quand filtre inactif
                    }`}
                  >
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      // Classes dynamiques pour la couleur du texte
                      className={`text-sm ${
                        selectedCategory
                          ? "text-red-800 dark:text-red-100"
                          : "text-blue-600 dark:text-blue-100"
                      }`}
                    >
                      {selectedCategory ? "Effacer Filtre" : "Filtrer"}{" "}
                      {/* Texte dynamique */}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View> // Fin du conteneur px-4 pt-4
        )}
        data={activities}
        ListEmptyComponent={() => (
          // Style standardisé pour l'état vide
          <View className="flex-1 items-center justify-center px-1 py-16">
            {/* Conteneur centré */}
            <View className="items-center text-center">
              {/* Icône standardisée */}
              <View className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full items-center justify-center mb-4">
                <Ionicons
                  name="close-outline"
                  size={32}
                  className="text-gray-400 dark:text-gray-500"
                />
              </View>
              {/* Texte principal */}
              <Text
                style={{ fontFamily: "Inter_500Medium" }} // Utilisation de medium pour le titre
                className="text-lg text-gray-900 dark:text-white mb-1"
              >
                {selectedCategory
                  ? "Aucun évènement trouvé"
                  : "Rien à afficher pour le moment"}
              </Text>
              {/* Texte secondaire */}
              <Text
                style={{ fontFamily: "Inter_400Regular" }}
                className="text-gray-500 dark:text-gray-400 text-center"
              >
                {selectedCategory
                  ? "Essayez une autre catégorie ou retirez le filtre."
                  : "Revenez plus tard ou explorez d'autres sections."}
              </Text>
              {/* Optionnel: Bouton pour retirer le filtre si actif */}
              {selectedCategory && (
                <Pressable
                  onPress={() =>
                    navigation.setParams({ selectedCategory: null })
                  }
                  className="mt-4 py-2 px-4 rounded-full bg-blue-100 dark:bg-blue-700"
                >
                  <Text
                    style={{ fontFamily: "Inter_400Regular" }}
                    className="text-blue-800 dark:text-blue-100 text-sm"
                  >
                    {i18n.t("retirer_le_filtre")}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id.toString()} // Assurer que la clé est une string
        // Ajouter un padding global au contenu de la liste au lieu d'un paddingBottom seul
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }} // px-4 = 16
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]} // Android
            tintColor={COLORS.primary} // iOS
          />
        }
      />
    </View>
  );
};

export default Home;
