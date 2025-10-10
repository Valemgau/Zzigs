import React from "react";
import { Text } from "react-native";

export default function PageTitle({ title,w }) {
  return (
    <Text className="text-xl" style={{ color:w && "white", fontFamily: "Inter_500Medium" }}>
      {title}
    </Text>
  );
}
