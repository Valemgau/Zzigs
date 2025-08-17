import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
// import { BlurView } from "expo-blur"; // No BlurView
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../styles/colors";
import i18n from "../../i18n";

const Header = () => {
  const [count, setCount] = useState(false);
  const navigation = useNavigation();
  const user = auth().currentUser;
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    if (!auth().currentUser) {
      return;
    }
    try {
      const notificationsSnapshot = await firestore()
        .collection("notifications")
        .where("userId", "==", user.uid)
        .get();

      const newNotifications = notificationsSnapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.isNew;
      });

      setCount(newNotifications.length === 1);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des notifications :",
        error
      );
    }
  };

  return (
    <View
      className="flex-row items-center justify-between px-4 pb-3 shadow-md"
      style={{
        paddingTop: insets.top + 12, 
        backgroundColor: COLORS.primary,
        // borderBottomWidth: 1, // Alternative: une bordure subtile
        // borderBottomColor: 'rgba(255, 255, 255, 0.1)', // Bordure blanche transparente
      }}
    >
      {/* Logo et Titre */}
      <View className="flex-row items-center space-x-3">
       
        {/* Utilisation de space-x pour l'espacement */}
        <Image
          source={require("../../assets/logo.png")} 
          className="w-10 h-10 rounded-full" 
          resizeMode="contain" 
        />
        <Text
          style={{ fontFamily: "Inter_700Bold" }} 
          className="text-white text-xl tracking-tight" 
        >{i18n.t("Connect & move")}</Text>
      </View>
      {/* Icônes */}
      {user && (
        <View className="flex-row items-center">
          <Pressable
            onPress={() => navigation.navigate("Notifications")}
            className="relative p-1.5 rounded-full"
            style={({ pressed }) => ({
             
              backgroundColor: pressed ? "rgba(255, 255, 255, 0.1)" : "transparent",
            })}
          >
            <Ionicons name="notifications-outline" size={26} color={COLORS.white} />
            {count > 0 && ( 
              <Animated.View
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
                
                className="absolute top-[2px] right-[2px] w-3 h-3 rounded-full bg-red-500 border border-white flex items-center justify-center"
              >
                {/* Optionnel: Afficher le nombre si < 10 */}
                {/* {count < 10 && (
                  <Text className="text-white text-[8px] font-bold">
                    {count}
                  </Text>
                )} */}
              </Animated.View>
            )}
          </Pressable>
          {/* Vous pourriez ajouter d'autres icônes ici si nécessaire */}
          {/* <Pressable className="p-1.5 ml-2 rounded-full" style={({ pressed }) => ({ backgroundColor: pressed ? 'rgba(255, 255, 255, 0.1)' : 'transparent' })}>
            <Ionicons name="person-circle-outline" size={28} color={COLORS.white} />
          </Pressable> */}
        </View>
      )}
    </View>
  );
};


export default Header;
