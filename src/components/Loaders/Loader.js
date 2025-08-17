import { View, Text, ActivityIndicator, Platform } from "react-native";
import React, { useRef } from "react";
import { COLORS } from "../../styles/colors";


export default function Loader({ w, color }) {
  return (
    <View>
      <ActivityIndicator
        color={w ? "white" : color ? color : COLORS.primary}
        size={"small"}
      />
    </View>
  );
}
