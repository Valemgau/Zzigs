import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  Alert,
  StyleSheet,
  TouchableOpacity,Image,
  ImageBackground,
} from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import BackButton from "../components/Buttons/BackButton";
import {
  DEFAULT_FLATLIST_SCROLLVIEW_BOTTOM_PADDING,
  LINEAR_COLOR,
  UPLOAD_PARAMS,
} from "../styles/constants";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import UserProfilePicture from "../components/Profile/UserProfilePicture";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "../components/Icons";
import { auth, db, storage } from "../../config/firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { doc, updateDoc } from "firebase/firestore";
import Loader from "../components/Loaders/Loader";
import {
  formatNumber,
  imageCompressor,
  openSettings,
} from "../utils/allFunctions";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

export default function ProfileTopCard({ userInfo, getUserInfo }) {
  const { t } = useTranslation();

  const navigation = useNavigation();
  const ICON_SIZE = 30;
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    Alert.alert(
      "Choisir une option",
      "Veuillez sélectionner une option pour choisir une image",
      [
        {
          text: "Caméra",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              openSettings();
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              aspect: UPLOAD_PARAMS.aspect,
              quality: UPLOAD_PARAMS.quality,
            });
            handleImagePickerResult(result);
          },
        },
        {
          text: "Bibliothèque",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              openSettings();
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              aspect: UPLOAD_PARAMS.aspect,
              quality: UPLOAD_PARAMS.quality,
            });
            handleImagePickerResult(result);
          },
        },
        {
          style: "destructive",
          text: "Supprimer la photo",
          onPress: async () => {
            removeProfilePicture();
          },
        },
        {
          text: "Annuler",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const CameraButton = () => (
    <View
      className="absolute -bottom-2 left-7"
      style={{
        zIndex: 99999999,
        justifyContent: "center",
        alignItems: "center",
        height: ICON_SIZE,
        width: ICON_SIZE,
        borderRadius: ICON_SIZE / 2,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: ICON_SIZE,
          width: ICON_SIZE,
        }}
      >
        <Pressable
          style={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            justifyContent: "center",
            alignItems: "center",
            borderRadius: ICON_SIZE,
          }}
          onPress={pickImage}
        >
          {isLoading ? (
            <View className="items-center justify-center">
              <Loader color="gray" />
            </View>
          ) : (
            <Ionicons name="camera-outline" size={20} color="gray" />
          )}
        </Pressable>
      </View>
    </View>
  );

  const handleImagePickerResult = async (result) => {
    setIsLoading(true);
    if (result.canceled) {
      setIsLoading(false);
      return;
    }

    const finalImage = await imageCompressor(result.assets[0].uri);
    const res = await uploadProfilePicture(finalImage);
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      profilPhotoUrl: res,
    });
    getUserInfo();
    setIsLoading(false);
  };

  const uploadProfilePicture = async (image) => {
    try {
      const response = await fetch(image);

      const blobFile = await response.blob();
      const storageRef = ref(
        storage,
        `profile_pictures_/${auth.currentUser.uid}/` + "_" + Date.now()
      );

      const snapshot = await uploadBytesResumable(storageRef, blobFile);

      const imageUrl = await getDownloadURL(snapshot?.ref);
      return imageUrl;
    } catch (error) {
      console.error("Error uploading or retrieving image:", error);
    }
  };

  const removeProfilePicture = async () => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      profilPhotoUrl: "",
    });
    getUserInfo();
  };

  return (
    <View className="h-[15vh] relative mb-24">
      <Image
        className="w-full h-full"
        source={require("../../assets/img/bggg.png")}
        resizeMode={"cover"}
      />

      {/* Overlay sombre */}
      <View
        className="absolute flex-1 top-0"
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0, 0, 0, 0)",
          justifyContent: "center",
          alignItems: "center",
        }}
      ></View>
      {/* absolute view */}
      <View className="-top-[5%] px-4">
        {/* profile picture */}
        <TouchableOpacity
          activeOpacity={userInfo ? 0.7 : 1}
          onPress={() =>
            userInfo ? pickImage() : navigation.navigate("Landing")
          }
          className="self-start w-full relative flex-row items-center justify-between"
        >
          {userInfo && <CameraButton />}

          <UserProfilePicture w={80} photoUrl={userInfo?.profilPhotoUrl} />
          {/* user details */}
          {userInfo ? (
            <Text
              className="w-full capitalize text-xl ml-2"
              style={{ fontFamily: "Inter_500Medium" }}
            >
              {userInfo?.lastName}{" "}
              <Text
                className="uppercase text-lg ml-2 texg-gray-700"
                style={{ fontFamily: "Inter_400Regular" }}
              >
                {userInfo?.firstName}
              </Text>
            </Text>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate("Landing")}
              activeOpacity={0.8}
            >
              <LinearGradient
                className="px-4 py-2 rounded flex-row items-center justify-center"
                colors={LINEAR_COLOR}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
              >
                <Text
                  className="text-sm text-white mr-1"
                  style={{ fontFamily: "Inter_500Medium" }}
                >
                  {t("text.identification")}
                </Text>
                <Ionicons name={"arrow-forward"} size={18} color={"white"} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
