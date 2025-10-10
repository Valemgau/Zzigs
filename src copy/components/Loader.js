import { View, Animated, Easing, Text } from "react-native";
import React, { useEffect, useRef } from "react";
import { COLORS } from "../styles/colors";

export default function Loader() {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateAnim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateAnim.start();

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    pulseAnim.start();

    return () => {
      rotateAnim.stop();
      pulseAnim.stop();
    };
  }, [rotation, pulse]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const scaleInterpolate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.16],
  });

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Animated.View
        style={{
          width: 86,
          height: 86,
          borderRadius: 43,
          backgroundColor: "#F3F4F6",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 18,
          shadowOpacity: 0.12,
          elevation: 6,
          transform: [{ scale: scaleInterpolate }],
        }}
      >
        <Animated.Image
          source={require("../../assets/logo.png")}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            transform: [{ rotate: rotateInterpolate }],
          }}
        />
      </Animated.View>
      <Text
        style={{
          fontFamily: "OpenSans_700Bold",
          color: COLORS.primary,
          fontSize: 16,
          letterSpacing: 1,
        }}
      >
        Chargement...
      </Text>
    </View>
  );
}
