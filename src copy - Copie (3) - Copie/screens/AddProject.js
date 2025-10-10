import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  Alert,
  ScrollView,
  Modal,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { showMessage } from "react-native-flash-message";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Loader from "../components/Loader";
import { COLORS } from "../styles/colors";

const BUDGET_OPTIONS = [
  { label: "Moins de 30€", value: "<30" },
  { label: "31€ - 100€", value: "31-100" },
  { label: "101€ - 250€", value: "101-250" },
  { label: "251€ - 500€", value: "251-500" },
  { label: "Plus de 500€", value: ">500" },
];

export default function AddProject() {
  const navigation = useNavigation();
  const [project, setProject] = useState("");
  const [type, setType] = useState("");
  const [otherType, setOtherType] = useState("");
  const [projectTypes, setProjectTypes] = useState([]);
  const [userMaterials, setUserMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [photoWarningVisible, setPhotoWarningVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [budgetInput, setBudgetInput] = useState("");

  useFocusEffect(
    useCallback(() => {
      const checkAndLoad = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const data = userDoc.data();
          setUserData(data);

          if (
            !data?.username ||
            !data?.firstname ||
            !data?.address ||
            !data?.city ||
            !data?.department
          ) {
            Alert.alert(
              "Informations incomplètes",
              "Merci de remplir vos informations personnelles, votre numéro de téléphone, votre localisation et vos moyens de paiement avant de pouvoir proposer un projet."
            );
            navigation.replace("SettingsScreen");
            return;
          }

          if (
            !data?.address ||
            !data?.city ||
            !data?.postalCode ||
            data.address.trim() === "" ||
            data.city.trim() === "" ||
            data.postalCode.trim() === ""
          ) {
            showMessage({
              message: "Adresse incomplète",
              description: "Merci de renseigner votre adresse complète.",
              type: "warning",
              icon: "warning",
            });
            navigation.navigate("EditLocation");
            return;
          }

          if (!data?.phoneNumber || data.phoneNumber.trim() === "") {
            showMessage({
              message: "Numéro de téléphone manquant",
              description: "Merci de renseigner votre numéro de téléphone.",
              type: "warning",
              icon: "warning",
            });
            navigation.navigate("EditPhoneNumber");
            return;
          }

          let materials = [];
          if (data.sewingMachine) materials.push("Machine à coudre");
          if (data.serger) materials.push("Surjeteuse");
          setUserMaterials(materials);

          const snapshot = await getDocs(collection(db, "categories"));
          const categories = snapshot.docs
            .map((doc) => doc.data().name)
            .filter(Boolean);
          setProjectTypes(categories);
        } catch (e) {
          Alert.alert(
            "Erreur",
            "Impossible de charger les informations utilisateur ou catégories."
          );
          setProjectTypes([]);
          setUserMaterials([]);
        }
        setLoading(false);
      };
      checkAndLoad();
      return () => {};
    }, [navigation])
  );

  const uploadPhotoAsync = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename =
      "projects/" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 10000) +
      ".jpg";
    const storage = getStorage();
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handlePublish = async () => {
    if (!project.trim()) {
      showMessage({
        message: "Description manquante",
        description: "Veuillez décrire votre projet.",
        type: "danger",
      });
      return;
    }
    const actualType = type === "Autre" ? otherType.trim() : type;
    if (!actualType) {
      showMessage({
        message: "Type manquant",
        description: "Veuillez sélectionner ou indiquer le type de projet.",
        type: "danger",
      });
      return;
    }
    if (!selectedBudget && !budgetInput) {
      showMessage({
        message: "Budget manquant",
        description: "Veuillez indiquer un budget pour votre projet.",
        type: "danger",
      });
      return;
    }
    if (budgetInput) {
      const numBudget = parseInt(budgetInput, 10);
      if (isNaN(numBudget) || numBudget < 1 || numBudget > 100000) {
        showMessage({
          message: "Budget invalide",
          description: "Le budget doit être un nombre entre 1 et 100000.",
          type: "danger",
        });
        return;
      }
    }

    // Vérifier si des photos sont ajoutées
    if (photos.length === 0) {
      setPhotoWarningVisible(true);
      return;
    }

    // Continuer la publication
    await proceedWithPublish();
  };

  const proceedWithPublish = async () => {
    setPublishing(true);
    setPhotoWarningVisible(false);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non connecté");

      let photoUrls = [];
      if (photos && photos.length > 0) {
        photoUrls = await Promise.all(
          photos.map((uri) => uploadPhotoAsync(uri))
        );
      }

      await addDoc(collection(db, "projects"), {
        userId: user.uid,
        project,
        type: type === "Autre" ? otherType.trim() : type,
        budget: budgetInput ? budgetInput : selectedBudget,
        materials: userMaterials,
        photos: photoUrls,
        createdAt: new Date(),
        postalCode: userData.postalCode,
        city: userData.city,
        status: "pending",
      });

      showMessage({
        message: "Projet publié",
        description: "Votre projet a bien été publié avec succès.",
        type: "success",
        icon: "success",
      });
      navigation.goBack();
    } catch (e) {
      console.error("Erreur publication:", e);
      showMessage({
        message: "Erreur",
        description: "Impossible de publier le projet.",
        type: "danger",
      });
    }
    setPublishing(false);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handlePublish}
          disabled={publishing}
          className="mr-4"
          style={{ opacity: publishing ? 0.5 : 1 }}
        >
          <Text
            className="text-white text-base"
            style={{ fontFamily: "OpenSans_700Bold" }}
          >
            {publishing ? "..." : "Publier"}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, handlePublish, publishing, photos]);

  const pickImages = async () => {
    if (photoWarningVisible) {
      setPhotoWarningVisible(!photoWarningVisible);
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Permission d'accès à la galerie refusée."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const resizedImages = await Promise.all(
          result.assets.map(async (asset) => {
            const manipResult = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: 800 } }],
              { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manipResult.uri;
          })
        );
        setPhotos((oldPhotos) => [...oldPhotos, ...resizedImages]);
      }
    } catch (e) {
      Alert.alert("Erreur", "Erreur lors de la sélection des images.");
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAwareScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(300).delay(0)}
          className="bg-white border-2 border-gray-200 p-5 mb-5"
        >
          <View className="flex-row items-center mb-3">
            <View
              className="w-10 h-10 items-center justify-center mr-3"
              style={{ backgroundColor: COLORS.primary }}
            >
              <MaterialIcons name="description" size={24} color="#fff" />
            </View>
            <Text
              className="text-xl flex-1"
              style={{
                fontFamily: "OpenSans_700Bold",
                color: COLORS.primary,
              }}
            >
              Description du projet
            </Text>
          </View>

          <Text
            className="text-sm text-gray-600 mb-3"
            style={{ fontFamily: "OpenSans_400Regular" }}
          >
            Décrivez votre projet en détail. Précisez le matériel dont vous
            disposez et celui que le couturier doit apporter.
          </Text>

          <TextInput
            className="border border-gray-300 p-4 bg-gray-50 text-gray-900 min-h-[120px] text-base"
            style={{ fontFamily: "OpenSans_400Regular" }}
            placeholder="Décrivez votre projet ici..."
            placeholderTextColor="#9CA3AF"
            value={project}
            onChangeText={setProject}
            multiline
            textAlignVertical="top"
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(300).delay(50)}
          className="bg-white border-2 border-gray-200 p-5 mb-5"
        >
          <View className="flex-row items-center mb-3">
            <View
              className="w-10 h-10 items-center justify-center mr-3"
              style={{ backgroundColor: COLORS.secondary }}
            >
              <MaterialIcons name="category" size={24} color="#fff" />
            </View>
            <Text
              className="text-xl flex-1"
              style={{
                fontFamily: "OpenSans_700Bold",
                color: COLORS.primary,
              }}
            >
              Type de projet
            </Text>
          </View>

          <View className="flex-row flex-wrap">
            {projectTypes.length === 0 ? (
              <Text
                className="text-gray-400 italic"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                Aucun type disponible
              </Text>
            ) : (
              projectTypes.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  className={`border px-4 py-2.5 mr-2 mb-2 ${
                    type === t ? "border-2" : "border-gray-300"
                  }`}
                  style={{
                    backgroundColor: type === t ? COLORS.primary : "#F9FAFB",
                    borderColor: type === t ? COLORS.primary : "#D1D5DB",
                  }}
                >
                  <Text
                    style={{
                      fontFamily:
                        type === t ? "OpenSans_700Bold" : "OpenSans_400Regular",
                    }}
                    className={`text-sm ${
                      type === t ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))
            )}
            <Pressable
              onPress={() => setType("Autre")}
              className={`border px-4 py-2.5 mr-2 mb-2 ${
                type === "Autre" ? "border-2" : "border-gray-300"
              }`}
              style={{
                backgroundColor: type === "Autre" ? COLORS.primary : "#F9FAFB",
                borderColor: type === "Autre" ? COLORS.primary : "#D1D5DB",
              }}
            >
              <Text
                style={{
                  fontFamily:
                    type === "Autre"
                      ? "OpenSans_700Bold"
                      : "OpenSans_400Regular",
                }}
                className={`text-sm ${
                  type === "Autre" ? "text-white" : "text-gray-700"
                }`}
              >
                Autre
              </Text>
            </Pressable>
          </View>

          {type === "Autre" && (
            <TextInput
              className="border border-gray-300 p-4 bg-gray-50 text-gray-900 mt-3 text-base"
              style={{ fontFamily: "OpenSans_400Regular" }}
              placeholder="Précisez le type de projet"
              placeholderTextColor="#9CA3AF"
              value={otherType}
              onChangeText={setOtherType}
            />
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          className="bg-white border-2 border-gray-200 p-5 mb-5"
        >
          <View className="flex-row items-center mb-3">
            <View
              className="w-10 h-10 items-center justify-center mr-3"
              style={{ backgroundColor: "#10B981" }}
            >
              <MaterialIcons name="construction" size={24} color="#fff" />
            </View>
            <Text
              className="text-xl flex-1"
              style={{
                fontFamily: "OpenSans_700Bold",
                color: COLORS.primary,
              }}
            >
              Matériel disponible
            </Text>
          </View>

          {userMaterials.length === 0 ? (
            <Text
              className="text-gray-500 italic"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              Aucun matériel renseigné dans votre profil
            </Text>
          ) : (
            userMaterials.map((m) => (
              <View key={m} className="flex-row items-center mb-2">
                <MaterialIcons name="check-circle" size={18} color="#10B981" />
                <Text
                  className="text-gray-700 ml-2 text-base"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {m}
                </Text>
              </View>
            ))
          )}
        </Animated.View>

        {/* Champ Budget */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(150)}
          className="mb-5 overflow-hidden border-2"
          style={{
            backgroundColor: COLORS.primary,
            borderColor: COLORS.primary,
          }}
        >
          <View className="p-5">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-white items-center justify-center mr-3">
                <MaterialIcons name="euro" size={28} color={COLORS.primary} />
              </View>
              <Text
                className="text-2xl flex-1 text-white"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                Budget du projet
              </Text>
            </View>

            <View className="bg-white p-5 border-2 border-white">
              <Text
                className="text-sm text-gray-600 mb-3"
                style={{ fontFamily: "OpenSans_600SemiBold" }}
              >
                Montant exact
              </Text>

              <View
                className="flex-row items-center border-b-2 pb-2 mb-4"
                style={{ borderBottomColor: COLORS.primary }}
              >
                <TextInput
                  className="flex-1 text-4xl text-gray-900"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                  value={budgetInput}
                  onChangeText={(text) => {
                    const cleanText = text.replace(/[^0-9]/g, "");
                    if (+cleanText <= 100000) {
                      setBudgetInput(cleanText);
                      setSelectedBudget(null);
                    } else {
                      setBudgetInput("100000");
                    }
                  }}
                  maxLength={6}
                />
                <Text
                  className="text-3xl text-gray-400 ml-2"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  €
                </Text>
              </View>

              <View className="flex-row items-center mb-3">
                <View className="flex-1 h-px bg-gray-300" />
                <Text
                  className="text-gray-500 text-xs mx-3"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  OU FOURCHETTE
                </Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              <Pressable
                onPress={() => setBudgetModalVisible(true)}
                className="border-2 p-4 bg-gray-50 flex-row items-center justify-between"
                style={{
                  borderColor: selectedBudget ? COLORS.primary : "#D1D5DB",
                }}
              >
                <Text
                  className={`text-base ${
                    selectedBudget ? "text-gray-900" : "text-gray-400"
                  }`}
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  {selectedBudget
                    ? BUDGET_OPTIONS.find((b) => b.value === selectedBudget)
                        .label
                    : "Choisir une fourchette"}
                </Text>
                <MaterialIcons
                  name="arrow-drop-down"
                  size={28}
                  color={selectedBudget ? COLORS.primary : "#9CA3AF"}
                />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Photos */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(200)}
          className="bg-white border-2 border-gray-200 p-5 mb-5"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View
                className="w-10 h-10 items-center justify-center mr-3"
                style={{ backgroundColor: "#F59E0B" }}
              >
                <MaterialIcons name="photo-library" size={24} color="#fff" />
              </View>
              <Text
                className="text-xl"
                style={{
                  fontFamily: "OpenSans_700Bold",
                  color: COLORS.primary,
                }}
              >
                Photos ({photos.length})
              </Text>
            </View>
            <Pressable
              onPress={pickImages}
              className="w-10 h-10 items-center justify-center"
              style={{ backgroundColor: COLORS.primary }}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
            </Pressable>
          </View>

          <Text
            className="text-sm text-gray-600 mb-3"
            style={{ fontFamily: "OpenSans_400Regular" }}
          >
            Ajoutez des photos pour illustrer votre projet (facultatif)
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 10 }}
          >
            {photos.map((uri, index) => (
              <Animated.View
                key={`${uri}-${index}`}
                entering={FadeIn.duration(400)}
                className="w-24 h-24 mr-3 relative border-2 border-gray-200"
              >
                <Image
                  source={{ uri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() =>
                    setPhotos((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="absolute top-1 right-1 w-7 h-7 items-center justify-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                >
                  <MaterialIcons name="close" size={18} color="#fff" />
                </Pressable>
              </Animated.View>
            ))}

            <Pressable
              onPress={pickImages}
              className="w-24 h-24 items-center justify-center border-2 border-dashed border-gray-300"
              style={{ backgroundColor: "#F9FAFB" }}
            >
              <MaterialIcons name="add-a-photo" size={32} color="#9CA3AF" />
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAwareScrollView>

      {/* Bouton fixe en bas */}
      <View
        className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t-2 border-gray-200"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <Pressable
          onPress={handlePublish}
          disabled={publishing}
          className="py-4 items-center justify-center flex-row"
          style={{
            backgroundColor: publishing ? "#D1D5DB" : COLORS.primary,
            opacity: publishing ? 0.7 : 1,
          }}
        >
          {publishing && (
            <MaterialIcons
              name="hourglass-empty"
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            className="text-white text-lg"
            style={{ fontFamily: "OpenSans_700Bold" }}
          >
            {publishing ? "Publication en cours..." : "Publier le projet"}
          </Text>
        </Pressable>
      </View>

      {/* Modal Budget */}
      <Modal
        transparent
        animationType="fade"
        visible={budgetModalVisible}
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <TouchableOpacity
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPress={() => setBudgetModalVisible(false)}
          className="flex-1 justify-center px-5"
        >
          <View className="bg-white p-5">
            <Text
              className="text-xl mb-4 text-center"
              style={{ fontFamily: "OpenSans_700Bold", color: COLORS.primary }}
            >
              Choisir un budget
            </Text>
            <FlatList
              data={BUDGET_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedBudget(item.value);
                    setBudgetInput("");
                    setBudgetModalVisible(false);
                  }}
                  className={`py-4 px-4 border-b border-gray-200 ${
                    item.value === selectedBudget ? "bg-gray-100" : ""
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-base flex-1"
                      style={{
                        fontFamily:
                          item.value === selectedBudget
                            ? "OpenSans_700Bold"
                            : "OpenSans_400Regular",
                        color:
                          item.value === selectedBudget
                            ? COLORS.primary
                            : "#374151",
                      }}
                    >
                      {item.label}
                    </Text>
                    {item.value === selectedBudget && (
                      <MaterialIcons
                        name="check-circle"
                        size={24}
                        color={COLORS.primary}
                      />
                    )}
                  </View>
                </Pressable>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal avertissement photos */}
      <Modal
        transparent
        animationType="fade"
        visible={photoWarningVisible}
        onRequestClose={() => setPhotoWarningVisible(false)}
      >
        <View
          className="flex-1 justify-center px-5"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View style={{ padding: 10 }} className="bg-white p-6">
            <View className="items-center mb-4">
              <Text
                className="text-2xl text-center mb-2"
                style={{
                  fontFamily: "OpenSans_700Bold",
                  color: COLORS.primary,
                }}
              >
                Ajouter des photos ?
              </Text>
            </View>

            <Text
              className="text-base text-gray-700 text-center mb-4 leading-6"
              style={{ fontFamily: "OpenSans_400Regular" }}
            >
              Les projets avec photos reçoivent{" "}
              <Text style={{ fontFamily: "OpenSans_700Bold" }}>
                3 fois plus d'offres
              </Text>{" "}
              de la part des couturiers. Cela leur permet de mieux comprendre
              vos besoins et de vous proposer un devis plus précis.
            </Text>

            <View className="bg-amber-50 p-4 mb-5 border-l-4 border-amber-500">
              <View className="flex-row items-start">
                <MaterialIcons
                  name="lightbulb"
                  size={20}
                  color="#F59E0B"
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <Text
                  className="text-sm text-amber-800 flex-1"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  Conseil : Prenez des photos claires du vêtement ou du tissu
                  concerné pour optimiser vos chances.
                </Text>
              </View>
            </View>

            <View className="gap-3">
              <Pressable
                onPress={pickImages}
                className="py-4 items-center justify-center flex-row"
                style={{ backgroundColor: COLORS.primary }}
              >
                <MaterialIcons
                  name="add-a-photo"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text
                  className="text-white text-base"
                  style={{ fontFamily: "OpenSans_700Bold" }}
                >
                  Ajouter des photos
                </Text>
              </Pressable>

              <Pressable
                onPress={proceedWithPublish}
                className="py-4 items-center justify-center border-2 border-gray-300"
              >
                <Text
                  className="text-gray-700 text-base"
                  style={{ fontFamily: "OpenSans_600SemiBold" }}
                >
                  Continuer sans photo
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
