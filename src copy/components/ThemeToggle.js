import React from "react";
import { View, Text, Switch, Pressable } from "react-native";
import { useColorScheme } from "nativewind";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import i18n from "../../i18n";

const ThemeToggle = () => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <Pressable
      onPress={toggleColorScheme}
      className="rounded-t-lg -mb-4 flex-row items-center justify-between p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    >
      <View className="px-2 py-4 flex-row items-center">
        <View
          style={{
            backgroundColor: isDarkMode ? "#222f3e" : "#f1f1f1",
          }}
          className="w-10 h-10 rounded items-center justify-center"
        >
          <Ionicons
            name={isDarkMode ? "moon-outline" : "sunny-outline"}
            size={24}
            color="#ff9f43"
          />
        </View>
        <Text
          style={{ fontFamily: "OpenSans_400Regular" }}
          className="ml-3 text-gray-600 text-base dark:text-gray-300"
        >{i18n.t("theme_sombre")}</Text>
      </View>
      <Switch
        value={isDarkMode}
        onValueChange={toggleColorScheme}
        trackColor={{ false: "#767577", true: "#f4f3f4" }}
        thumbColor={isDarkMode ? "#ff9f43" : "#f4f3f4"}
      />
    </Pressable>
  );
};

export default ThemeToggle;
