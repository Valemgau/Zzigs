import React from "react";
import {
  View,
  Dimensions,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

const { width } = Dimensions.get("window");

const ImageSlider = ({ images }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <View style={{ width: width, height: width * 0.3 }}>
      <Carousel
        width={width}
        height={width * 0.3}
        data={images}
        renderItem={({ item }) => (
          <Animated.View
            entering={FadeInUp.duration(400)}
            className="flex-1 bg-white dark:bg-gray-900"
          >
            <Image
              className=""
              source={{ uri: item }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              PlaceholderContent={<ActivityIndicator />}
              onError={(e) =>
                console.error("Image loading error:", e.nativeEvent.error)
              }
            />
          </Animated.View>
        )}
        loop
        autoPlay={images.length > 1}
        autoPlayInterval={2500}
        onSnapToItem={(index) => setActiveIndex(index)}
      />
      {/* <View style={styles.blurViewContainer}>
        <BlurView intensity={20} tint="dark" style={styles.paginationContainer}>
          <View style={styles.pagination}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === activeIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </BlurView>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  blurViewContainer: {
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  paginationContainer: {
    borderRadius: 3,
    overflow: "hidden",
    width: "10%",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 4,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#FFFFFF",
  },
});

export default ImageSlider;
