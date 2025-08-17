import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Icon({
  onPress,
  icon,
  w,
  color,
  square,
  squareR,
  bgColor,
  bgNone,
}) {
  return (
    <TouchableOpacity
      style={{
        height: w && (w * w) / 10,
        width: w && (w * w) / 10,
        borderRadius: square ? 5 : w && (w * w) / 10 / 2,
        borderTopRightRadius: squareR && 9999,
        borderBottomRightRadius: squareR && 9999,
        backgroundColor: bgNone
          ? "transparent"
          : bgColor
          ? bgColor
          : "rgb(243 244 246)",
      }}
      activeOpacity={0.5}
      className="items-center justify-center"
      onPress={() => {
        //
        onPress && onPress();
      }}
    >
      <Ionicons
        name={`${icon}`}
        size={w ? w * 1.2 : 24}
        color={color ? color : "black"}
      />
    </TouchableOpacity>
  );
}
