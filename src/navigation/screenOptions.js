import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const getScreenOptions = ({ isDarkMode = false, icon = "arrow-back" } = {}) => {
  return ({ navigation, route }) => {
    // Check si la page actuelle est ReferralPage
    const isReferralPage = route.name === "ReferralPage";

    const handlePress = () => {
      if (isReferralPage) {
        navigation.goBack();
        navigation.reset({
          index: 0,
          routes: [{ name: "Activités", params: { screen: "Home" } }],
        });
      } else {
        navigation.goBack();
      }
    };

    return {
      headerBackTitle: "Retour",
      headerStyle: {
        backgroundColor: isDarkMode ? "#16181C" : "white",
      },
      headerTintColor: isDarkMode ? "white" : "black",
      headerTitleStyle: {
        fontSize: 15,
        fontFamily: "Inter_500Medium",
      },
      headerLeft: () => (
        <TouchableOpacity onPress={handlePress}>
          <Ionicons name={icon} size={24} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
      ),
    };
  };
};
