import { View, Text } from "react-native";
import React from "react";
import { TouchableOpacity } from "react-native";
import { FontAwesome, Entypo } from "@expo/vector-icons";
import { COLORS } from "../../styles/colors";
import ButtonLoader from "../Loaders/ButtonLoader";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { LINEAR_COLOR } from "../../styles/constants";
import { Ionicons } from "@expo/vector-icons";



export default function SmallPrimaryButton({ text, onPress, isLoading, outline, disabled }) {
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
          // backgroundColor: outline ? "#fff" : COLORS.primary,
          borderColor: !outline ? "white" : "transparent",
          borderWidth: outline ? 1 : 0,
        }}
        className="z-30 w-full flex-row items-center justify-center rounded-md h-7 px-2"
        colors={outline ? ["#fff", "#fff"] : LINEAR_COLOR}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      >
        {isLoading ? (
          <ButtonLoader outline={outline ? outline : undefined} />
        ) : (
         <>
          <Text
            className={
              outline
                ? "text-sm text-black text-center"
                : "text-sm text-white text-center"
            }
            style={{
              fontFamily: "Inter_500Medium",
              color: !outline ? "white" : COLORS.primary,
            }}
          >
            {text}
          </Text>
          <View className="ml-1">
          <Ionicons
            name="arrow-forward-outline"
            size={15}
            color="white"
          />
        </View>
         </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
