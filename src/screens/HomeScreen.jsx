import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  FlatList,
  RefreshControl,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { scale } from "../utils/utils";
import { supabase } from "../../supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";

import QRCard from "../components/qrcodeHome/QRCard";
import QRDetailModal from "../components/qrcodeHome/QRDetailModal";
import ShareableQRTemplate from "../components/qrcodeHome/ShareableQRTemplate";
import { useQRSharing } from "../hooks/useQRSharing";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isMobile = width < 768;

export default function HomeScreen() {
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const scaleAnim = useSharedValue(1);
  const qrCodeRef = useRef(null);
  const navigation = useNavigation();

  const { selectedQRForSharing, shareTemplateRef, handleShare } = useQRSharing(showToast);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
  };

  useEffect(() => {
    getUserInfo();
    fetchQRCodes();
  }, []);

  const getUserInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        await AsyncStorage.setItem("userSession", JSON.stringify(session));
      } else {
        const storedSession = await AsyncStorage.getItem("userSession");
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession.user?.email) {
            setUserEmail(parsedSession.user.email);
          }
        }
      }
    } catch (error) {
      console.error("Error getting user info:", error);
      showToast("error", "Error", "Failed to load user info");
    }
  };

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQrCodes(data || []);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      showToast("error", "Error", "Failed to load QR codes");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQRCodes();
    setRefreshing(false);
  };

  function showToast(type, title, message) {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: "top",
      visibilityTime: 4000,
    });
  }

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to logout?");
      if (confirmed) performLogout();
    } else {
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Logout", style: "destructive", onPress: performLogout },
        ]
      );
    }
  };

  const performLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await AsyncStorage.removeItem("userSession");
      showToast("success", "Success", "Logged out successfully!");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error during logout:", error);
      showToast("error", "Error", "An unexpected error occurred during logout");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = () => {
    navigation.navigate("Add QR Code");
  };

  const handleCardPress = (qrCode) => {
    setSelectedQR(qrCode);
    setDetailModalVisible(true);
  };

  const handleOpenURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error("Unsupported URL");
      if (Platform.OS === "web") {
        window.open(url, "_blank");
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Error opening URL:", error);
      showToast("error", "Error", "Failed to open URL");
    }
  };

  const handleDelete = async (qrCodeId) => {
    const performDelete = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) throw new Error("No user session found");

        const { error } = await supabase
          .from("qr_codes")
          .delete()
          .eq("id", qrCodeId)
          .eq("user_id", session.user.id);

        if (error) throw error;
        showToast("success", "Deleted", "QR code deleted successfully");
        await fetchQRCodes();
        setDetailModalVisible(false);
      } catch (error) {
        console.error("Error deleting QR code:", error);
        showToast("error", "Error", `Failed to delete QR code: ${error.message}`);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to delete this QR code?");
      if (confirmed) await performDelete();
    } else {
      Alert.alert(
        "Delete QR Code",
        "Are you sure you want to delete this QR code?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: performDelete },
        ]
      );
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const renderHeader = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Svg width={scale(50)} height={scale(50)} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="#7ed321"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <TouchableOpacity
          style={[styles.logoutButton, loading && styles.buttonDisabled]}
          onPress={handleLogout}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Animated.View style={animatedButtonStyle}>
            <Svg
              width={scale(20)}
              height={scale(20)}
              viewBox="0 0 24 24"
              fill="none"
              style={styles.logoutIcon}
            >
              <Path
                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M16 17L21 12L16 7"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M21 12H9"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.logoutButtonText}>{loading ? "Logging out..." : "Logout"}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeSection}>
        <Text style={styles.title}>Welcome to QRush!</Text>
        {userEmail ? <Text style={styles.userEmail}>Hello, {userEmail}</Text> : null}
      </View>

      <TouchableOpacity style={styles.qrButton} onPress={handleGenerateQR} activeOpacity={0.8}>
        <View style={styles.qrButtonContent}>
          <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none" style={styles.qrIcon}>
            <Path
              d="M12 5V19M5 12H19"
              stroke="#000000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.qrButtonText}>Generate New QR Code</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.qrCodesSection}>
        <Text style={styles.sectionTitle}>Your QR Codes</Text>
      </View>
    </View>
  );

  const renderQRCard = ({ item }) => (
    <QRCard
      qrCode={item}
      onPress={handleCardPress}
      onShare={handleShare}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Svg width={scale(80)} height={scale(80)} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 7V5C3 3.89543 3.89543 3 5 3H7"
          stroke="#7ed321"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <Path
          d="M17 3H19C20.1046 3 21 3.89543 21 5V7"
          stroke="#7ed321"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <Path
          d="M3 17V19C3 20.1046 3.89543 21 5 21H7"
          stroke="#7ed321"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <Path
          d="M17 21H19C20.1046 21 21 20.1046 21 19V17"
          stroke="#7ed321"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </Svg>
      <Text style={styles.emptyText}>No QR codes yet. Generate one!</Text>
    </View>
  );

  return (
    <LinearGradient colors={["#121212", "#1e1e1e", "#121212"]} style={styles.container}>
      <FlatList
        data={qrCodes}
        renderItem={renderQRCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.qrList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />

      <QRDetailModal
        visible={detailModalVisible}
        selectedQR={selectedQR}
        onClose={() => setDetailModalVisible(false)}
        onShare={handleShare}
        onOpenURL={handleOpenURL}
        onDelete={handleDelete}
        qrCodeRef={qrCodeRef}
      />

      {selectedQRForSharing && (
        <View style={{ opacity: 0, position: "absolute" }}>
          <ShareableQRTemplate
            ref={shareTemplateRef}
            qrCode={selectedQRForSharing}
            qrCodeValue={selectedQRForSharing.qr_data || selectedQRForSharing.url}
          />
        </View>
      )}

      <Toast />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: scale(20),
    paddingBottom: scale(10),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(20),
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: scale(10),
    borderRadius: scale(8),
    backgroundColor: "#ff4757",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  logoutIcon: {
    marginRight: scale(8),
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "600",
  },
  welcomeSection: {
    marginBottom: scale(20),
    alignItems: "center",
  },
  title: {
    fontSize: scale(26),
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1,
  },
  userEmail: {
    fontSize: scale(16),
    color: "#b0b0b0",
    marginTop: scale(8),
    fontStyle: "italic",
  },
  qrButton: {
    backgroundColor: "#7ed321",
    padding: scale(15),
    borderRadius: scale(12),
    marginBottom: scale(20),
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  qrButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  qrIcon: {
    marginRight: scale(10),
  },
  qrButtonText: {
    color: "#000",
    fontSize: scale(16),
    fontWeight: "600",
  },
  qrCodesSection: {
    marginBottom: scale(15),
  },
  sectionTitle: {
    fontSize: scale(20),
    color: "#fff",
    fontWeight: "700",
    marginBottom: scale(15),
  },
  emptyState: {
    alignItems: "center",
    marginTop: scale(30),
    padding: scale(20),
  },
  emptyText: {
    color: "#b0b0b0",
    fontSize: scale(16),
    marginTop: scale(15),
    textAlign: "center",
  },
  qrList: {
    paddingBottom: scale(20),
  },
});