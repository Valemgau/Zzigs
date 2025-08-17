import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Alert,
  Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { COLORS } from "../../styles/colors";
import { useColorScheme } from "nativewind";
import { showMessage } from "react-native-flash-message";
import i18n from "../../../i18n";

const Step4 = ({ onNext }) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [address, setAddress] = useState("");
  const [endPointName, setEndPointName] = useState("");
  const [coordinates, setCoordinates] = useState({
    latitude: null,
    longitude: null,
  });

  const [suggestions, setSuggestions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [errors, setErrors] = useState({});

  const GOOGLE_API_KEY = "AIzaSyCPitKRbKMI7MZtibTQe-RxuUdf1s-fJog";

  // Récupérer les suggestions
  const fetchSuggestions = async (input) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${GOOGLE_API_KEY}&types=address`
      );
      const data = await response.json();
      if (data.status === "OK") {
        const detailedSuggestions = await Promise.all(
          data.predictions.map(async (prediction) => {
            const detailResponse = await fetch(
              `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_API_KEY}`
            );
            const detailData = await detailResponse.json();
            const postalCode =
              detailData?.result?.address_components?.find((comp) =>
                comp.types.includes("postal_code")
              )?.long_name || "";
            const location = detailData?.result?.geometry?.location;
            return {
              ...prediction,
              postalCode,
              coordinates: location
                ? { latitude: location.lat, longitude: location.lng }
                : null,
            };
          })
        );
        setSuggestions(detailedSuggestions);
      } else {
        setSuggestions([]);
        console.error("Google Places API error:", data.error_message);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleValidation = () => {
    let valid = true;
    let tempErrors = {};

    if (!selectedAddress.trim()) {
      valid = false;
      tempErrors.address = "Veuillez sélectionner une adresse.";
    }

    setErrors(tempErrors);
    return valid;
  };

  const handleNext = () => {
    if (handleValidation()) {
      onNext({ location: selectedAddress, coordinates, endPointName });
    } else {
      showMessage({
        message: "Erreur",
        description: "Veuillez corriger les erreurs avant de continuer.",
        type: "warning",
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerClassName="px-7 py-10 pb-32 bg-white dark:bg-gray-900"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      extraHeight={150}
      showsVerticalScrollIndicator={false}
    >
      {/* Titre */}
      <Text
        className="text-2xl text-gray-900 dark:text-white"
        style={{
          fontFamily: "Inter_700Bold",
        }}
      >{i18n.t("nom_du_lieu_et_son_adresse")}</Text>
      {/* Champ name */}
      <View className="mt-8 mb-4">
        <TextInput
          className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-4 text-lg text-gray-800 dark:text-white border-b"
          style={{
            fontFamily: "Inter_400Regular",
          }}
          placeholder="Ex: parc de la pépinière"
          placeholderTextColor="#9CA3AF"
          value={endPointName}
          onChangeText={(text) => {
            setEndPointName(text);
          }}
        />
      </View>
      {/* Champ Adresse */}
      <View className="my-4">
        <Text
          className="my-2 px-2 text-lg text-gray-500 dark:text-gray-400"
          style={{
            fontFamily: "Inter_500Medium",
          }}
        >{i18n.t("tapez_une_adresse_et_selectionnez_parmi_les_suggestions")}</Text>
        <TextInput
          className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-4 text-lg text-gray-800 dark:text-white border-b"
          style={{
            borderColor: errors.address ? "#f87171" : "#d1d5db",
            fontFamily: "Inter_400Regular",
          }}
          placeholder="Entrez l'adresse"
          placeholderTextColor="#9CA3AF"
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            setErrors({ ...errors, address: "" });
            fetchSuggestions(text);
          }}
        />
        {errors.address && (
          <Text style={{ color: "#f87171", fontSize: 12, marginTop: 4, fontFamily: "Inter_400Regular", }}>
            {errors.address}
          </Text>
        )}
      </View>
      {/* Liste des suggestions */}
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          keyboardShouldPersistTaps="always"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSelectedAddress(`${item.description}, ${item.postalCode}`);
                setAddress(`${item.description}, ${item.postalCode}`);
                setCoordinates(item.coordinates);
                setSuggestions([]);
                Keyboard.dismiss();
              }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: isDarkMode ? "#4B5563" : "#d1d5db",
              }}
              className={`${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 16,
                }}
                className={`${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
              >
                {item.description} {item.postalCode && `(${item.postalCode})`}
              </Text>
            </Pressable>
          )}
        />
      )}
      {/* Bouton Suivant */}
      <TouchableOpacity
        style={{ backgroundColor: COLORS.primary }}
        onPress={handleNext}
        activeOpacity={0.8}
        className="py-3 mt-5 rounded-lg "
      >
        <Text
          className="text-white text-center text-base"
          style={{ fontFamily: "Inter_400Regular" }}
        >{i18n.t("suivant")}</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

export default Step4;
