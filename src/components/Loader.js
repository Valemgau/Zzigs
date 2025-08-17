import { View, Text, ActivityIndicator } from "react-native";
import React, { useRef } from "react";
import { COLORS } from "../styles/colors";


export default function Loader() {
  return (
    <View className="flex-1 bg-white items-center justify-center -mt-[40%]">
    <ActivityIndicator color={COLORS.primary} size={"small"} />
    </View>
  );
}
