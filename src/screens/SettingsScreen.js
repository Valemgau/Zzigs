import React, { useState, useEffect, useCallback } from "react";
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
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { Image, ImageBackground } from "expo-image";
import { auth, db } from "../../config/firebase";
import { COLORS } from "../styles/colors";
import Loader from "../components/Loader";
import { showMessage } from "react-native-flash-message";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedImageBackground =
  Animated.createAnimatedComponent(ImageBackground);

export default function SettingsScreen({ navigation, route }) {
  const userData = route?.params;
  const { t } = useTranslation();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("");
  const [missingFields, setMissingFields] = useState({});

  const scrollY = useSharedValue(0);
  const IMAGE_HEIGHT = 140;

  // Fonction pour vérifier les champs manquants
  const checkMissingFields = (profile) => {
    const missing = {
      photo: !profile?.photo,
      personalInfo:
        !profile?.firstname || !profile?.lastname || !profile?.username,
      phoneNumber:
        !profile?.phoneNumber,
      location: !profile?.address || !profile?.city || !profile?.postalCode,
      bankInfo: !profile?.iban || !profile?.bankName,
    };
    setMissingFields(missing);
  };

  const getMenuSections = () => {
    const sections = [
      {
        title: t("account"),
        data: [
          {
            key: "EditProfile",
            label: t("personalInformation"),
            onPress: () => navigation.navigate("EditProfile"),
            icon: "person-outline",
            hasWarning: missingFields.personalInfo,
          },
          {
            key: "EditPhoneNumber",
            label: t("phoneNumber"),
            onPress: () => navigation.navigate("EditPhoneNumber"),
            icon: "phone",
            hasWarning: missingFields.phoneNumber,
          },
          {
            key: "EditLocation",
            label: t("manageLocation"),
            onPress: () => navigation.navigate("EditLocation"),
            icon: "location-on",
            hasWarning: missingFields.location,
          },
        ],
      },
      {
        title: t("preferences"),
        data: [
          {
            key: "EditLanguage",
            label: t("changeLanguage"),
            onPress: () => navigation.navigate("EditLanguage"),
            icon: "language",
          },
        ],
      },
      {
        title: t("support"),
        data: [
          {
            key: "ContactUs",
            label: t("contactUs"),
            onPress: () => navigation.navigate("ContactUs"),
            icon: "chat-bubble-outline",
          },
        ],
      },
      {
        title: t("danger"),
        data: [
          {
            key: "logout",
            label: t("logout"),
            onPress: () =>
              Alert.alert(t("confirmLogout"), t("confirmLogoutDesc"), [
                { text: t("cancel"), style: "cancel" },
                {
                  text: t("logout"),
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await signOut(auth);
                    } catch {
                      Alert.alert(t("error"), t("logoutError"));
                    }
                  },
                },
              ]),
            icon: "logout",
            danger: true,
          },
          {
            key: "deleteAccount",
            label: t("deleteAccount"),
            onPress: () => navigation.navigate("DeleteAccountScreen"),
            icon: "delete",
            danger: true,
          },
        ],
      },
    ];

    // Ajouter EditBankInfo uniquement si ce n'est pas un client
    if (userProfile && !userProfile.isClient) {
      sections[0].data.splice(3, 0, {
        key: "EditBankInfo",
        label: t("bankDetails"),
        onPress: () => navigation.navigate("EditBankInfo"),
        icon: "account-balance",
        hasWarning: missingFields.bankInfo,
      });
    }

    return sections;
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-IMAGE_HEIGHT, 0],
      [2, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [-IMAGE_HEIGHT, 0],
      [-IMAGE_HEIGHT / 2, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  useFocusEffect(
    useCallback(() => {
      const fetchProfileAndCheckSubscription = async () => {
        if (!auth.currentUser) return;

        setLoading(true);

        try {
          const docRef = doc(db, "users", auth.currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const profileData = docSnap.data();
            setUserProfile(profileData);

            // IMPORTANT: Utiliser UNIQUEMENT la photo de Firestore
            // Ignorer auth.currentUser.photoURL car il peut être obsolète
            if (profileData.photo) {
              // Ajouter un timestamp pour forcer le rafraîchissement du cache
              setPhoto(`${profileData.photo}?t=${Date.now()}`);
            } else {
              setPhoto(null);
            }

            // Vérifier les champs manquants
            checkMissingFields(profileData);

            const isAccountActive = profileData.isActive ?? false;
            const isEmailVerified = profileData.emailIsVerified ?? false;

            if (isAccountActive && isEmailVerified) {
              setVerificationStatus(t("accountActiveEmailVerified"));
            } else {
              const status = [];
              if (!isAccountActive) status.push(t("accountInactive"));
              if (!isEmailVerified) status.push(t("emailNotVerified"));
              setVerificationStatus(status.join(", "));
            }
          }
        } catch (e) {
          console.error("Erreur profil:", e);
          setVerificationStatus(t("verificationError"));
        } finally {
          setLoading(false);
        }
      };

      fetchProfileAndCheckSubscription();
    }, [t])
  );

  async function handleDeleteAccount() {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await deleteDoc(doc(db, "users", user.uid));
      await user.delete();
    } catch (e) {
      if (e.code === "auth/requires-recent-login") {
        Alert.prompt(
          t("verification"),
          t("enterPasswordToConfirm"),
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
              Alert.alert(t("error"), t("invalidPasswordOrError"));
            }
          },
          "secure-text"
        );
      } else {
        Alert.alert(t("error"), t("deleteAccountError"));
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

        // Mettre à jour Firebase Auth et Firestore
        await updateProfile(auth.currentUser, { photoURL });
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          photo: photoURL,
        });

        // Ajouter timestamp pour forcer le rafraîchissement
        setPhoto(`${photoURL}?t=${Date.now()}`);

        // Mettre à jour missingFields
        setMissingFields((prev) => ({ ...prev, photo: false }));

        showMessage({
          message: t("photoUpdated"),
          description: t("photoUpdatedDesc"),
          type: "success",
          icon: "success",
        });
      }
    } catch (e) {
      console.log(e);
      showMessage({
        message: t("error"),
        description: t("photoUpdateError"),
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
      <AnimatedScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View className="relative" style={{ height: IMAGE_HEIGHT }}>
          <AnimatedImageBackground
            priority="high"
            source={require("../../assets/img/bg.jpg")}
            contentFit="cover"
            style={[
              {
                height: IMAGE_HEIGHT,
                width: "100%",
              },
              imageAnimatedStyle,
            ]}
          >
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

            <View className="flex-1 justify-end pb-4 px-5">
              <View className="flex-row items-end">
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
                        borderColor: missingFields.photo ? "#DC2626" : "#fff",
                      }}
                      priority="high"
                      cachePolicy="none"
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
                          borderColor: "#DC2626",
                        }}
                        priority="high"
                      />
                    </Animated.View>
                  )}
                  <View
                    className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 border-2"
                    style={{
                      borderColor: missingFields.photo
                        ? "#DC2626"
                        : COLORS.primary,
                    }}
                  >
                    {photoLoading ? (
                      <ActivityIndicator
                        size={18}
                        color={missingFields.photo ? "#DC2626" : COLORS.primary}
                      />
                    ) : (
                      <MaterialIcons
                        name="camera-alt"
                        size={18}
                        color={missingFields.photo ? "#DC2626" : COLORS.primary}
                      />
                    )}
                  </View>
                  {missingFields.photo && (
                    <View
                      className="absolute -top-1 -right-1 bg-red-600 rounded-full"
                      style={{
                        width: 20,
                        height: 20,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <MaterialIcons
                        name="priority-high"
                        size={14}
                        color="#fff"
                      />
                    </View>
                  )}
                </TouchableOpacity>

                {userProfile && (
                  <Animated.View
                    entering={FadeInDown.duration(300).delay(100)}
                    className="flex-1 ml-4 pb-1"
                  >
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
                          {userProfile.isClient ? t("customer") : t("tailor")}
                        </Text>
                      </View>
                    </View>
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
          </AnimatedImageBackground>
        </View>

        {verificationStatus && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(150)}
            className="mx-5 mt-5 bg-white border border-gray-200 px-4 py-3 flex-row items-center"
          >
            <MaterialIcons
              name={
                verificationStatus.includes(t("verified"))
                  ? "verified"
                  : "error-outline"
              }
              size={20}
              color={
                verificationStatus.includes(t("verified"))
                  ? "#10B981"
                  : "#F59E0B"
              }
            />
            <View className="ml-3 flex-1">
              <Text
                className="text-xs text-gray-500 uppercase tracking-wider"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                {t("status.status")}
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

        {/* Alerte globale pour les champs manquants */}
        {Object.values(missingFields).some((v) => v) && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(200)}
            className="mx-5 mt-3 bg-red-50 border border-red-200 px-4 py-3 flex-row items-start"
          >
            <MaterialIcons name="warning" size={20} color="#DC2626" />
            <View className="ml-3 flex-1">
              <Text
                className="text-sm text-red-800 mb-1"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                {t("incompleteProfile") || "Profil incomplet"}
              </Text>
            </View>
          </Animated.View>
        )}

        <View className="px-5 pb-8">
          {getMenuSections().map((section, sectionIndex) => (
            <Animated.View
              key={section.title}
              entering={FadeInDown.duration(300).delay(250 + sectionIndex * 50)}
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
                    style={{
                      backgroundColor: item.hasWarning ? "#FEF2F2" : "#fff",
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center relative"
                      style={{
                        backgroundColor: item.danger
                          ? "#FEE2E2"
                          : item.hasWarning
                          ? "#FEE2E2"
                          : COLORS.primary + "15",
                      }}
                    >
                      <MaterialIcons
                        name={item.icon}
                        size={20}
                        color={
                          item.danger
                            ? "#DC2626"
                            : item.hasWarning
                            ? "#DC2626"
                            : COLORS.primary
                        }
                      />
                      {item.hasWarning && (
                        <View
                          className="absolute -top-1 -right-1 bg-red-600 rounded-full"
                          style={{
                            width: 16,
                            height: 16,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <MaterialIcons
                            name="priority-high"
                            size={10}
                            color="#fff"
                          />
                        </View>
                      )}
                    </View>
                    <Text
                      className="flex-1 text-base ml-4"
                      style={{
                        fontFamily: "OpenSans_600SemiBold",
                        color: item.danger
                          ? "#DC2626"
                          : item.hasWarning
                          ? "#DC2626"
                          : "#374151",
                      }}
                    >
                      {item.label}
                    </Text>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={item.hasWarning ? "#DC2626" : "#9CA3AF"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ))}
        </View>

        <Animated.View
          entering={FadeInDown.duration(300).delay(500)}
          className="items-center pb-8"
        >
          <Text
            className="text-sm text-gray-400"
            style={{ fontFamily: "OpenSans_400Regular" }}
          >
            {t("version")} {Constants.expoConfig?.version || "1.0.0"}
          </Text>
        </Animated.View>
      </AnimatedScrollView>
    </SafeAreaView>
  );
}
