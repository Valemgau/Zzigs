import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import firestore from "@react-native-firebase/firestore";
import villesFrance from "../../utils/villes_france.json";
import { COLORS } from "../../styles/colors";
import { useColorScheme } from "nativewind";
import { showMessage } from "react-native-flash-message";
import i18n from "../../../i18n";

const Step3 = ({ onNext, onPrevious }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);

  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true); // Démarrer l'indicateur de chargement
      const querySnapshot = await firestore().collection("categories").get();
      const fetchedCategories = [];
      querySnapshot.forEach((doc) => {
        fetchedCategories.push({ id: doc.id, ...doc.data() });
      });
      setCategories(fetchedCategories); // Mettre à jour les catégories dans l'état
      setLoadingCategories(false); // Arrêter l'indicateur de chargement
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories :", error);
      setLoadingCategories(false);
    }
  };

  const handleNext = () => {
    if (selectedCategory) {
      onNext({ categoryId: selectedCategory });
    } else {
      showMessage({
        message: "Erreur",
        description: "Veuillez sélectionner une catégorie.",
        type: "warning",
      });
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
      >{i18n.t("selectionnez_une_categorie")}</Text>
      <Text
        className="mt-2 text-lg text-gray-500 dark:text-gray-400"
        style={{
          fontFamily: "Inter_400Regular",
        }}
      >{i18n.t("donnez_tous_les_details")}</Text>
      <View
        style={{
          backgroundColor: "#ffffff",
          marginBottom: 16,
        }}
        className="dark:bg-gray-800"
      >
        <Picker
          itemStyle={{
            backgroundColor: isDarkMode ? "#0f172a" : "white",
            color: isDarkMode ? "white" : "black",
          }}
          style={{
            backgroundColor: isDarkMode ? "#1a1a1a" : "white",
            color: isDarkMode ? "white" : "black",
          }}
          dropdownIconColor={isDarkMode ? "white" : "black"}
          selectedValue={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value)}
        >
          <Picker.Item
            label="Sélectionnez une catégorie"
            value=""
            color={isDarkMode ? "#888" : "#666"}
          />
          {loadingCategories ? (
            <ActivityIndicator
              size="small"
              color={isDarkMode ? "#60a5fa" : "#3b82f6"}
            />
          ) : (
            categories.map((category) => (
              <Picker.Item
                key={category.id}
                label={category.name}
                value={category.id}
                color={isDarkMode ? "white" : "black"}
              />
            ))
          )}
        </Picker>
      </View>
      {/* Bouton Suivant */}
      <TouchableOpacity
        style={{ backgroundColor: COLORS.primary }}
        onPress={handleNext}
        activeOpacity={0.8}
        className="py-3 mt-5 rounded-lg"
      >
        <Text
          className="text-white text-center text-base"
          style={{ fontFamily: "Inter_400Regular" }}
        >{i18n.t("suivant")}</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

export default Step3;
