import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import moment from "moment";
import { COLORS } from "../../styles/colors";
import { showMessage } from "react-native-flash-message";
import * as ImageManipulator from "expo-image-manipulator";
import updateUserCoins from "../../utils/updateUserCoins";
import i18n from "../../../i18n";

const Step5 = ({ previousData, onComplete, onPrevious, userSUB }) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Fonction pour demander l'autorisation et sélectionner des images
  const selectImage = async () => {
    if (images.length >= 4) {
      showMessage({
        message: "Limite atteinte",
        description: "Vous ne pouvez ajouter que 4 images.",
        type: "warning",
      });

      return;
    }

    // Demander les permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showMessage({
        message: "Permission refusée",
        description:
          "Vous devez autoriser l'accès à votre galerie pour sélectionner des images.",
        type: "warning",
      });

      return;
    }

    // Sélectionner une image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    // Vérifier si une image a été sélectionnée
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) =>
        [...prev, ...result.assets.map((asset) => asset.uri)].slice(0, 4)
      ); // Limiter à 4 images
    }
  };

  const uploadImages = async () => {
    const uploadedImageUrls = [];
    try {
      setUploading(true);
      for (const imageUri of images) {
        // Compresser l'image
        const compressedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 800 } }], // Redimensionner à une largeur maximale de 800px
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Compression et format JPEG
        );

        const filename = compressedImage.uri.split("/").pop(); // Récupérer le nom de fichier
        const storageRef = storage().ref(`activities/${filename}`);
        await storageRef.putFile(compressedImage.uri);
        const url = await storageRef.getDownloadURL();
        uploadedImageUrls.push(url);
      }
      setUploading(false);
      return uploadedImageUrls;
    } catch (error) {
      setUploading(false);
      console.error("Erreur lors de l'upload des images :", error);
      throw error;
    }
  };

  // Fonction pour publier dans Firestore
  const publishActivity = async () => {
    try {
      if (images.length === 0) {
        Alert.alert(
          "Avertissement",
          "Êtes-vous sûr de vouloir continuer sans ajouter d'image ?",
          [
            {
              text: "Non",
              onPress: () => {
                console.log("L'utilisateur a choisi de ne pas continuer.");
                return;
              },
              style: "cancel",
            },
            {
              text: "Oui",
              onPress: async () => {
                console.log("L'utilisateur a choisi de continuer sans image.");
                await handlePublish(); // Appel à une fonction pour gérer la publication
              },
            },
          ]
        );
        return;
      }

      // Si des images existent, continuez directement
      await handlePublish();
    } catch (error) {
      console.error("Erreur lors de la publication de l'activité :", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la publication.");
    }
  };

  // Fonction séparée pour gérer la logique principale de publication
  const handlePublish = async () => {
    try {
      // Uploadez les images, si elles existent
      const imageUrls = images.length > 0 ? await uploadImages() : null;

      // Préparez les données pour Firestore
      const activityData = {
        ...previousData,
        price: previousData.price ? Number(previousData.price) : 0,
        images: imageUrls,
        participants: [
          { userId: auth().currentUser.uid, active: true, here: false },
        ],
        creatorId: auth().currentUser.uid,
        createdAt: moment().format(),
      };

      const { title, description, maxParticipants } = activityData;

      if (!title || !description) {
        showMessage({
          message: "Veuillez remplir tous les champs nécessaires",
          type: "warning",
        });
        return;
      }

      // Ajout des données dans Firestore
      const activityRef = await firestore()
        .collection("activities")
        .add(activityData);
      const activityId = activityRef.id;

      // Créez une conversation associée à l'activité
      const conversationData = {
        activityId: activityId,
        createdAt: firestore.FieldValue.serverTimestamp(), // Date actuelle du serveur
        messages: [], // Liste initiale de messages vide
        participants: [auth().currentUser.uid],
      };

      await firestore().collection("conversations").add(conversationData);

      // Affichez un message de succès
      showMessage({
        message: "Votre évènement a été publié",
        description:
          "Tous les utilisateurs pourront le voir et le rejoindre à tout moment",
        type: "success",
      });
      const pointsDoc = await firestore()
        .collection("admin")
        .doc("defispoint")
        .get();

      const pointsConfig = pointsDoc.data();
      updateUserCoins(auth().currentUser.uid, pointsConfig.create_new_event)
        .then(() =>
          Alert.alert(
            "Des pièces en plus",
            `Vous avez reçu ${pointsConfig.create_new_event} pièces pour avoir créé un nouvel evènement.`
          )
        )
        .catch((err) => console.error("Échec de l'ajout de pièces:", err));
      onComplete(); // Appel à la fonction `onComplete` pour finaliser le processus
    } catch (error) {
      console.error("Erreur lors de la publication :", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la publication.");
    }
  };

  return (
    <KeyboardAwareScrollView
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      scrollEnabled
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      extraHeight={150}
      contentContainerClassName="px-7 py-10 pb-32 bg-white dark:bg-gray-900"
      showsVerticalScrollIndicator={false}
    >
      <Text
        className="text-2xl text-gray-900 dark:text-white"
        style={{
          fontFamily: "Inter_700Bold",
        }}
      >{i18n.t("ajoutez_des_photos")}</Text>
      <Text
        className="mt-2 text-lg text-gray-500 dark:text-gray-400 mb-8"
        style={{
          fontFamily: "Inter_400Regular",
        }}
      >{i18n.t(
        "mettez_des_images_qui_donneront_envie_de_vous_rejoindre_dans_votre_aventure"
      )}</Text>
      {/* Liste des images sélectionnées */}
      <FlatList
        data={images}
        horizontal
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            className="w-[45vw] h-[45vw] rounded-lg mr-3 border border-gray-300 dark:border-gray-700"
            resizeMode="cover"
          />
        )}
        className="mb-4"
        showsHorizontalScrollIndicator={false}
      />
      {/* Bouton pour sélectionner des images */}
      <TouchableOpacity
        onPress={selectImage}
        className="bg-blue-500 dark:bg-blue-600 py-3 px-6 rounded-lg"
      >
        <Text
          className="text-white text-center text-base"
          style={{ fontFamily: "Inter_400Regular" }}
        >
          Ajouter une image ({images.length}/4)
        </Text>
      </TouchableOpacity>
      {/* Bouton Suivant */}
      <TouchableOpacity
        disabled={uploading}
        style={{
          backgroundColor: COLORS.primary,
          opacity: uploading ? 0.1 : 1,
        }}
        onPress={publishActivity}
        activeOpacity={0.8}
        className="py-3 mt-5 rounded-lg"
      >
        <Text
          className="text-white text-center text-base"
          style={{ fontFamily: "Inter_400Regular" }}
        >
          {uploading ? "Publication..." : "Publier"}
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

export default Step5;
