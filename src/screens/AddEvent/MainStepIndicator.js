import React, { useLayoutEffect, useState } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import StepIndicator from "react-native-step-indicator";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
// Importez les composants pour chaque étape
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import Step5 from "./Step5";
import { COLORS } from "../../styles/colors";
import * as Progress from "react-native-progress";
import Step6 from "./Step6";
import i18n from "../../../i18n";

const customStyles = {
  stepIndicatorSize: 0,
  currentStepIndicatorSize: 0,
  separatorStrokeWidth: 0,
  currentStepStrokeWidth: 0,
  stepStrokeWidth: 0,
  stepIndicatorFinishedColor: "transparent",
  stepIndicatorUnFinishedColor: "transparent",
  stepIndicatorCurrentColor: "transparent",
  stepIndicatorLabelFontSize: 0,
  currentStepIndicatorLabelFontSize: 0,
  separatorFinishedColor: "transparent",
  separatorUnFinishedColor: "transparent",
  labelColor: "transparent",
  labelSize: 0,
  currentStepLabelColor: "transparent",
};

const MainStepIndicator = ({ navigation, route }) => {
  const { userSUB } = route.params;
  const [currentPosition, setCurrentPosition] = useState(0);
  const totalSteps = 5;
  const progress = currentPosition / (totalSteps - 1);

  const [formData, setFormData] = useState({
    price: 0,
    title: "",
    description: "",
    maxParticipants: 0,
    participants: [],
    date: "",
    time: "",
    endPointName: "",
    categoryId: "",
    location: "",
    images: [],
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Nouvel evènement",
      headerLeft: () =>
        currentPosition > 0 && (
          <Pressable
            activeOpacity={0.8}
            onPress={() => setCurrentPosition(currentPosition - 1)}
            className="flex-row items-center justify-center px-2 py-1 rounded-full"
          >
            <Ionicons name="chevron-back" size={20} color="#EF4444" />
            <Text
              className="text-red-500 text-base"
              style={{ fontFamily: "Inter_400Regular" }}
            >
              {i18n.t("retour")}
            </Text>
          </Pressable>
        ),
      // headerRight: () =>
      //   currentPosition < totalSteps - 1 && (
      //     <Pressable
      //       activeOpacity={0.8}
      //       onPress={onNext}
      //       className="flex-row items-center justify-center px-2 py-1 rounded-full"
      //     >
      //       <Text
      //         className="text-green-500 text-base"
      //         style={{ fontFamily: "Inter_400Regular" }}
      //       >
      //         Continuer
      //       </Text>
      //     </Pressable>
      //   ),
    });
  }, [currentPosition]);

  // Fonction pour passer à l'étape suivante et sauvegarder les données
  const onNext = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentPosition((prev) => prev + 1);
  };

  // Fonction pour revenir à l'étape précédente (si nécessaire)
  const onPrevious = () => {
    setCurrentPosition((prev) => (prev > 1 ? prev - 1 : prev));
  };

  // Fonction pour terminer et afficher les données
  const onComplete = () => {
    setCurrentPosition(0);
    navigation.jumpTo("Activités");
  };

  // Gérer le contenu des étapes
  const renderStepContent = () => {
    switch (currentPosition) {
      case 0:
        return <Step1 userSUB={userSUB} onNext={onNext} />;
      case 1:
        return <Step2 onNext={onNext} onPrevious={onPrevious} />;
      case 2:
        return <Step3 onNext={onNext} onPrevious={onPrevious} />;
      case 3:
        return <Step4 onNext={onNext} onPrevious={onPrevious} />;
      case 4:
        return (
          <Step5
            userSUB={userSUB}
            previousData={formData}
            onComplete={onComplete}
            onPrevious={onPrevious}
          />
        );

      default:
        return <Step1 />;
    }
  };

  return (
    <View className="bg-white dark:bg-gray-900" style={{ flex: 1 }}>
      {/* Barre de progression */}
      <Progress.Bar
        progress={progress}
        width={null}
        height={5}
        color={COLORS.primary}
        unfilledColor="white"
        borderWidth={0}
        borderRadius={0}
      />
      {/* StepIndicator pour la logique */}
      <StepIndicator
        customStyles={customStyles}
        currentPosition={currentPosition}
        stepCount={totalSteps}
        onPress={(position) => setCurrentPosition(position)} // Gestion des clics
      />

      {/* Contenu de l'étape */}
      <View className="" style={{ flex: 1 }}>
        {renderStepContent()}
      </View>
    </View>
  );
};

export default MainStepIndicator;
