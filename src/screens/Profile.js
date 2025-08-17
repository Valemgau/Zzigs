import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  View,
  Text,
  Platform,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Pressable,
} from "react-native";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import * as Constants from "expo-constants";
import moment from "moment";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeOut,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { showMessage } from "react-native-flash-message";
import ThemeToggle from "../components/ThemeToggle";
import Purchases from "react-native-purchases";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../i18n";


const LANGS = ["fr", "en"];

const flagByLang = {
  fr: require("../../assets/img/fr.png"),
  en: require("../../assets/img/en.png"),
};
const Profile = ({ navigation }) => {
  const user = auth().currentUser;
  const [lang, setLang] = useState(i18n.language);

  const switchLang = () => {
    const nextLang = lang === "fr" ? "en" : "fr";
    i18n.changeLanguage(nextLang);
    setLang(nextLang);
  };
  const [profilePhoto, setProfilePhoto] = useState(user?.photoURL);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState("gratuit");

  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => navigation.navigate("AllOffers")}>
          <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut}>
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-xl text-gray-900 dark:text-white"
            >
              Compte {entitlement}
            </Text>
          </Animated.View>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate("CoinsPage")}>
          <Animated.View
            className="flex flex-row items-center space-x-1" // Ajout d'un petit espace
            entering={FadeIn.delay(400).duration(200)}
            exiting={FadeOut}
          >
            <Text
              style={{ fontFamily: "Inter_500Medium" }}
              className="text-base text-gray-900 dark:text-white mr-1" // Légère marge à droite du texte
            >
              {userInfo?.pieces || 0}
            </Text>
            {/* Icône "coin" à la place de l'image/bitcoin */}
            <View className="bg-yellow-400 dark:bg-yellow-500 p-1 rounded-full">
              <MaterialCommunityIcons name="bitcoin" size={20} color="white" />
            </View>
          </Animated.View>
        </Pressable>
      ),
      headerTitle: "",
    });
  }, [navigation, entitlement, userInfo]);

  // Fonction pour récupérer l'entitlement actif
  const fetchEntitlement = async () => {
    const user = auth().currentUser;

    if (!user) {
      setEntitlement("");
      return;
    }

    try {
      const purchaserInfo = await Purchases.getCustomerInfo();
      const entitlements = purchaserInfo.entitlements.active;

      let entitlementLevel = "gratuit"; // Valeur par défaut
      let subValue = "gratuit";

      if (entitlements.pro) {
        entitlementLevel = "pro";
        subValue = "pro";
      } else if (entitlements.premium) {
        entitlementLevel = "premium";
        subValue = "premium";
      }

      setEntitlement(entitlementLevel);
      await AsyncStorage.setItem("sub", entitlementLevel);

      await firestore()
        .collection("users")
        .doc(user.uid)
        .update({ sub: subValue });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'entitlement :", error);
      setEntitlement("Erreur");
    }
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();

      if (customerInfo.entitlements.active) {
        console.log("Achats restaurés avec succès:");

        let restoredItems = [];
        Object.keys(customerInfo.entitlements.active).forEach(
          async (entitlementKey) => {
            const entitlement =
              customerInfo.entitlements.active[entitlementKey];
            restoredItems.push(entitlementKey);
            await AsyncStorage.setItem("sub", entitlementKey);
          }
        );

        showMessage({
          message: "Achats restaurés avec succès",
          description: `Les éléments suivants ont été restaurés : ${restoredItems.join(
            ", "
          )}`,
          type: "success",
        });
        navigation.navigate("AllOffers");
      } else {
        console.log("Aucun achat à restaurer.");
        showMessage({
          message: "Aucun achat à restaurer",
          description:
            "Nous n'avons trouvé aucun achat à restaurer pour votre compte.",
          type: "info",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la restauration des achats:", error);

      showMessage({
        message: "Erreur lors de la restauration des achats",
        description: error.message || "Une erreur inattendue s'est produite.",
        type: "danger",
      });
    }
  };

  const deleteAccount = () => {
    const currentUser = auth().currentUser;

    if (!currentUser) {
      showMessage({
        message: "Erreur",
        description: "Aucun utilisateur connecté.",
        type: "warning",
      });
      return;
    }

    Alert.alert(
      "Supprimer le compte",
      "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              // Supprimer les données de l'utilisateur de Firestore
              await firestore()
                .collection("users")
                .doc(currentUser.uid)
                .delete();

              // Supprimer l'utilisateur de Firebase Authentication
              await currentUser.delete();

              // Afficher le message de succès
              showMessage({
                message: "Compte supprimé",
                description: "Votre compte a été supprimé avec succès.",
                type: "success",
                duration: 3000,
                onHide: () => {
                  // Déconnecter l'utilisateur et rediriger après l'affichage du message
                  auth()
                    .signOut()
                    .then(() => {
                      // navigation.replace("Home");
                    });
                },
              });
            } catch (error) {
              console.error("Erreur lors de la suppression du compte:", error);
              if (error.code === "auth/requires-recent-login") {
                showMessage({
                  message: "Authentification requise",
                  description:
                    "Veuillez vous reconnecter pour supprimer votre compte.",
                  type: "warning",
                  duration: 3000,
                  onHide: () => {
                    // navigation.replace("Login");
                  },
                });
              } else {
                showMessage({
                  message: "Erreur",
                  description:
                    "Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.",
                  type: "danger",
                });
              }
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserInfo();
      fetchEntitlement();
      return () => {
        fetchUserInfo();
        fetchEntitlement();
      };
    }, [])
  );

  const fetchUserInfo = async () => {
    if (!auth().currentUser) {
      return;
    }
    try {
      // Récupérer l'ID utilisateur connecté
      const userId = auth().currentUser.uid;

      // Obtenir les informations utilisateur depuis Firestore
      const userDoc = await firestore().collection("users").doc(userId).get();

      if (userDoc.exists) {
        setUserInfo(userDoc.data());
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des informations utilisateur :",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const prepareUriForUpload = (uri) => {
    return Platform.OS === "ios" ? uri.replace("file://", "") : uri;
  };

  const uploadImageToFirebase = async (imageUri, fileName) => {
    try {
      const uploadUri = prepareUriForUpload(imageUri);
      const storageRef = storage().ref(
        `users/${auth().currentUser.uid}/${fileName}`
      );

      const task = storageRef.putFile(uploadUri);
      task.on("state_changed", (snapshot) => {});

      await task;
      const downloadUrl = await storageRef.getDownloadURL();
      return downloadUrl;
    } catch (error) {
      console.error("Erreur lors du téléchargement :", error);
      throw new Error("Échec du téléchargement.");
    }
  };

  const pickImage = async (type) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showMessage({
          message: "Une erreur est survenue",
          type: "error",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "profile" ? [1, 1] : [16, 9],
        quality: 1,
      });

      if (!result.canceled) {
        const selectedImageUri = result.assets[0].uri;
        const fileName = `${type}-${Date.now()}.jpg`;
        const downloadUrl = await uploadImageToFirebase(
          selectedImageUri,
          fileName
        );
        await firestore()
          .collection("users")
          .doc(auth().currentUser.uid)
          .update({
            photoURL: downloadUrl,
          });
        await auth().currentUser.updateProfile({ photoURL: downloadUrl });
        setProfilePhoto(downloadUrl);

        showMessage({
          message: "Photo de profil mise à jour.",
          type: "success",
        });
      } else {
      }
    } catch (error) {
      console.error("Erreur dans pickImage :", error);
      showMessage({
        message: "Une erreur est survenue",
        type: "error",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await auth().signOut();
      // navigation.replace("Home");
    } catch (error) {
      showMessage({
        message: "Une erreur est survenue",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#2563eb"
        style={{ marginTop: 50 }}
      />
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-gray-50 dark:bg-gray-900"
    >
      <Animated.View entering={FadeIn.duration(400)} className="mb-20">
        {/* Header avec photo de couverture */}
        <View className="relative h-28">
          <LinearGradient
            colors={["blue", "rgba(0,0,0,0.7)"]}
            className="absolute bottom-0 left-0 right-0 h-24"
          />
        </View>

        {/* Section profil */}
        <View className="px-4 -mt-16">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4">
            {/* Photo de profil */}
            <View className="flex-row justify-between items-start">
              <Animated.View
                entering={FadeInLeft.delay(100).duration(100)}
                className=""
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => pickImage("profile")}
                  className="relative -mt-12"
                >
                  <Image
                    source={
                      profilePhoto
                        ? { uri: profilePhoto }
                        : require("../../assets/img/user.png")
                    }
                    className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-700"
                  />

                  <View className="absolute bottom-1 right-1 bg-blue-500 p-2 rounded-full">
                    <Ionicons name="camera" size={16} color="white" />
                  </View>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                onPress={() => navigation.navigate("EditProfile")}
                className="bg-blue-50 dark:bg-blue-900 p-2 rounded-full"
              >
                <Ionicons name="create-outline" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* Infos utilisateur */}
            <View className="mt-4">
              <Text
                style={{ fontFamily: "Inter_500Medium" }}
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                @{userInfo?.username || ""}
              </Text>

              <Text
                style={{ fontFamily: "Inter_400Regular" }}
                className="text-gray-400 text-base dark:text-gray-400 mt-1"
              >
                {userInfo?.biography}
              </Text>
              <View className="flex-row items-center mt-2">
                <Text
                  style={{ fontFamily: "Inter_400Regular" }}
                  className="text-gray-400 dark:text-gray-400 text-sm"
                >
                  Membre depuis{" "}
                  {moment(userInfo?.createdAt).format("MMMM YYYY")}
                </Text>
              </View>
              {!profilePhoto && (
                <View className="bg-yellow-50 mt-3 dark:bg-yellow-900 px-4 py-1 rounded">
                  <Text
                    style={{ fontFamily: "Inter_400Regular" }}
                    className="text-yellow-600 text-sm dark:text-yellow-300"
                  >
                    {i18n.t(
                      "important_vous_napparaitrez_pas_dans_les_resultats_de_recherche_des_partenaires_tant_que_vous_naurez_pas_ajoute_de_photo_de_profil"
                    )}
                  </Text>
                </View>
              )}
            </View>

            {/* Centres d'intérêt */}
            {userInfo?.interests?.length > 0 && (
              <View className="mt-6">
                <Text
                  style={{ fontFamily: "Inter_500Medium" }}
                  className="text-lg text-gray-900 dark:text-white font-semibold mb-3"
                >
                  {i18n.t("centres_dinteret")}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="gap-2"
                >
                  {userInfo.interests.map((interest, index) => (
                    <View
                      key={index}
                      className="bg-blue-50 mr-3 dark:bg-blue-900 px-4 py-1 rounded-full"
                    >
                      <Text
                        style={{ fontFamily: "Inter_400Regular" }}
                        className="text-blue-500 text-base dark:text-blue-300"
                      >
                        {interest}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Section paramètres */}
        <View className="px-4 mt-6">
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text
        style={{ fontFamily: "Inter_500Medium" }}
        className="text-xl text-gray-900 dark:text-white mb-4"
      >
        {i18n.t("parametres")}
      </Text>
      <TouchableOpacity onPress={switchLang}>
        <Image
          source={flagByLang[lang]}
          style={{ width: 32, height: 32 }}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
          <ThemeToggle />
          {/* Menu items */}
          <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            {/* Section principale */}
            <View className="">
              {[
                // 1. Profil et infos personnelles
                {
                  icon: "person-circle-outline",
                  title: "Informations personnelles",
                  color: "#8B5CF6",
                  bgColor: "#F3E8FF",
                  darkBgColor: "#5B21B6",
                  route: "EditProfile",
                },
                {
                  icon: "call-outline",
                  title: "Numéro de téléphone",
                  color: "#0891B2",
                  bgColor: "#ECFEFF",
                  darkBgColor: "#164E63",
                  route: "AddPhoneNumberPage",
                },
                {
                  icon: "location-outline",
                  title: "Emplacement",
                  color: "#059669",
                  bgColor: "#ECFDF5",
                  darkBgColor: "#064E3B",
                  route: "AddLocation",
                },

                // 2. Abonnement & avantages
                {
                  icon: "star-outline",
                  title: "Abonnement",
                  color: "white",
                  bgColor: "#0abde3",
                  darkBgColor: "#92400E",
                  route: "AllOffers",
                },

                // 3. Fonctionnalités avancées (selon abonnement)
                entitlement === "pro" && {
                  icon: "stats-chart-outline",
                  title: "Statistiques",
                  color: "#EF4444",
                  bgColor: "#FEE2E2",
                  darkBgColor: "#991B1B",
                  route: "Statistiques",
                },
                entitlement !== "gratuit" && {
                  icon: "calendar-outline",
                  title: "Evènements publiés",
                  color: "#EC4899",
                  bgColor: "#FCE7F3",
                  darkBgColor: "#9D174D",
                  route: "MyEvents",
                },

                // 4. Fonctionnalités principales (selon abonnement)
                entitlement !== "pro" && {
                  icon: "heart-outline",
                  title: "Centres d'intérêt",
                  color: "#EF4444",
                  bgColor: "#FEE2E2",
                  darkBgColor: "#991B1B",
                  route: "AddInterest",
                },
                entitlement !== "pro" && {
                  icon: "flash-outline",
                  title: "Echanger mes pièces",
                  color: "white",
                  bgColor: "#8c7ae6",
                  darkBgColor: "#8c7ae6",
                  route: "CoinsPage",
                },
                entitlement !== "pro" && {
                  icon: "card-outline",
                  title: "Voir ma carte",
                  color: "#2563EB",
                  bgColor: "#EFF6FF",
                  darkBgColor: "#1E3A8A",
                  route: "MyCard",
                },

                // 5. Historique
                {
                  icon: "time-outline",
                  title: "Historique",
                  color: "#10B981",
                  bgColor: "#ECFDF5",
                  darkBgColor: "#065F46",
                  route: "History",
                },

                // 6. Aide & parrainage
                {
                  icon: "help-circle-outline",
                  title: "Comment ça marche",
                  color: "#6366F1",
                  bgColor: "#EEF2FF",
                  darkBgColor: "#3730A3",
                  route: "HowItsWork",
                },
                {
                  icon: "pricetags-outline",
                  title: "Parrainer un ami",
                  color: "#F59E0B",
                  bgColor: "#FFFBEB",
                  darkBgColor: "#92400E",
                  route: "ReferralPage",
                },
                {
                  icon: "time-outline",
                  title: "Légal",
                  color: "#10B981",
                  bgColor: "#ECFDF5",
                  darkBgColor: "#065F46",
                  route: "LegalPage",
                },
              ]
                .filter(Boolean)
                // Filtrer les éléments falsy (false, null, undefined)
                .map((item, index) => (
                  <Pressable
                    key={index}
                    onPress={() => navigation.navigate(item.route)}
                    className="flex-row items-center justify-between p-6 active:bg-gray-50 dark:active:bg-gray-700"
                  >
                    <View className="flex-row items-center">
                      <View
                        style={{
                          backgroundColor: isDarkMode
                            ? item.darkBgColor
                            : item.bgColor,
                        }}
                        className="w-10 h-10 rounded-xl items-center justify-center"
                      >
                        <Ionicons
                          name={item.icon}
                          size={20}
                          color={item.color}
                        />
                      </View>
                      <Text
                        style={{ fontFamily: "Inter_400Regular" }}
                        className="ml-3 text-gray-600 text-base dark:text-gray-300"
                      >
                        {item.title}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                ))}
            </View>
          </View>
          <Text
            style={{ fontFamily: "Inter_500Medium" }}
            className="mt-10 text-xl text-gray-900 dark:text-white mb-4"
          >
            {i18n.t("parametres_avances")}
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            {/* Séparateur */}
            <View className="bg-gray-100 dark:bg-gray-700" />

            {/* Section des actions spéciales */}
            <View className="">
              {/* Bouton Restaurer mes achats */}
              <Pressable
                onPress={() => {
                  restorePurchases();
                }}
                className="flex-row items-center justify-between p-4 active:bg-blue-50 dark:active:bg-blue-900"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-800 items-center justify-center">
                    <Ionicons
                      name="refresh-outline"
                      size={20}
                      color="#3B82F6"
                    />
                  </View>
                  <Text
                    style={{ fontFamily: "Inter_400Regular" }}
                    className="ml-3 text-base text-blue-600 dark:text-blue-400 "
                  >
                    {i18n.t("restaurer_mes_achats")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>

              {/* Bouton Supprimer mon compte */}
              <Pressable
                onPress={() => {
                  deleteAccount();
                }}
                className="flex-row items-center justify-between p-4 active:bg-red-50 dark:active:bg-red-900"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-800 items-center justify-center">
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </View>
                  <Text
                    style={{ fontFamily: "Inter_400Regular" }}
                    className="ml-3 text-base text-red-600 dark:text-red-400 "
                  >
                    {i18n.t("supprimer_mon_compte")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>

              {/* Bouton déconnexion */}
              <Pressable
                onPress={handleSignOut}
                className="flex-row items-center justify-between p-4 active:bg-gray-50 dark:active:bg-gray-700"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 items-center justify-center">
                    <Ionicons
                      name="log-out-outline"
                      size={20}
                      color="#4B5563"
                    />
                  </View>
                  <Text
                    style={{ fontFamily: "Inter_400Regular" }}
                    className="ml-3 text-base text-gray-600 dark:text-gray-400 "
                  >
                    {i18n.t("deconnexion")}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Version */}
        <Text
          style={{ fontFamily: "Inter_400Regular" }}
          className="text-center text-gray-400 dark:text-gray-500 text-lg mt-8 mb-4"
        >
          Version {Constants.expoConfig?.version || "1.0.0"}
        </Text>
      </Animated.View>
    </ScrollView>
  );
};

export default Profile;
