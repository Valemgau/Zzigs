import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
  SafeAreaView,
} from "react-native";
import {
  useRoute,
  useNavigation,
  CommonActions,
  useFocusEffect,
} from "@react-navigation/native";
import { auth, db } from "../../config/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import MapView, { Marker } from "react-native-maps";
import { COLORS } from "../styles/colors";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Loader from "../components/Loader";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

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

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const estimateTravelTime = (distanceKm) => {
  const avgSpeed = distanceKm < 50 ? 50 : 80;
  const hours = distanceKm / avgSpeed;
  const minutes = Math.round(hours * 60);

  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}min` : `${h}h`;
  }
};

const ImageViewerComponent = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  return (
    <Modal
      visible={true}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black">
        <View className="absolute top-12 left-0 right-0 z-10 flex-row justify-between items-center px-5">
          <View
            className="bg-white/20 px-3 py-1.5 rounded-full"
            style={{ backdropFilter: "blur(10px)" }}
          >
            <Text
              className="text-white text-sm"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <MaterialIcons name="close" size={24} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(newIndex);
          }}
          contentOffset={{ x: width * initialIndex, y: 0 }}
        >
          {images.map((img, index) => (
            <View key={index} style={{ width, height }}>
              <ScrollView
                maximumZoomScale={3}
                minimumZoomScale={1}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={{ uri: img }}
                  style={{ width: width, height: height * 0.8 }}
                  contentFit="contain"
                  priority="high"
                />
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function ProjectDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { projectId } = route.params;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [coords, setCoords] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [hasOffer, setHasOffer] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() =>
            navigation.navigate("ReportProjectScreen", { projectId })
          }
          className="px-2 py-1 mx-4 flex-row items-center justify-center"
          style={{ backgroundColor: COLORS.primary }}
        >
          <MaterialIcons name="flag" size={20} color="#fff" />
          <Text
            className="text-white text-sm ml-2"
            style={{ fontFamily: "OpenSans_600SemiBold" }}
          >
            {t("report")}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, projectId, t]);

  useFocusEffect(
    useCallback(() => {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const projDoc = await getDoc(doc(db, "projects", projectId));
          if (!projDoc.exists()) {
            throw new Error(t("projectNotFound"));
          }

          const projData = projDoc.data();
          let userInfos = {};

          if (projData.userId) {
            const userDoc = await getDoc(doc(db, "users", projData.userId));
            if (userDoc.exists()) {
              userInfos = userDoc.data();
            }
          }

          setProject({ ...projData, ...userInfos });

          if (userInfos.postalCode) {
            const projectCoords = await getCoordsFromPostal(
              userInfos.postalCode,
              userInfos.city || ""
            );
            setCoords(projectCoords);

            if (currentUserId) {
              const currentUserDoc = await getDoc(
                doc(db, "users", currentUserId)
              );

              if (currentUserDoc.exists()) {
                const currentUserData = currentUserDoc.data();
                setIsClient(currentUserData.isClient || false);

                if (currentUserData.postalCode && currentUserData.city) {
                  const userPosition = await getCoordsFromPostal(
                    currentUserData.postalCode,
                    currentUserData.city
                  );

                  if (userPosition && projectCoords) {
                    setUserCoords(userPosition);
                    const dist = calculateDistance(
                      userPosition.latitude,
                      userPosition.longitude,
                      projectCoords.latitude,
                      projectCoords.longitude
                    );
                    setDistance(dist);
                    setTravelTime(estimateTravelTime(dist));
                  }
                }
              }

              const offersRef = collection(db, "offers");
              const q = query(
                offersRef,
                where("projectId", "==", projectId),
                where("userId", "==", currentUserId)
              );
              const querySnapshot = await getDocs(q);
              setHasOffer(!querySnapshot.empty);
            }
          }
        } catch (error) {
          console.error("Erreur chargement projet:", error);
          setProject(null);
        } finally {
          setLoading(false);
        }
      };

      fetchDetails();
    }, [projectId, currentUserId, t])
  );

  if (loading) {
    return <Loader />;
  }

  if (!project) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <MaterialIcons name="search-off" size={64} color="#D1D5DB" />
          <Text
            className="text-gray-500 text-lg text-center mt-4"
            style={{ fontFamily: "OpenSans_600SemiBold" }}
          >
            {t("projectNotFound")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const images =
    Array.isArray(project?.photos) && project.photos.length > 0
      ? project.photos
      : [];
  const defaultImage = require("../../assets/img/default.png");

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Pressable
          onPress={() => {
            if (images.length) {
              setViewerIndex(0);
              setViewerVisible(true);
            } else {
              return;
            }
          }}
          activeOpacity={0.95}
        >
          <Animated.View entering={FadeIn.duration(300)} className="relative">
            <Image
              source={images[0] ? { uri: images[0] } : defaultImage}
              style={{ width: "100%", height: 300 }}
              contentFit="cover"
              priority="high"
              onError={(e) => {
                e.source = defaultImage;
              }}
            />
            <View
              className="absolute bottom-4 right-4 px-3 py-2 rounded-full flex-row items-center"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            >
              <MaterialIcons name="fullscreen" size={18} color="#fff" />
              {images.length && (
                <Text
                  className="text-white text-xs ml-1.5"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {t("view")} {images.length || 1} {t("photo")}
                  {(images.length || 1) > 1 ? "s" : ""}
                </Text>
              )}
            </View>
          </Animated.View>
        </Pressable>

        <View className="px-5 pt-5">
          <Animated.View
            entering={FadeInDown.duration(300).delay(50)}
            className="mb-5"
          >
            <View className="flex-row justify-between items-start mb-3">
              <Text
                className="text-2xl flex-1 mr-3"
                style={{
                  color: COLORS.primary,
                  fontFamily: "OpenSans_700Bold",
                }}
              >
                {project.type || t("project")}
              </Text>
              {project.budget && (
                <View
                  className="px-4 py-2 flex-row items-center"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <MaterialIcons name="attach-money" size={18} color="#fff" />
                  <Text
                    className="text-white text-base ml-1"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {project.budget}
                  </Text>
                </View>
              )}
            </View>

            <View className="bg-white border border-gray-200 p-4">
              <Text
                className="text-sm text-gray-700 leading-6"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                {project.project}
              </Text>
            </View>
          </Animated.View>

          {images.length > 1 && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(100)}
              className="mb-5"
            >
              <Text
                className="text-xs text-gray-500 mb-3 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                {t("gallery")} ({images.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {images.map((img, i) => (
                  <Pressable
                    key={i}
                    onPress={() => {
                      setViewerIndex(i);
                      setViewerVisible(true);
                    }}
                    activeOpacity={0.8}
                    className="relative overflow-hidden"
                  >
                    <Image
                      source={{ uri: img }}
                      style={{ width: 100, height: 100 }}
                      contentFit="cover"
                      priority="high"
                    />
                    <View className="absolute inset-0 bg-black/20 items-center justify-center">
                      <View className="bg-white/90 rounded-full p-1.5">
                        <MaterialIcons name="zoom-in" size={18} color="#333" />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInDown.duration(300).delay(150)}
            className="bg-white border border-gray-200 p-4 mb-5"
          >
            <Text
              className="text-xs text-gray-500 mb-3 uppercase tracking-wider"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("publishedBy")}
            </Text>
            <View className="flex-row items-center">
              {project.photo ? (
                <Image
                  source={{ uri: project.photo }}
                  className="w-12 h-12 rounded-full bg-gray-200"
                />
              ) : (
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Text
                    className="text-white text-lg"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {project.username?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              <View className="ml-3 flex-1">
                <Text
                  className="text-base text-gray-900 mb-1"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {project.username || t("user")}
                </Text>
                <View className="flex-row items-center">
                  <MaterialIcons name="location-on" size={14} color="#9CA3AF" />
                  <Text
                    className="text-sm text-gray-600 ml-1"
                    style={{ fontFamily: "OpenSans_400Regular" }}
                  >
                    {project.city || t("city")}
                    {project.postalCode ? ` (${project.postalCode})` : ""}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {distance !== null && travelTime && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(200)}
              className="border-l-4 px-4 py-3 mb-5"
              style={{
                backgroundColor: COLORS.secondary + "10",
                borderLeftColor: COLORS.secondary,
              }}
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name="directions-car"
                  size={20}
                  color={COLORS.secondary}
                />
                <Text
                  className="text-sm text-gray-900 ml-3"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {distance.toFixed(1)} km • {travelTime}
                </Text>
              </View>
            </Animated.View>
          )}

          {coords && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(250)}
              className="mb-5"
            >
              <Text
                className="text-xs text-gray-500 mb-3 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                {t("location")}
              </Text>
              <View
                className="overflow-hidden border border-gray-200"
                style={{ height: 220 }}
              >
                <MapView
                  style={{ width: "100%", height: "100%" }}
                  initialRegion={{
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker coordinate={coords} title={project.city || ""}>
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      <MaterialIcons name="place" size={24} color="#fff" />
                    </View>
                  </Marker>

                  {userCoords && (
                    <Marker coordinate={userCoords} title={t("yourPosition")}>
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: COLORS.secondary }}
                      >
                        <MaterialIcons
                          name="person-pin"
                          size={24}
                          color="#fff"
                        />
                      </View>
                    </Marker>
                  )}
                </MapView>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 px-5 py-4 bg-white border-t border-gray-200"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        {!auth.currentUser ? (
          <Pressable
            onPress={() => navigation.navigate("PasswordPage")}
            className="py-4 items-center"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Text
              className="text-white text-base"
              style={{ fontFamily: "OpenSans_700Bold" }}
            >
              {t("loginToMakeOffer")}
            </Text>
          </Pressable>
        ) : isClient ? (
          <View className="py-4 items-center bg-gray-100">
            <Text
              className="text-gray-600 text-base"
              style={{ fontFamily: "OpenSans_600SemiBold" }}
            >
              {t("reservedForTailors")}
            </Text>
          </View>
        ) : hasOffer ? (
          <Pressable
            onPress={() => navigation.navigate("OffersListScreen")}
            className="py-4 items-center"
            style={{ backgroundColor: COLORS.secondary }}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="check-circle" size={20} color="#fff" />
              <Text
                className="text-white text-base ml-2"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                {t("offerAlreadySent")}
              </Text>
            </View>
          </Pressable>
        ) : (
          <Pressable
            onPress={() =>
              navigation.navigate("FaireOffreScreen", {
                projectId: projectId,
                authorId: project.userId,
              })
            }
            className="py-4 items-center"
            style={{ backgroundColor: COLORS.primary }}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="send" size={20} color="#fff" />
              <Text
                className="text-white text-base ml-2"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                {t("makeOffer")}
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      {viewerVisible && (
        <ImageViewerComponent
          images={images}
          initialIndex={viewerIndex}
          onClose={() => setViewerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}
