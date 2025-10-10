import { TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../styles/colors";

export const getScreenOptions = ({
  isDarkMode = false,
  icon = "arrow-back",
} = {}) => {
  return ({ navigation, route }) => {
    return {
      headerBackTitle: "Retour",
      headerStyle: {
        backgroundColor: "#fff",
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
      },
      headerTintColor: COLORS.primary,
      headerTitleStyle: {
        fontSize: 17,
        fontFamily: "OpenSans_600SemiBold",
        color: "#111827",
      },
      headerLeft: () => (
        <TouchableOpacity
          className="ml-4 mb-2 w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: COLORS.primary + "15" }}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.replace("Home");
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons
            name={icon}
            size={22}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      ),
    };
  };
};
