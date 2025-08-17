import {
  View,
  Text,
  FlatList,
  Pressable,
  SafeAreaView,
  TextInput,
  TouchableHighlight,
} from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import firestore from "@react-native-firebase/firestore";
import { COLORS } from "../styles/colors";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../../i18n";

export default function Categories({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchText, setSearchText] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
    });
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesSnapshot = await firestore()
        .collection("categories")
        .get();

      const categoriesData = categoriesSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }))
        .filter((cat) => !!cat.name && cat.name.trim() !== "");

      setCategories(categoriesData);
      setFilteredCategories(categoriesData);
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories :", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filtrer au fur et à mesure selon searchText
  useEffect(() => {
    const filtered = categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchText.trim().toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [searchText, categories]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.id === selectedCategory?.id ? null : category);
    navigation.navigate({
      name: "Home",
      params: { selectedCategory: category },
      merge: true,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <Animated.View entering={FadeInDown.duration(100)} className="flex-1">
        <View className="px-4 mt-4 mb-2">
          <TextInput
            placeholder={i18n.t(
              "choisissez_une_categorie_pour_filtrer_les_evenements"
            )}
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-lg rounded-full px-4 pb-2 pr-12 border border-gray-300 dark:border-gray-700"
            style={{
              fontFamily: "Inter_400Regular",
              height: 45,
            }}
          />
        </View>
        <FlatList
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          data={filteredCategories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 5)}
            >
              <TouchableHighlight
                underlayColor="#a1a1a1ff" // Bleu pale (tu adaptes si besoin, #EFF6FF = bg-blue-50)
                style={{
                  marginBottom: 0,
                }}
                onPress={() => handleCategorySelect(item)}
              >
                <View
                  className={`flex-row items-center overflow-hidden ${
                    selectedCategory?.id === item.id
                      ? "border-blue-500 bg-blue-50 p-3 dark:bg-blue-900"
                      : "border-gray-100 dark:border-gray-700 bg-white p-3 dark:bg-gray-800"
                  }`}
                >
                  <View className="flex-1">
                    <Text
                      style={{ fontFamily: "Inter_400Regular" }}
                      className={`text-lg ${
                        selectedCategory?.id === item.id
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {item.name}
                    </Text>
                  </View>
                  {selectedCategory?.id === item.id && (
                    <View className="bg-blue-100 dark:bg-blue-800  rounded-full mr-2">
                      <Ionicons name="checkmark" size={16} color="#2563EB" />
                    </View>
                  )}
                </View>
              </TouchableHighlight>
            </Animated.View>
          )}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
