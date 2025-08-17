import { StyleSheet } from "react-native";
import { COLORS } from "./colors";

const BUTTON_CLASS =
  "my-2 bg-blue-500 w-full rounded-md px-5 py-3 flex-row items-center justify-center z-30";

const BUTTON_OUTLINE_CLASS =
  "my-2 bg-gray-100 w-full rounded-md px-5 py-3 flex-row items-center justify-center";
const INPUT_CLASS =
  "bg-white border-b border-gray-300 w-full rounded px-3 py-2 h-[50px] text-lg text-gray-800";
const INPUT_CLASS_BORDER_BOTTOM =
  "bg-gray-100 border-b border-gray-300 w-full rounded px-3 py-2 h-[50px] text-lg text-gray-800";
const INPUT_CLASS_BORDER_BOTTOM_BG_WHITE =
  "bg-white border-b border-gray-300 w-full rounded px-3 py-2 h-[50px] text-lg text-gray-800";
const INPUT_TEXT_AREA_CLASS =
  "bg-gray-100 w-full rounded-md min-h-[100] pt-1 pb-3 px-5 text-lg text-gray-500 rounded-xl";
// "bg-gray-100 w-full rounded-md px-5 pt-2 pb-4 text-base text-gray-500";

const LINEAR_COLOR = ["#1C7EB5", "#3A9BD5"];
const LINEAR_COLOR_GREEN = ["#4cd137", "#27ae60"];

const mySelectStyle = {
  fontFamily: "Inter_400Regular",
  backgroundColor: "#f1f1f1",
  borderBottomWidth: 1,
  borderColor: "#d1d5db",
  width: "100%",
  borderRadius: 5,
  paddingHorizontal: 10,
  paddingVertical: 8,
  height: 50,
  fontSize: 14,
  color: "#4a5568",
};
const DEFAULT_FLATLIST_SCROLLVIEW_BOTTOM_PADDING = 400;

const TEXT_AREA_CLASS =
  "bg-gray-100 border border-gray-300 w-full rounded px-3 py-2 h-[200px] text-sm text-gray-500";

const UPLOAD_PARAMS = {
  aspect: [16, 9],
  quality: 1,
  compress: 1,
  width: 1000,
};

const constants = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    paddingTop: 10,
    paddingBottom: 120,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
  },
  flexBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  flexCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 5,
    width: "97%",
    alignSelf: "center",
  },
  badge: {
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 0,
    borderRadius: 9999,
  },
  btnSecondary: {
    backgroundColor: "white",
    borderColor: COLORS.primary,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 5,
    width: "97%",
    alignSelf: "center",
  },
  textInputWithoutBorder: {
    fontSize: 17,
    paddingHorizontal: 2,
    paddingVertical: 10,
  },
  textInput: {
    fontSize: 15,
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  textAreaInput: {
    fontSize: 15,
    minHeight: 100,
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  textInputBorderBottom: {
    fontSize: 15,
    borderColor: COLORS.primary,
    borderBottomWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 10,
  },
  textInputAuth: {
    fontSize: 15,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,

    borderRadius: 5,
    width: "100%",
  },
});
export {
  constants,
  BUTTON_CLASS,
  TEXT_AREA_CLASS,
  BUTTON_OUTLINE_CLASS,
  mySelectStyle,
  INPUT_CLASS,
  LINEAR_COLOR,LINEAR_COLOR_GREEN,
  INPUT_TEXT_AREA_CLASS,
  UPLOAD_PARAMS,
  INPUT_CLASS_BORDER_BOTTOM,
  DEFAULT_FLATLIST_SCROLLVIEW_BOTTOM_PADDING,
  INPUT_CLASS_BORDER_BOTTOM_BG_WHITE
};
