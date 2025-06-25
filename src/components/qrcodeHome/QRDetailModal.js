import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Svg, { Path } from "react-native-svg";
import { scale } from "../../utils/utils";

const { width } = Dimensions.get("window");
const isMobile = width < 768;

const QRDetailModal = ({
  visible,
  selectedQR,
  onClose,
  onShare,
  onOpenURL,
  onDelete,
  qrCodeRef,
}) => {
  if (!selectedQR) return null;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <Modal
      animationType={Platform.OS === "web" ? "fade" : "slide"}
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Svg
                width={scale(24)}
                height={scale(24)}
                viewBox="0 0 24 24"
                fill="none"
              >
                <Path
                  d="M15 18L9 12L15 6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedQR.title}</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalDetails}>
            <View style={styles.qrPreviewLarge}>
              <QRCode
                value={selectedQR.qr_data || selectedQR.url}
                size={scale(200)}
                color="#000000"
                backgroundColor="#ffffff"
                getRef={qrCodeRef}
              />
            </View>
            <Text style={styles.modalUrl} numberOfLines={2}>
              {selectedQR.url}
            </Text>
            <Text style={styles.modalDate}>
              {formatDate(selectedQR.created_at)}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={() => onOpenURL(selectedQR.url)}
              >
                <Svg
                  width={scale(24)}
                  height={scale(24)}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <Path
                    d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14"
                    stroke="#7ed321"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.modalActionText}>Open</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={() => onShare(selectedQR)}
              >
                <Svg
                  width={scale(24)}
                  height={scale(24)}
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
                <Text style={styles.modalActionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={() => onDelete(selectedQR.id)}
              >
                <Svg
                  width={scale(24)}
                  height={scale(24)}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <Path
                    d="M10 11V17"
                    stroke="#ff4757"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M14 11V17"
                    stroke="#ff4757"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M4 7H20"
                    stroke="#ff4757"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M6 7H12H18V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V7Z"
                    stroke="#ff4757"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"
                    stroke="#ff4757"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.modalActionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: scale(20),
  },
  modalContent: {
    backgroundColor: "#1e1e1e",
    padding: scale(20),
    borderRadius: scale(12),
    width: isMobile ? "90%" : scale(400),
    maxWidth: 500,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: scale(15),
  },
  backButton: {
    padding: scale(8),
  },
  modalTitle: {
    fontSize: scale(20),
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: scale(32),
  },
  modalDetails: {
    width: "100%",
    alignItems: "center",
  },
  qrPreviewLarge: {
    marginBottom: scale(20),
    backgroundColor: "#fff",
    padding: scale(12),
    borderRadius: scale(8),
  },
  modalUrl: {
    fontSize: scale(14),
    color: "#b0b0b0",
    marginBottom: scale(10),
    textAlign: "center",
    lineHeight: scale(18),
  },
  modalDate: {
    fontSize: scale(12),
    color: "#7ed321",
    marginBottom: scale(20),
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: scale(10),
  },
  modalActionButton: {
    alignItems: "center",
    padding: scale(10),
    borderRadius: scale(8),
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  modalActionText: {
    color: "#fff",
    fontSize: scale(14),
    marginTop: scale(6),
    fontWeight: "500",
  },
});

export default QRDetailModal;
