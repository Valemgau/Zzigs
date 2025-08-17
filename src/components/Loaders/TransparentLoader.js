import { View, Text } from "react-native";
import React from "react";
import Loader from "./Loader";

export default function TransparentLoader() {
  return (
    <View
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      className="z-30 h-[100vh] w-[100vw] -mt-[30%] absolute flex-1 items-center justify-center"
    >
      <View
        style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
        className="w-12 h-12 rounded items-center justify-center"
      >
        <Loader w />
      </View>
    </View>
  );
}
 