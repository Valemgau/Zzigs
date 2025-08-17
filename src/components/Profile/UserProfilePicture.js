import { View, Image } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../styles/colors";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export default function UserProfilePicture({
  w,
  showVerified,
  verified,
  photoUrl,
}) {
  const default_size = 50;
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View
        className="z-20 items-center justify-center"
        style={{
          height: w ? w + 5 : default_size + 5,
          width: w ? w + 5 : default_size + 5,
          borderRadius: w ? w + 5 : default_size + 5 / 2,
          borderColor: "white",
          borderWidth: 0,
          backgroundColor: "white",
        }}
      >
        {/* absolute icon view */}
        {verified && (
          <View
            activeOpacity={0.5}
            className={`absolute top-0 right-0 bg-white rounded-full z-20 self-center`}
          >
            <Ionicons
              name={"checkmark-done-circle"}
              size={w ? w / 3 : 15}
              color={COLORS.green}
            />
          </View>
        )}
        {/* conditional image */}
        {!photoUrl || photoUrl == "" || photoUrl == undefined ? (
          <Image
            style={{
              height: w ? w : default_size,
              width: w ? w : default_size,
              borderRadius: w ? w : default_size / 2,
            }}
            source={require("../../../assets/img/user.png")}
            resizeMode={"cover"}
          />
        ) : (
          <Image
            style={{
              height: w ? w : default_size,
              width: w ? w : default_size,
              borderRadius: w ? w : default_size / 2,
            }}
            source={{
              uri: photoUrl,
            }}
            resizeMode={"cover"}
          />
        )}
      </View>
    </Animated.View>
  );
}
