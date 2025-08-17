// InfoCard.js (ou à placer où vous préférez)
import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons'; // Assurez-vous d'avoir importé Ionicons

// Définition des polices (si vous ne les avez pas déjà configurées dans Tailwind)
const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
};

// Props attendues:
// - isVisible: boolean (pour contrôler l'affichage et l'animation)
// - iconSource: require(...)
// - iconBgClass: string (ex: "bg-emerald-100 dark:bg-emerald-900")
// - iconTintClass: string (ex: "tint-emerald-600 dark:tint-emerald-400") // Pour teinter l'icône si besoin
// - iconSizeClass: string (ex: "w-10 h-10")
// - cardBgClass: string (ex: "bg-emerald-100 dark:bg-gray-800")
// - title: string (optionnel)
// - titleClass: string (optionnel, ex: "text-gray-900 dark:text-white text-lg")
// - description: string
// - descriptionClass: string (ex: "text-gray-600 dark:text-gray-300")
// - buttonText: string
// - buttonBgClass: string (ex: "bg-emerald-500 dark:bg-orange-600")
// - buttonTextColorClass: string (ex: "text-white")
// - onButtonPress: function
// - onClosePress: function (optionnel, pour le X)
// - borderClass: string (optionnel, ex: "border border-gray-100 dark:border-gray-700")

const InfoCard = ({
  isVisible,
  iconSource,
  iconBgClass = "p-3 rounded-full mr-4", // Default padding/margin
  iconTintClass,
  iconSizeClass = "w-12 h-12", // Standardized size
  cardBgClass,
  title,
  titleClass = "text-gray-900 dark:text-white text-lg mb-1", // Default title style
  description,
  descriptionClass = "text-gray-600 dark:text-gray-300 mb-3", // Default description style
  buttonText,
  buttonBgClass,
  buttonTextColorClass = "text-white", // Default button text color
  onButtonPress,
  onClosePress,
  borderClass = "", // Default no border
}) => {
  if (!isVisible) {
    return null; // Ne rend rien si ce n'est pas visible
  }

  return (
  <Animated.View
  entering={FadeIn.duration(200)}
  exiting={FadeOut.duration(150)}
  className={`
    p-5 rounded-2xl flex-row items-start mb-4 
    ${cardBgClass} ${borderClass} shadow-lg
  `}
  style={{
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5, // Android
  }}
>
  {/* Icône cercle avec légère ombre */}
  <View
    className={`${iconBgClass} mr-4 items-center justify-center rounded-full shadow-sm`}
    style={{
      width: 48,
      height: 48,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    }}
  >
    <Image
      className={`${iconSizeClass} ${iconTintClass ?? ""}`}
      source={iconSource}
      resizeMode="contain"
    />
  </View>

  {/* Contenu */}
  <View className="flex-1">
    <View className="flex-row items-start justify-between">
      {/* Titre */}
      {title && (
        <Text
          style={{ fontFamily: "Inter_600SemiBold" }}
          className={`flex-1 text-lg ${titleClass}`}
        >
          {title}
        </Text>
      )}
      {/* Bouton fermer */}
      {onClosePress && (
        <Pressable
          onPress={onClosePress}
          hitSlop={10}
          className="ml-2 p-1 rounded-full hover:opacity-80"
        >
          <Ionicons
            name="close-outline"
            size={22}
            className="text-gray-500 dark:text-gray-400"
          />
        </Pressable>
      )}
    </View>

    {/* Description */}
    {description && (
      <Text
        style={{ fontFamily: "Inter_400Regular" }}
        className={`mt-1 leading-5 text-gray-600 dark:text-gray-300 ${descriptionClass}`}
      >
        {description}
      </Text>
    )}

    {/* Bouton */}
    {onButtonPress && (
      <Pressable
        onPress={onButtonPress}
        className={`mt-3 py-2 px-4 rounded-full self-start ${buttonBgClass}`}
      >
        <Text
          style={{ fontFamily: "Inter_500Medium" }}
          className={`text-sm ${buttonTextColorClass}`}
        >
          {buttonText}
        </Text>
      </Pressable>
    )}
  </View>
</Animated.View>

  );
};

export default InfoCard;
