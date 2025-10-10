import { View, Text, ActivityIndicator } from "react-native";
import React, { useRef } from "react";
import { COLORS } from "../../styles/colors";

export default function ButtonLoader({ outline }) {
  return (
    <View>
      <ActivityIndicator
        color={outline ? COLORS.primary : "white"}
        size={"small"}
      />
    </View>
  );
}
