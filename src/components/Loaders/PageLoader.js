import { View, ActivityIndicator } from "react-native";
import { COLORS } from "../../styles/colors";

export default function PageLoader() {
  return (
    <View className="flex-1 bg-transparent items-center justify-center">
      <ActivityIndicator color={COLORS.primary} size={"small"} />
    </View>
  );
}
