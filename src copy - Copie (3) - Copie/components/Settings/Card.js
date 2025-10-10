import React from "react";
import { Pressable, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export default function SettingsCard({
  color,
  title,
  red,
  green,
  iconName,
  onPress,
}) {
  return (
    <TouchableOpacity
      entering={FadeIn}
      exiting={FadeOut}
      onPress={onPress}
      activeOpacity={0.5}
      className="my-1 p-2  flex-row rounded items-center w-full border-b border-gray-200"
    >
      {/* left icon */}
      <View
        className={`mr-5 ${
          green ? "bg-green-100" : red ? "bg-red-100" : "bg-gray-100"
        } w-9 h-9 rounded items-center justify-center`}
      >
        <Ionicons
          name={iconName}
          size={18}
          color={green ? "green" : color ? color : red ? "red" : "black"}
        />
      </View>
      {/* title */}
      <View className="flex-1">
        <Text
          className="text-base text-black"
          style={{
            fontFamily: "Inter_300Light",
            color: green ? "green" : red ? "red" : "black",
          }}
        >
          {title}
        </Text>
      </View>
      {/* right icon */}
      <View className="w-1/6 items-end">
        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color={green ? "green" : red ? "red" : "black"}
        />
      </View>
    </TouchableOpacity>
  );
}
