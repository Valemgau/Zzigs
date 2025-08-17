import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BackButton({ onPress, x, w, text, color, next }) {
  return (
    <TouchableOpacity
      className={`flex-row items-center`}
      onPress={onPress}
    >
      {text ? (
        <Text
          style={{ fontFamily: "Inter_500Medium", color: color && color }}
          className="text-sm"
        >
          {text}
        </Text>
      ) : (
        <Ionicons
          name={x ? "close-outline" : "chevron-back-outline"}
          size={30}
          color={w ? "white" : "black"}
        />
      )}
    </TouchableOpacity>
  );
}
