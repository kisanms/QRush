import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import Svg, { Path } from "react-native-svg";
import { scale } from "../../utils/utils";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isMobile = width < 768;

const QRCard = ({ qrCode, onPress, onShare }) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <TouchableOpacity
      style={[styles.qrCard, isWeb && !isMobile && styles.qrCardWeb]}
      onPress={() => onPress(qrCode)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={["#2a2a2a", "#1a1a1a"]}
        style={styles.cardGradient}
      >
        <View style={styles.qrPreview}>
          <QRCode
            value={qrCode.qr_data || qrCode.url}
            size={scale(isWeb && !isMobile ? 120 : 100)}
            color="#000000"
            backgroundColor="#ffffff"
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {qrCode.title}
          </Text>
          <Text
            style={styles.cardUrl}
            numberOfLines={isWeb && !isMobile ? 2 : 1}
          >
            {qrCode.url}
          </Text>
          <Text style={styles.cardDate}>{formatDate(qrCode.created_at)}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare(qrCode)}
          >
            <Svg
              width={scale(20)}
              height={scale(20)}
              viewBox="0 0 24 24"
              fill="none"
            >
              <Path
                d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.18147 15.0136 5.35985 15.0398 5.53427L8.96173 9.57275C8.41307 9.22794 7.73026 9 7 9C5.34315 9 4 10.3431 4 12C4 13.6569 5.34315 15 7 15C7.73026 15 8.41307 14.7721 8.96173 14.4272L15.0398 18.4657C15.0136 18.6402 15 18.8185 15 19C15 20.6569 16.3431 22 18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C17.2697 16 16.5869 16.2279 16.0383 16.5728L9.96024 12.5343C9.98639 12.3598 10 12.1815 10 12C10 11.8185 9.98639 11.6402 9.96024 11.4657L16.0383 7.42725C16.5869 7.77206 17.2697 8 18 8Z"
                stroke="#7ed321"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  qrCard: {
    width: isMobile ? scale(160) : scale(200),
    margin: scale(10),
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  qrCardWeb: {
    width: isWeb ? "48%" : scale(200),
    maxWidth: 300,
    minWidth: 250,
  },
  cardGradient: {
    padding: scale(12),
  },
  qrPreview: {
    alignItems: "center",
    marginBottom: scale(12),
    backgroundColor: "#fff",
    padding: scale(8),
    borderRadius: scale(8),
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: scale(16),
    color: "#fff",
    fontWeight: "600",
    marginBottom: scale(6),
    lineHeight: scale(20),
  },
  cardUrl: {
    fontSize: scale(12),
    color: "#b0b0b0",
    marginBottom: scale(6),
  },
  cardDate: {
    fontSize: scale(12),
    color: "#7ed321",
  },
  cardActions: {
    alignItems: "flex-end",
  },
  actionButton: {
    padding: scale(8),
  },
});

export default QRCard;
