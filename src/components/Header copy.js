import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";
import { auth } from "../../config/firebase"; // adapte le chemin !

const Header = ({ isClient }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handlePlus = () => {
    navigation.navigate("AddProject");
  };

  const handleMenu = () => {
    navigation.navigate("SettingsScreen");
  };

  return (
    <View
      className="flex-row items-center px-4 bg-gray-200"
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: 8,
        backgroundColor: COLORS.primary,
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Logo + Title */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
       
        <Text
          style={{
            fontFamily: "OpenSans_700Bold",
            fontSize: 24,
            color: "white",
          }}
        >
          ziggs
        </Text>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {auth.currentUser && (
          <>
            {isClient && (
              <Pressable
                onPress={handlePlus}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  marginRight: 8,
                }}
              >
                <MaterialIcons name="add" size={26} color="white" />
              </Pressable>
            )}
            <Pressable
              onPress={handleMenu}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.15)",
              }}
            >
              <MaterialIcons name="menu" size={25} color="white" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
};

export default Header;
