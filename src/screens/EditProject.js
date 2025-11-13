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
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { auth, db } from "../../config/firebase";
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { showMessage } from "react-native-flash-message";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Loader from "../components/Loader";
import { COLORS } from "../styles/colors";
import { useTranslation } from "react-i18next";
import { validateText, VALIDATION_RULES } from "../config/validationRules";

const BUDGET_OPTIONS = [
  { label: "Moins de 30€", value: "<30" },
  { label: "31€ - 100€", value: "31-100" },
  { label: "101€ - 250€", value: "101-250" },
  { label: "251€ - 500€", value: "251-500" },
  { label: "Plus de 500€", value: ">500" },
];

export default function EditProject() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { projectId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState("");
  const [type, setType] = useState("");
  const [otherType, setOtherType] = useState("");
  const [projectTypes, setProjectTypes] = useState([]);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [photos, setPhotos] = useState([]);
  const [originalPhotos, setOriginalPhotos] = useState([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const projectDoc = await getDoc(doc(db, "projects", projectId));

      if (!projectDoc.exists()) {
        showMessage({
          message: t("error"),
          description: t("projectNotFound"),
          type: "danger",
        });
        navigation.goBack();
        return;
      }

      const data = projectDoc.data();
      setProject(data.project || "");
      setType(data.type || "");

      // Load categories
      const snapshot = await getDocs(collection(db, "categories"));
      const categories = snapshot.docs
        .map((doc) => doc.data().name)
        .filter(Boolean);
      setProjectTypes(categories);

      // Check if type is "other"
      if (!categories.includes(data.type) && data.type) {
        setType(t("other"));
        setOtherType(data.type);
      }

      // Handle budget
      const budgetValue = data.budget;
      if (budgetValue && !isNaN(parseInt(budgetValue))) {
        setBudgetInput(budgetValue.toString());
      } else {
        setSelectedBudget(budgetValue || null);
      }

      // Load photos
      setPhotos(data.photos || []);
      setOriginalPhotos(data.photos || []);

    } catch (error) {
      console.error("Erreur chargement projet:", error);
      showMessage({
        message: t("error"),
        description: t("projectLoadError"),
        type: "danger",
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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

  const deletePhotoFromStorage = async (photoUrl) => {
    try {
      const storage = getStorage();
      const photoRef = ref(storage, photoUrl);
      await deleteObject(photoRef);
    } catch (error) {
      console.error("Erreur suppression photo:", error);
    }
  };

  const handleSave = async () => {
    const validation = validateText(project, "project");
    if (!validation.isValid) {
      if (validation.error === "required") {
        showMessage({
          message: t("missingDescription"),
          description: t("missingDescriptionDesc"),
          type: "danger",
        });
      } else if (validation.error === "tooShort") {
        showMessage({
          message: t("descriptionTooShort"),
          description: t("descriptionTooShortDesc", { min: validation.minLength, current: validation.currentLength }),
          type: "danger",
        });
      }
      return;
    }

    const actualType = type === t("other") ? otherType.trim() : type;
    if (!actualType) {
      showMessage({
        message: t("missingType"),
        description: t("missingTypeDesc"),
        type: "danger",
      });
      return;
    }

    if (!selectedBudget && !budgetInput) {
      showMessage({
        message: t("missingBudget"),
        description: t("missingBudgetDesc"),
        type: "danger",
      });
      return;
    }

    if (budgetInput) {
      const numBudget = parseInt(budgetInput, 10);
      if (isNaN(numBudget) || numBudget < 1 || numBudget > 100000) {
        showMessage({
          message: t("invalidBudget"),
          description: t("invalidBudgetDesc"),
          type: "danger",
        });
        return;
      }
    }

    setSaving(true);
    try {
      // Upload new photos
      const newPhotos = photos.filter(uri => !originalPhotos.includes(uri));
      const uploadedUrls = await Promise.all(
        newPhotos.map(uri => uploadPhotoAsync(uri))
      );

      // Delete removed photos
      const removedPhotos = originalPhotos.filter(uri => !photos.includes(uri));
      await Promise.all(
        removedPhotos.map(uri => deletePhotoFromStorage(uri))
      );

      // Combine old and new photo URLs
      const existingPhotos = photos.filter(uri => originalPhotos.includes(uri));
      const allPhotos = [...existingPhotos, ...uploadedUrls];

      await updateDoc(doc(db, "projects", projectId), {
        project,
        type: actualType,
        budget: budgetInput || selectedBudget,
        photos: allPhotos,
        updatedAt: new Date(),
      });

      showMessage({
        message: t("changesSaved"),
        description: t("changesSavedDesc"),
        type: "success",
        icon: "success",
        duration: 2000,
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      showMessage({
        message: t("error"),
        description: t("projectSaveError"),
        type: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete all photos from storage
      await Promise.all(
        originalPhotos.map(uri => deletePhotoFromStorage(uri))
      );

      // Delete project document
      await deleteDoc(doc(db, "projects", projectId));

      showMessage({
        message: t("projectDeleted"),
        description: t("projectDeletedDesc"),
        type: "info",
        icon: "info",
        duration: 2000,
      });

      navigation.goBack();
    } catch (error) {
      console.error("Erreur suppression:", error);
      showMessage({
        message: t("error"),
        description: t("projectDeleteError"),
        type: "danger",
      });
    } finally {
      setDeleting(false);
      setDeleteConfirmVisible(false);
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permissionDenied"), t("galleryPermissionDenied"));
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
      Alert.alert(t("error"), t("imageSelectionError"));
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="mr-4"
          style={{ opacity: saving ? 0.5 : 1 }}
        >
          <Text
            className="text-base"
            style={{
              fontFamily: "OpenSans_600SemiBold",
              color: saving ? '#9CA3AF' : COLORS.primary
            }}
          >
            {saving ? "..." : t("save")}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, handleSave, saving, t]);

  if (loading) {
    return <Loader />;
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F8F9FA' }}>
      <KeyboardAwareScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraHeight={200}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Description Section */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(0)}
          className="bg-white rounded-3xl p-4 mb-3"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center mb-3">
            <View
              className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
              style={{ backgroundColor: COLORS.primary + '15' }}
            >
              <MaterialIcons name="description" size={22} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text
                className="text-lg"
                style={{
                  fontFamily: "OpenSans_700Bold",
                  color: '#1F2937',
                }}
              >
                {t("projectDescription")}
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  color: '#6B7280'
                }}
              >
                {t("projectDescriptionInfo")}
              </Text>
            </View>
          </View>

          <TextInput
            className="bg-gray-50 p-3 text-gray-900 min-h-[120px] text-base rounded-2xl"
            style={{
              fontFamily: "OpenSans_400Regular",
              borderWidth: 1.5,
              borderColor: project ? COLORS.primary + '30' : '#E5E7EB'
            }}
            placeholder={t("projectDescriptionPlaceholder", { min: VALIDATION_RULES.project.minLength })}
            placeholderTextColor="#9CA3AF"
            value={project}
            onChangeText={setProject}
            multiline
            textAlignVertical="top"
          />
        </Animated.View>

        {/* Type Section */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(50)}
          className="bg-white rounded-3xl p-4 mb-3"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center mb-3">
            <View
              className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
              style={{ backgroundColor: COLORS.secondary + '15' }}
            >
              <MaterialIcons name="category" size={22} color={COLORS.secondary} />
            </View>
            <Text
              className="text-lg flex-1"
              style={{
                fontFamily: "OpenSans_700Bold",
                color: '#1F2937',
              }}
            >
              {t("projectType")}
            </Text>
          </View>

          <View className="flex-row flex-wrap -mx-1">
            {projectTypes.length === 0 ? (
              <Text
                className="text-gray-400 italic mx-1"
                style={{ fontFamily: "OpenSans_400Regular" }}
              >
                {t("noTypeAvailable")}
              </Text>
            ) : (
              projectTypes.map((projectType) => (
                <Pressable
                  key={projectType}
                  onPress={() => setType(projectType)}
                  className="px-5 py-3 mx-1 mb-2.5 rounded-full"
                  style={{
                    backgroundColor: type === projectType ? COLORS.primary : '#F3F4F6',
                    borderWidth: 1.5,
                    borderColor: type === projectType ? COLORS.primary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: type === projectType ? "OpenSans_600SemiBold" : "OpenSans_400Regular",
                      fontSize: 14,
                      color: type === projectType ? '#FFFFFF' : '#4B5563',
                    }}
                  >
                    {projectType}
                  </Text>
                </Pressable>
              ))
            )}
            <Pressable
              onPress={() => setType(t("other"))}
              className="px-5 py-3 mx-1 mb-2.5 rounded-full"
              style={{
                backgroundColor: type === t("other") ? COLORS.primary : '#F3F4F6',
                borderWidth: 1.5,
                borderColor: type === t("other") ? COLORS.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  fontFamily: type === t("other") ? "OpenSans_600SemiBold" : "OpenSans_400Regular",
                  fontSize: 14,
                  color: type === t("other") ? '#FFFFFF' : '#4B5563',
                }}
              >
                {t("other")}
              </Text>
            </Pressable>
          </View>

          {type === t("other") && (
            <Animated.View entering={FadeIn.duration(300)}>
              <TextInput
                className="bg-gray-50 p-4 text-gray-900 mt-3 text-base rounded-2xl"
                style={{
                  fontFamily: "OpenSans_400Regular",
                  borderWidth: 1.5,
                  borderColor: otherType ? COLORS.primary + '30' : '#E5E7EB'
                }}
                placeholder={t("specifyProjectType")}
                placeholderTextColor="#9CA3AF"
                value={otherType}
                onChangeText={setOtherType}
              />
            </Animated.View>
          )}
        </Animated.View>

        {/* Budget Section */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="bg-white rounded-3xl p-4 mb-3"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: COLORS.primary + '15' }}>
              <MaterialIcons name="euro" size={22} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text
                className="text-lg"
                style={{ fontFamily: "OpenSans_700Bold", color: '#1F2937' }}
              >
                {t("projectBudget")}
              </Text>
            </View>
          </View>

          <View className="bg-gray-50 rounded-2xl p-3">
            <Text
              className="text-xs text-gray-500 mb-2"
              style={{ fontFamily: "OpenSans_600SemiBold", letterSpacing: 0.5 }}
            >
              {t("exactAmount").toUpperCase()}
            </Text>

            <View className="flex-row items-center mb-3">
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
                className="text-3xl text-gray-300 ml-2"
                style={{ fontFamily: "OpenSans_700Bold" }}
              >
                €
              </Text>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="flex-1 h-px bg-gray-200" />
              <Text
                className="text-gray-400 text-xs mx-4"
                style={{ fontFamily: "OpenSans_600SemiBold", letterSpacing: 0.5 }}
              >
                {t("orRange").toUpperCase()}
              </Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <Pressable
              onPress={() => setBudgetModalVisible(true)}
              className="rounded-2xl p-4 flex-row items-center justify-between"
              style={{
                backgroundColor: selectedBudget ? COLORS.primary + '10' : '#F9FAFB',
                borderWidth: 1.5,
                borderColor: selectedBudget ? COLORS.primary : '#E5E7EB',
              }}
            >
              <Text
                className="text-base flex-1"
                style={{
                  fontFamily: selectedBudget ? "OpenSans_600SemiBold" : "OpenSans_400Regular",
                  color: selectedBudget ? COLORS.primary : '#9CA3AF'
                }}
              >
                {selectedBudget
                  ? BUDGET_OPTIONS.find((b) => b.value === selectedBudget)?.label || selectedBudget
                  : t("chooseRange")}
              </Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={24}
                color={selectedBudget ? COLORS.primary : '#9CA3AF'}
              />
            </Pressable>
          </View>
        </Animated.View>

        {/* Photos Section */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(150)}
          className="bg-white rounded-3xl p-4 mb-3"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View
                className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                style={{ backgroundColor: '#F59E0B15' }}
              >
                <MaterialIcons name="photo-library" size={22} color="#F59E0B" />
              </View>
              <View>
                <Text
                  className="text-lg"
                  style={{
                    fontFamily: "OpenSans_700Bold",
                    color: '#1F2937',
                  }}
                >
                  {t("photos", { count: photos.length })}
                </Text>
                <Text
                  className="text-xs mt-0.5"
                  style={{
                    fontFamily: "OpenSans_400Regular",
                    color: '#6B7280'
                  }}
                >
                  {t("managePhotos")}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 10 }}
          >
            {photos.map((uri, index) => (
              <Animated.View
                key={`${uri}-${index}`}
                entering={FadeIn.duration(400)}
                exiting={FadeOut.duration(200)}
                className="w-24 h-24 mr-3 relative rounded-2xl overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
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
                  className="absolute top-2 right-2 w-7 h-7 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.7)",
                  }}
                >
                  <MaterialIcons name="close" size={18} color="#fff" />
                </Pressable>
              </Animated.View>
            ))}

            <Pressable
              onPress={pickImages}
              className="w-24 h-24 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: '#F9FAFB',
                borderWidth: 2,
                borderColor: '#E5E7EB',
                borderStyle: 'dashed'
              }}
            >
              <MaterialIcons name="add-a-photo" size={28} color="#9CA3AF" />
              <Text
                className="text-xs text-gray-400 mt-2"
                style={{ fontFamily: "OpenSans_500Medium" }}
              >
                {t("add")}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>

        {/* Delete Button */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          className="mb-4"
        >
          <Pressable
            onPress={() => setDeleteConfirmVisible(true)}
            className="bg-white rounded-3xl p-4 flex-row items-center justify-center"
            style={{
              shadowColor: "#EF4444",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: 1.5,
              borderColor: '#FEE2E2',
            }}
          >
            <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
            <Text
              className="text-base ml-2"
              style={{
                fontFamily: "OpenSans_600SemiBold",
                color: '#EF4444',
              }}
            >
              {t("deleteProject")}
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollView>

      {/* Budget Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={budgetModalVisible}
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <Pressable
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPress={() => setBudgetModalVisible(false)}
          className="flex-1 justify-end"
        >
          <Animated.View
            entering={FadeInUp.duration(300)}
            className="bg-white rounded-t-3xl overflow-hidden"
          >
            <View className="p-5">
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-5" />

              <Text
                className="text-xl mb-4"
                style={{ fontFamily: "OpenSans_700Bold", color: '#1F2937' }}
              >
                {t("chooseBudget")}
              </Text>

              {BUDGET_OPTIONS.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    setSelectedBudget(item.value);
                    setBudgetInput("");
                    setBudgetModalVisible(false);
                  }}
                  className="py-4 px-5 rounded-2xl mb-2"
                  style={{
                    backgroundColor: item.value === selectedBudget ? COLORS.primary + '10' : 'transparent',
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-base flex-1"
                      style={{
                        fontFamily: item.value === selectedBudget ? "OpenSans_600SemiBold" : "OpenSans_400Regular",
                        color: item.value === selectedBudget ? COLORS.primary : '#374151',
                      }}
                    >
                      {item.label}
                    </Text>
                    {item.value === selectedBudget && (
                      <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: COLORS.primary }}>
                        <MaterialIcons name="check" size={16} color="#fff" />
                      </View>
                    )}
                  </View>
                </Pressable>
              ))}

              <View style={{ height: 20 }} />
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={deleteConfirmVisible}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View
          className="flex-1 justify-center px-5"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <Animated.View
            entering={FadeIn.duration(300)}
            className="bg-white rounded-3xl overflow-hidden"
          >
            <View className="p-6">
              <View className="items-center mb-5">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <MaterialIcons name="delete-forever" size={32} color="#EF4444" />
                </View>

                <Text
                  className="text-xl text-center mb-2"
                  style={{
                    fontFamily: "OpenSans_700Bold",
                    color: '#1F2937',
                  }}
                >
                  {t("deleteProjectQuestion")}
                </Text>

                <Text
                  className="text-base text-center leading-6"
                  style={{
                    fontFamily: "OpenSans_400Regular",
                    color: '#6B7280'
                  }}
                >
                  {t("deleteProjectWarning")}
                </Text>
              </View>

              <View className="gap-3">
                <Pressable
                  onPress={handleDelete}
                  disabled={deleting}
                  className="py-4 rounded-2xl items-center justify-center flex-row"
                  style={{
                    backgroundColor: deleting ? '#FCA5A5' : '#EF4444',
                    opacity: deleting ? 0.7 : 1,
                  }}
                >
                  {deleting && (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  )}
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: "OpenSans_700Bold" }}
                  >
                    {deleting ? t("deleting") : t("yesDelete")}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setDeleteConfirmVisible(false)}
                  disabled={deleting}
                  className="py-4 rounded-2xl items-center justify-center"
                  style={{
                    backgroundColor: '#F3F4F6',
                  }}
                >
                  <Text
                    className="text-gray-700 text-base"
                    style={{ fontFamily: "OpenSans_600SemiBold" }}
                  >
                    {t("cancel")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
