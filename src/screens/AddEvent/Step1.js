import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity } from "react-native";
import { Slider } from "react-native-elements";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { COLORS } from "../../styles/colors";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showMessage } from "react-native-flash-message";
import i18n from "../../../i18n";

const Step1 = ({ userSUB, onNext }) => {
  console.log("userSUB", userSUB);
  const [price, setPrice] = useState("0");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(2);
  const allowedParticipants = userSUB == "pro" ? 20 : 5;
  const [errors, setErrors] = useState({});

  const handleValidation = () => {
    let valid = true;
    let tempErrors = {};

    if (!title.trim()) {
      valid = false;
      tempErrors.title = "Le titre est obligatoire.";
    }
    if (!description.trim()) {
      valid = false;
      tempErrors.description = "La description est obligatoire.";
    }
    if (maxParticipants < 2 || maxParticipants > 20) {
      valid = false;
      tempErrors.maxParticipants =
        "Le nombre de participants doit être compris entre 2 et 20.";
    }

    setErrors(tempErrors);
    return valid;
  };

  const handleNext = () => {
    if (handleValidation()) {
      onNext({ price, title, description, maxParticipants });
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
      <Animated.View entering={FadeInUp.duration(400)} className="space-y-8">
        <Text
          style={{ fontFamily: "Inter_700Bold" }}
          className="text-2xl mb-5 text-gray-900 dark:text-white"
        >
          {i18n.t("creer_un_evenement")}
        </Text>
        {/* Champ Prix */}
        {userSUB == "pro" && (
          <View className="mt-4">
            <View className="relative">
              <Text
                style={{ fontFamily: "Inter_500Medium" }}
                className="text-xl mb-2 text-gray-900 dark:text-white"
              >
                {i18n.t("adhesion")}
              </Text>

              {/* Badge Nouveauté */}
              <View className="absolute -right-0 transform -rotate-10 bg-green-500 px-2 py-1 rounded-full">
                <Text
                  style={{ fontFamily: "Inter_700Bold" }}
                  className="text-xs text-white uppercase tracking-wider"
                >
                  {i18n.t("nouveaute")}
                </Text>
              </View>
            </View>

            <Text
              style={{ fontFamily: "Inter_400Regular" }}
              className="my-2 text-lg text-gray-500 dark:text-gray-400"
            >
              {i18n.t(
                "mettez_le_cout_de_ladhesion_a_votre_evenement_en_euros_ou_laissez_a_0_si_lentree_est_libre"
              )}
            </Text>
            <View
              className="flex-row items-center justify-center p-5"
              style={{
                borderColor: errors.price ? "#f87171" : "#d1d5db",
              }}
            >
              <TextInput
                className="self-center w-full text-4xl text-gray-500"
                style={{
                  fontFamily: "Inter_500Medium",
                  // color: price ? "#374151" : "gray",
                }}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={price}
                onChangeText={(text) => {
                  setPrice(text);
                  setErrors((prev) => ({ ...prev, price: "" }));
                }}
              />
              <Text
                className="text-3xl text-gray-500"
                style={{
                  fontFamily: "Inter_500Medium",
                  marginLeft: 4, // Espacement entre l'input et le symbole
                }}
              >
                {i18n.t("€")}
              </Text>
            </View>
            {errors.price && (
              <Text className="text-red-500 text-sm mt-1">{errors.price}</Text>
            )}
          </View>
        )}

        {/* Slider Nombre de Participants */}
        <View>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
            }}
            className="text-xl mb-2 text-gray-900 dark:text-white"
          >
            {i18n.t("participants")}
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
            }}
            className="text-lg text-gray-500 dark:text-gray-400 mb-4"
          >
            Le nombre de participants max est de {allowedParticipants} (dont
            vous même)
          </Text>

          <Slider
            style={{
              fontFamily: "Inter_500Medium",
            }}
            value={maxParticipants}
            onValueChange={(value) => {
              setMaxParticipants(value);
              setErrors((prev) => ({ ...prev, maxParticipants: "" }));
            }}
            minimumValue={2}
            maximumValue={allowedParticipants}
            step={1}
            thumbTintColor={COLORS.primary}
            thumbStyle={{
              height: 25,
              width: 25,
              backgroundColor: COLORS.primary,
            }}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor="#d1d5db"
          />
          <Text
            style={{
              fontFamily: "Inter_500Medium",
            }}
            className="text-center text-base mt-2 text-gray-900 dark:text-white"
          >
            {maxParticipants}/{allowedParticipants}
          </Text>
          {errors.maxParticipants && (
            <Text
              style={{
                fontFamily: "Inter_500Medium",
              }}
              className="text-red-500 text-sm mt-1"
            >
              {errors.maxParticipants}
            </Text>
          )}
        </View>

        {/* Titre et description */}
        <View className="mt-7">
          <Text
            style={{ fontFamily: "Inter_500Medium" }}
            className="text-xl mb-2 text-gray-900 dark:text-white"
          >
            {i18n.t("details")}
          </Text>
          <Text
            style={{ fontFamily: "Inter_400Regular" }}
            className="mt-2 text-lg text-gray-500 dark:text-gray-400"
          >
            {i18n.t("donner_envie_de_ne_pas_rater_evenement")}
          </Text>
        </View>

        {/* Champ Titre */}
        <View className="mt-4">
          <TextInput
            className="bg-gray-100 dark:bg-gray-800 rounded-t-lg px-4 py-3 text-lg text-gray-800 dark:text-white border-b"
            style={{
              fontFamily: "Inter_400Regular",
              borderColor: errors.title ? "#f87171" : "#d1d5db",
            }}
            placeholder="Ex: Gravir l'Everest"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setErrors((prev) => ({ ...prev, title: "" }));
            }}
          />
          {errors.title && (
            <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>
          )}
        </View>

        {/* Champ Description */}
        <View className="mb-4 mt-5">
          <TextInput
            className="bg-gray-100 dark:bg-gray-800 rounded-b-lg px-4 py-3 text-lg text-gray-800 dark:text-white border-b h-24"
            style={{
              fontFamily: "Inter_500Medium",
              borderColor: errors.description ? "#f87171" : "#d1d5db",
              textAlignVertical: "top",
            }}
            placeholder="Donnez plus de détails"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setErrors((prev) => ({ ...prev, description: "" }));
            }}
            multiline
          />
          {errors.description && (
            <Text
              style={{
                fontFamily: "Inter_500Medium",
              }}
              className="text-red-500 text-sm mt-1"
            >
              {errors.description}
            </Text>
          )}
        </View>

        {/* Bouton Suivant */}
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary,
          }}
          onPress={handleNext}
          activeOpacity={0.8}
          className="py-3 rounded-lg mt-8"
        >
          <Text
            style={{
              fontFamily: "Inter_400Regular",
            }}
            className="text-white text-center text-base "
          >
            {i18n.t("suivant")}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAwareScrollView>
  );
};

export default Step1;
