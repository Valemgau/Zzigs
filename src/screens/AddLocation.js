import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import * as Location from "expo-location";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { showMessage } from "react-native-flash-message";
import Animated, { FadeInDown } from "react-native-reanimated";
import i18n from "../../i18n";

const AddLocation = ({ route, navigation }) => {
  const newProfile = route?.params?.newProfile || false;
  const [loading, setLoading] = useState(true);
  const [locationDetails, setLocationDetails] = useState(null);
  const [existingLocation, setExistingLocation] = useState(null);

  useEffect(() => {
    if (newProfile) {
      handleGetLocation();
    }
    setLoading(false);
    const fetchUserLocation = async () => {
      try {
        setLoading(true);
        const currentUser = auth().currentUser;

        if (!currentUser) return;

        const userDoc = await firestore()
          .collection("users")
          .doc(currentUser.uid)
          .get();

        if (userDoc.exists && userDoc.data().location) {
          setExistingLocation(userDoc.data().location);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'emplacement :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserLocation();
  }, []);

  const handleGetLocation = async () => {
    try {
      setLoading(true);

      // Demander la permission pour accéder à l'emplacement
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showMessage({
          message:
            "Nous avons besoin de votre emplacement pour améliorer votre expérience.",
          type: "danger",
        });
        setLoading(false);
        return;
      }

      // Obtenir l'emplacement actuelle
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Obtenir les détails de l'adresse via un géocodage inversé
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const { city, country, region, street } = reverseGeocode[0];
        const address = `${street || "Adresse inconnue"}, ${
          city || "Ville inconnue"
        }, ${country || "Pays inconnu"}`;

        const locationData = {
          latitude,
          longitude,
          city,
          country,
          region,
          address,
        };

        setLocationDetails(locationData);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'emplacement :", error);
      showMessage({
        message: "Impossible de récupérer l'emplacement.",
        type: "danger",
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  const handleSaveLocation = async () => {
    try {
      setLoading(true);
      const currentUser = auth().currentUser;

      if (!currentUser) {
        Alert.alert("Erreur", "Utilisateur non connecté.");
        return;
      }

      if (!locationDetails) {
        Alert.alert("Erreur", "Aucun emplacement à enregistrer.");
        return;
      }

      const userRef = firestore().collection("users").doc(currentUser.uid);
      const batch = firestore().batch();

      // Mise à jour de la localisation
      batch.update(userRef, {
        location: {
          latitude: locationDetails.latitude,
          longitude: locationDetails.longitude,
          city: locationDetails.city,
          country: locationDetails.country,
          address: locationDetails.address,
        },
      });

      if (newProfile) {
        // Récupération des points de configuration
        const pointsDoc = await firestore()
          .collection("admin")
          .doc("defispoint")
          .get();

        const points = Number(pointsDoc.data()?.profil_completion_point) || 0;

        // Ajout du défi profil_completion
        const defisRef = firestore().collection("defis").doc();
        batch.set(defisRef, {
          userId: currentUser.uid,
          type: "profil_completion",
          createdAt: firestore.FieldValue.serverTimestamp(),
          points: points,
        });

        // Incrémentation des pièces
        batch.update(userRef, {
          pieces: firestore.FieldValue.increment(points),
        });

        Alert.alert(
          "Des pièces en plus",
          `Vous avez reçu ${points} pièces pour avoir complèté votre profil.`
        );
      }

      await batch.commit();

      if (newProfile) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Profile" }],
        });
        navigation.navigate("Activités", {
          screen: "Home",
          params: { newProfile: true },
        });
        return;
      }

      showMessage({
        message: "Emplacement mis à jour avec succès.",
        type: "success",
      });
      navigation.goBack();
      setExistingLocation(locationDetails);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      showMessage({
        message: "Échec de l'enregistrement",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-6">
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} className="mb-8">
            <Text
              style={{ fontFamily: "Inter_700Bold" }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >{i18n.t("votre_localisation")}</Text>
            <Text
              style={{ fontFamily: "Inter_400Regular" }}
              className="text-gray-500 dark:text-gray-400 text-lg"
            >{i18n.t(
              "definissez_votre_emplacement_pour_trouver_des_activites_pres_de_chez_vous"
            )}</Text>
          </Animated.View>

          {/* Carte de localisation actuelle */}
          {existingLocation && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              className="mb-6"
            >
              <View className="bg-blue-50 dark:bg-blue-900 rounded-2xl p-5">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full items-center justify-center">
                    <Ionicons name="location" size={24} color="#2563EB" />
                  </View>
                  <Text
                    style={{ fontFamily: "Inter_400Regular" }}
                    className="ml-3 text-lg font-semibold text-gray-900 dark:text-white"
                  >{i18n.t("emplacement_actuel")}</Text>
                </View>

                <View className="space-y-4">
                  <View className="flex-row items-center">
                    <Ionicons name="home-outline" size={20} color="#6B7280" />
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      className="ml-3 text-gray-600 dark:text-gray-300"
                    >
                      {existingLocation.address}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      className="ml-3 text-gray-600 dark:text-gray-300"
                    >
                      {existingLocation.city}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Ionicons name="flag-outline" size={20} color="#6B7280" />
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      className="ml-3 text-gray-600 dark:text-gray-300"
                    >
                      {existingLocation.country}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Nouvelle localisation */}
          {locationDetails && (
            <Animated.View
              entering={FadeInDown.delay(400).duration(400)}
              className="mb-6"
            >
              <View className="bg-green-50 dark:bg-green-900 rounded-2xl p-5">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full items-center justify-center">
                    <Ionicons name="locate" size={24} color="#059669" />
                  </View>
                  <Text
                    style={{ fontFamily: "Inter_400Regular" }}
                    className="ml-3 text-lg font-semibold text-gray-900 dark:text-white"
                  >{i18n.t("nouvelle_position")}</Text>
                </View>

                <View className="space-y-4">
                  <View className="flex-row items-center">
                    <Ionicons name="home-outline" size={20} color="#059669" />
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      className="ml-3 text-gray-600 dark:text-gray-300"
                    >
                      {locationDetails.address}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color="#059669"
                    />
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      className="ml-3 text-gray-600 dark:text-gray-300"
                    >
                      {locationDetails.city}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Ionicons name="flag-outline" size={20} color="#059669" />
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      className="ml-3 text-gray-600 dark:text-gray-300"
                    >
                      {locationDetails.country}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Boutons d'action */}
          <View className="space-y-4">
            {locationDetails && (
              <TouchableOpacity
                className={`w-full p-4 rounded-xl flex-row items-center justify-center ${
                  loading
                    ? "bg-gray-400 dark:bg-gray-600"
                    : "bg-green-500 dark:bg-green-600"
                }`}
                onPress={handleSaveLocation}
                disabled={loading}
              >
                <Ionicons
                  name={loading ? "reload" : "checkmark-circle"}
                  size={24}
                  color="white"
                />
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-white  ml-2"
                >
                  {loading ? "Enregistrement..." : "Confirmer la position"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className={`w-full mt-5 p-4 rounded-xl flex-row items-center justify-center ${
                loading
                  ? "bg-gray-400 dark:bg-gray-600"
                  : "bg-blue-500 dark:bg-blue-600"
              }`}
              onPress={handleGetLocation}
              disabled={loading}
            >
              <Ionicons
                name={loading ? "reload" : "locate"}
                size={24}
                color="white"
              />
              <Text
                style={{ fontFamily: "Inter_400Regular" }}
                className="text-white  ml-2"
              >
                {loading
                  ? "Localisation..."
                  : existingLocation
                  ? "Mettre à jour la position"
                  : "Détecter ma position"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddLocation;
