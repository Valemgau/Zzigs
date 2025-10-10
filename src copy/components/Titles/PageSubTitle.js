import React from "react";
import { Text } from "react-native";

export default function PageSubTitle({ title, color }) {
  return (
    <Text className="text-base" style={{ fontFamily: "Inter_500Medium", color:color &&color }}>
      {title}
    </Text>
  );
}
