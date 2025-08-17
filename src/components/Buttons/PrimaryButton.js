import { View, Text } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import { FontAwesome, Entypo } from "@expo/vector-icons";
import { COLORS } from "../../styles/colors";
import ButtonLoader from "../Loaders/ButtonLoader";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { LINEAR_COLOR, LINEAR_COLOR_GREEN } from "../../styles/constants";

export default function PrimaryButton({ text, onPress, isLoading, outline, disabled, green }) {
  return (
    <TouchableOpacity
      className="w-full"
      disabled={isLoading || disabled}
      activeOpacity={0.5}
      onPress={() => {
        onPress();
      }}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <LinearGradient
        style={{
          borderColor: !outline ? "white" :  COLORS.primary,
          borderWidth: outline ? 1 : 0,
        }}
        className="z-30 w-full items-center justify-center rounded-md h-12 px-4"
        colors={outline ? ["#fff", "#fff"] : green ? LINEAR_COLOR_GREEN:LINEAR_COLOR}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      >
        {isLoading ? (
          <ButtonLoader outline={outline ? outline : undefined} />
        ) : (
          <Text
            className={
              outline
                ? "text-lg text-black text-center"
                : "text-lg text-white text-center"
            }
            style={{
              fontFamily: "Inter_500Medium",
              color: !outline ? "white" : COLORS.primary,
            }}
          >
            {text}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
