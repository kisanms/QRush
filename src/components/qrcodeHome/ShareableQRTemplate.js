import React, { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import ViewShot from "react-native-view-shot";
import { scale } from "../../utils/utils";

const ShareableQRTemplate = forwardRef(({ qrCode, qrCodeValue }, ref) => {
  return (
    <ViewShot ref={ref} options={{ format: "png", quality: 1.0 }}>
      <View style={styles.shareTemplate}>
        <View style={styles.shareHeader}>
          <Text style={styles.shareAppName}>QRush</Text>
          <Text style={styles.shareSubtitle}>Quick & Easy QR Codes</Text>
        </View>
        <View style={styles.shareQRSection}>
          <View style={styles.shareQRContainer}>
            <QRCode
              value={qrCodeValue || qrCode.url}
              size={200}
              color="#000000"
              backgroundColor="#ffffff"
            />
          </View>
          <Text style={styles.shareQRTitle} numberOfLines={2}>
            {qrCode.title}
          </Text>
        </View>
        <View style={styles.shareUrlSection}>
          <Text style={styles.shareUrlLabel}>Scan to visit:</Text>
          <Text style={styles.shareUrl} numberOfLines={3}>
            {qrCode.url}
          </Text>
        </View>
        <View style={styles.shareFooter}>
          <Text style={styles.shareFooterText}>
            Generated with QRush • {new Date().toLocaleDateString()}
          </Text>
        </View>
      </View>
    </ViewShot>
  );
});

const styles = StyleSheet.create({
  shareTemplate: {
    width: 400,
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  shareHeader: {
    backgroundColor: "#7ed321",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  shareAppName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  shareSubtitle: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
  },
  shareQRSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  shareQRContainer: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 15,
  },
  shareQRTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    lineHeight: 24,
  },
  shareUrlSection: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  shareUrlLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  shareUrl: {
    fontSize: 14,
    color: "#7ed321",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  shareFooter: {
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  shareFooterText: {
    fontSize: 10,
    color: "#999999",
  },
});

export default ShareableQRTemplate;
