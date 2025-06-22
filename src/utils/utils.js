import { Dimensions, Platform } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export const scale = (size) => {
  const baseWidth = 375; // iPhone X width as base
  const ratio = screenWidth / baseWidth;
  const maxWidth = 400; // Maximum width for web
  if (Platform.OS === "web" && screenWidth > maxWidth) {
    return size * (maxWidth / baseWidth);
  }
  return size * ratio;
};
