import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  signOut,
} from "firebase/auth";
import { updateDoc, doc, deleteDoc, getDoc } from "firebase/firestore";
import * as ImageManipulator from "expo-image-manipulator";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Image, ImageBackground } from "expo-image";
import { auth, db } from "../../config/firebase";
import { COLORS } from "../styles/colors";
import Loader from "../components/Loader";
import { showMessage } from "react-native-flash-message";

export default function SettingsScreen({ navigation, route }) {
  const userData = route?.params;
  const [photo, setPhoto] = useState(auth.currentUser?.photoURL || null);
  const [loading, setLoading] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("");

  const MENU_SECTIONS = [
    {
      title: "Compte",
      data: [
        {
          key: "EditProfile",
          label: "Informations personnelles",
          onPress: () => navigation.navigate("EditProfile"),
          icon: "person-outline",
        },
        {
          key: "EditPhoneNumber",
          label: "Numéro de téléphone",
          onPress: () => navigation.navigate("EditPhoneNumber"),
          icon: "phone",
        },
        {
          key: "EditLocation",
          label: "Gérer ma localisation",
          onPress: () => navigation.navigate("EditLocation"),
          icon: "location-on",
        },
        {
          key: "EditBankInfo",
          label: "Coordonnées bancaires",
          onPress: () => navigation.navigate("EditBankInfo"),
          icon: "account-balance",
        },
      ],
    },
    {
      title: "Préférences",
      data: [
        {
          key: "EditLanguage",
          label: "Modifier la langue",
          onPress: () => navigation.navigate("EditLanguage"),
          icon: "language",
        },
      ],
    },
    // {
    //   title: "Abonnement",
    //   data: [
    //     {
    //       key: "SubscriptionInfo",
    //       label: "Mon abonnement",
    //       onPress: () =>
    //         showMessage({
    //           message: "Abonnement",
    //           description: "La section abonnement sera bientôt disponible",
    //           type: "info",
    //         }),
    //       icon: "workspace-premium",
    //     },
    //   ],
    // },
    {
      title: "Support",
      data: [
        {
          key: "ContactUs",
          label: "Nous contacter",
          onPress: () => navigation.navigate("ContactUs"),
          icon: "chat-bubble-outline",
        },
      ],
    },
    {
      title: "Danger",
      data: [
        {
          key: "logout",
          label: "Se déconnecter",
          onPress: () =>
            Alert.alert(
              "Confirmer la déconnexion",
              "Voulez-vous vraiment vous déconnecter ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Se déconnecter",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await signOut(auth);
                    } catch {
                      Alert.alert(
                        "Erreur",
                        "Impossible de se déconnecter. Veuillez réessayer."
                      );
                    }
                  },
                },
              ]
            ),
          icon: "logout",
          danger: true,
        },
        {
          key: "deleteAccount",
          label: "Supprimer mon compte",
          // onPress: () =>
          //   Alert.alert(
          //     "Confirmer la suppression",
          //     "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.",
          //     [
          //       { text: "Annuler", style: "cancel" },
          //       {
          //         text: "Supprimer",
          //         style: "destructive",
          //         onPress: handleDeleteAccount,
          //       },
          //     ]
          //   ),
          onPress: () => navigation.navigate("DeleteAccountScreen"),
          icon: "delete",
          danger: true,
        },
      ],
    },
  ];

  useEffect(() => {
    const fetchProfileAndCheckSubscription = async () => {
      if (!auth.currentUser) return;

      try {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setUserProfile(profileData);
          if (profileData.photo) setPhoto(profileData.photo);

          // Vérifier si le compte est actif
          const isAccountActive = profileData.isActive ?? false;

          // Vérifier si l'email est vérifié
          const isEmailVerified = profileData.emailIsVerified ?? false;

          if (isAccountActive && isEmailVerified) {
            setVerificationStatus("Compte actif, Adresse e-mail vérifiée");
          } else {
            const status = [];
            if (!isAccountActive) status.push("Compte inactif");
            if (!isEmailVerified) status.push("Email non vérifié");
            setVerificationStatus(status.join(", "));
          }
        }
      } catch (e) {
        console.error("Erreur profil:", e);
        setVerificationStatus("Erreur lors de la vérification");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndCheckSubscription();
  }, []);

  async function handleDeleteAccount() {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await deleteDoc(doc(db, "users", user.uid));
      await user.delete();
    } catch (e) {
      if (e.code === "auth/requires-recent-login") {
        Alert.prompt(
          "Vérification",
          "Veuillez saisir votre mot de passe pour confirmer la suppression.",
          async (password) => {
            if (!password) return;
            try {
              const cred = EmailAuthProvider.credential(
                auth.currentUser.email,
                password
              );
              await reauthenticateWithCredential(auth.currentUser, cred);
              await deleteDoc(doc(db, "users", auth.currentUser.uid));
              await auth.currentUser.delete();
            } catch {
              Alert.alert("Erreur", "Mot de passe invalide ou autre erreur.");
            }
          },
          "secure-text"
        );
      } else {
        Alert.alert(
          "Erreur",
          "Impossible de supprimer le compte. Veuillez vous reconnecter."
        );
      }
    }
  }

  const pickImage = async () => {
    setPhotoLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      const asset = result.assets?.[0] || result.selectedAssets;
      if (asset?.uri && auth.currentUser) {
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 400, height: 400 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        const response = await fetch(manipResult.uri);
        const blob = await response.blob();
        const storage = getStorage();
        const storageRef = ref(
          storage,
          `users/${auth.currentUser.uid}/profile.jpg`
        );
        await uploadBytes(storageRef, blob);
        const photoURL = await getDownloadURL(storageRef);
        await updateProfile(auth.currentUser, { photoURL });
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          photo: photoURL,
        });
        setPhoto(photoURL);
        showMessage({
          message: "Photo mise à jour",
          description: "Votre photo de profil a été modifiée",
          type: "success",
          icon: "success",
        });
      }
    } catch (e) {
      console.log(e);
      showMessage({
        message: "Erreur",
        description: "Impossible de mettre à jour la photo",
        type: "danger",
        icon: "danger",
      });
    } finally {
      setPhotoLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header avec photo de profil */}
        <View className="relative">
          <ImageBackground
            priority="high"
            source={require("../../assets/img/bg.jpg")}
            contentFit="cover"
            style={{ height: 140 }}
          >
            {/* Overlay */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
            />

            {/* Photo de profil et infos - Style Facebook */}
            <View className="flex-1 justify-end pb-4 px-5">
              <View className="flex-row items-end">
                {/* Photo de profil */}
                <TouchableOpacity
                  onPress={pickImage}
                  disabled={photoLoading}
                  activeOpacity={0.8}
                  className="relative"
                >
                  {photo ? (
                    <Image
                      source={{ uri: photo }}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 50,
                        borderWidth: 3,
                        borderColor: "#fff",
                      }}
                      priority="high"
                    />
                  ) : (
                    <Animated.View entering={FadeIn.duration(450)}>
                      <Image
                        source={require("../../assets/img/user.png")}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 50,
                          borderWidth: 3,
                          borderColor: "#fff",
                        }}
                        priority="high"
                      />
                    </Animated.View>
                  )}
                  <View
                    className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 border-2"
                    style={{ borderColor: COLORS.primary }}
                  >
                    {photoLoading ? (
                      <ActivityIndicator size={18} color={COLORS.primary} />
                    ) : (
                      <MaterialIcons
                        name="camera-alt"
                        size={18}
                        color={COLORS.primary}
                      />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Nom et infos à droite */}
                {userProfile && (
                  <Animated.View
                    entering={FadeInDown.duration(300).delay(100)}
                    className="flex-1 ml-4 pb-1"
                  >
                    {/* Nom complet avec badge */}
                    <View className="flex-row items-center mb-1">
                      <Text
                        className="text-white text-lg mr-2"
                        style={{
                          fontFamily: "OpenSans_700Bold",
                        }}
                        numberOfLines={1}
                      >
                        {userProfile.username}
                      </Text>
                      {/* Badge Demandeur/Couturier */}
                      <View
                        className="px-2 py-0.5 rounded-full flex-row items-center"
                        style={{
                          backgroundColor: userProfile.isClient
                            ? "#3B82F6"
                            : "#8B5CF6",
                        }}
                      >
                        <MaterialIcons
                          name={userProfile.isClient ? "person" : "content-cut"}
                          size={12}
                          color="#fff"
                        />
                        <Text
                          className="text-white text-xs ml-1"
                          style={{ fontFamily: "OpenSans_600SemiBold" }}
                        >
                          {userProfile.isClient ? "Demandeur" : "Couturier"}
                        </Text>
                      </View>
                    </View>
                    {/* Email */}
                    <Text
                      className="text-white text-sm opacity-90"
                      style={{ fontFamily: "OpenSans_400Regular" }}
                      numberOfLines={1}
                    >
                      {auth.currentUser?.email}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Statut d'abonnement */}
        {verificationStatus && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(150)}
            className="mx-5 mt-5 bg-white border border-gray-200 px-4 py-3 flex-row items-center"
          >
            <MaterialIcons
              name={
                verificationStatus.includes("vérifié")
                  ? "verified"
                  : "error-outline"
              }
              size={20}
              color={
                verificationStatus.includes("vérifié") ? "#10B981" : "#F59E0B"
              }
            />
            <View className="ml-3 flex-1">
              <Text
                className="text-xs text-gray-500 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                Statut
              </Text>
              <Text
                className="text-sm text-gray-900"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                {verificationStatus}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Menu sections */}
        <View className="px-5 pb-8">
          {MENU_SECTIONS.map((section, sectionIndex) => (
            <Animated.View
              key={section.title}
              entering={FadeInDown.duration(300).delay(200 + sectionIndex * 50)}
              className="mt-6"
            >
              <Text
                className="text-xs text-gray-500 mb-3 uppercase tracking-wider px-1"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                {section.title}
              </Text>
              <View className="bg-white border border-gray-200 overflow-hidden">
                {section.data.map((item, index) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                    className={`flex-row items-center px-4 py-4 ${
                      index < section.data.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: item.danger
                          ? "#FEE2E2"
                          : COLORS.primary + "15",
                      }}
                    >
                      <MaterialIcons
                        name={item.icon}
                        size={20}
                        color={item.danger ? "#DC2626" : COLORS.primary}
                      />
                    </View>
                    <Text
                      className="flex-1 text-base ml-4"
                      style={{
                        fontFamily: "OpenSans_600SemiBold",
                        color: item.danger ? "#DC2626" : "#374151",
                      }}
                    >
                      {item.label}
                    </Text>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Version */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(500)}
          className="items-center pb-8"
        >
          <Text
            className="text-sm text-gray-400"
            style={{ fontFamily: "OpenSans_400Regular" }}
          >
            Version {Constants.expoConfig?.version || "1.0.0"}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
