import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { scale } from "../utils/utils";
import { supabase } from "../utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";

import QRCard from "../components/qrcodeHome/QRCard";
import QRDetailModal from "../components/qrcodeHome/QRDetailModal";
import ShareableQRTemplate from "../components/qrcodeHome/ShareableQRTemplate";
import { useQRSharing } from "../hooks/useQRSharing";

const { width, height } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isMobile = width < 768;

// Responsive column calculation
const getColumns = () => {
  if (isWeb) return 5;  // 5 cards per row on web
  return 2;  // 2 cards per row on mobile
};

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
    <View style={styles.headerContainer}>
      {/* Top Navigation Bar */}
      <View style={styles.topNavBar}>
        <View style={styles.logoSection}>
          <Svg width={scale(40)} height={scale(40)} viewBox="0 -5 24 24" fill="none">
            <Path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="#7ed321"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.logoText}>QRush</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.logoutButton, loading && styles.buttonDisabled]}
            onPress={handleLogout}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Animated.View style={[animatedButtonStyle, styles.logoutButtonContent]}>
              <Svg
                width={scale(18)}
                height={scale(18)}
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
              <Text style={styles.logoutButtonText}>
                {loading ? "Logging out..." : "Logout"}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          {userEmail && (
            <Text style={styles.userEmailText}>
              Hello, {userEmail.split('@')[0]}
            </Text>
          )}
          <Text style={styles.subtitle}>
            Manage your QR codes with ease
          </Text>
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateQR}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
        >
          <Animated.View style={[animatedButtonStyle, styles.generateButtonContent]}>
            <View style={styles.generateButtonIcon}>
              <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 5V19M5 12H19"
                  stroke="#000000"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.generateButtonText}>Generate New QR</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Section Title */}
      {qrCodes.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your QR Codes</Text>
        </View>
      )}
    </View>
  );

  const renderQRCard = ({ item, index }) => (
    <View style={[
      styles.cardWrapper,
      {
        width: isWeb ? '18%' : '48%',  // 18% for 5 cards per row on web, 48% for 2 cards on mobile
        marginRight: isWeb ? '2.5%' : '4%',
        marginBottom: scale(16),
      }
    ]}>
      <QRCard
        qrCode={item}
        onPress={handleCardPress}
        onShare={handleShare}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateContent}>
        <View style={styles.emptyStateIcon}>
          <Svg width={scale(100)} height={scale(100)} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 7V5C3 3.89543 3.89543 3 5 3H7"
              stroke="#7ed321"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <Path
              d="M17 3H19C20.1046 3 21 3.89543 21 5V7"
              stroke="#7ed321"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <Path
              d="M3 17V19C3 20.1046 3.89543 21 5 21H7"
              stroke="#7ed321"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <Path
              d="M17 21H19C20.1046 21 21 20.1046 21 19V17"
              stroke="#7ed321"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <Path
              d="M12 8V16M8 12H16"
              stroke="#7ed321"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.4"
            />
          </Svg>
        </View>
        <Text style={styles.emptyStateTitle}>No QR codes yet</Text>
        <Text style={styles.emptyStateDescription}>
          Create your first QR code to get started with QRush
        </Text>
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={handleGenerateQR}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyStateButtonText}>Create First QR Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#121212", "#1e1e1e", "#121212"]} style={styles.container}>
      <FlatList
        data={qrCodes}
        renderItem={renderQRCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={getColumns()}
        key={getColumns()} // Force re-render when columns change
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.contentContainer,
          qrCodes.length === 0 && styles.emptyContentContainer
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7ed321"
            colors={["#7ed321"]}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.flatList}
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
        <View style={styles.hiddenShareTemplate}>
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
  flatList: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: scale(20),
  },
  emptyContentContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: scale(isWeb ? 24 : 16),
    paddingTop: scale(Platform.OS === 'ios' ? 50 : 20),
    paddingBottom: scale(20),
  },

  // Top Navigation
  topNavBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(24),
    paddingBottom: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(126, 211, 33, 0.1)",
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logoText: {
    fontSize: scale(24),
    fontWeight: "800",
    color: "#7ed321",
    letterSpacing: 0.5,
    marginLeft: scale(8),
    //lineHeight: scale(10),
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#ff4757",
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    elevation: 4,
    shadowColor: "#ff4757",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutIcon: {
    marginRight: scale(8),
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: scale(14),
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Welcome Section
  welcomeSection: {
    alignItems: "center",
    marginBottom: scale(24),
    paddingHorizontal: scale(16),
  },
  welcomeContent: {
    alignItems: "center",
    marginBottom: scale(24),
  },
  welcomeTitle: {
    fontSize: scale(28),
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: scale(8),
  },
  userEmailText: {
    fontSize: scale(20),
    color: "#7ed321",
    fontWeight: "600",
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: scale(16),
    color: "#b0b0b0",
    textAlign: "center",
    lineHeight: scale(22),
  },
  generateButton: {
    backgroundColor: "#7ed321",
    borderRadius: scale(16),
    paddingHorizontal: scale(24),
    paddingVertical: scale(16),
    elevation: 6,
    shadowColor: "#7ed321",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    minWidth: scale(200),
  },
  generateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonIcon: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: scale(10),
    padding: scale(2),
    marginRight: scale(12),
  },
  generateButtonText: {
    color: "#000",
    fontSize: scale(20),
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Section Header
  sectionHeader: {
    marginBottom: scale(5),
  },
  sectionTitle: {
    fontSize: scale(22),
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Card Layout
  cardWrapper: {
    // Width and margins are handled inline for responsiveness
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(32),
    paddingTop: scale(20),
  },
  emptyStateContent: {
    alignItems: "center",
    maxWidth: scale(320),
  },
  emptyStateIcon: {
    marginBottom: scale(24),
    opacity: 0.8,
  },
  emptyStateTitle: {
    fontSize: scale(24),
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: scale(12),
    letterSpacing: 0.5,
  },
  emptyStateDescription: {
    fontSize: scale(16),
    color: "#b0b0b0",
    textAlign: "center",
    lineHeight: scale(24),
    marginBottom: scale(25),
  },
  emptyStateButton: {
    backgroundColor: "#7ed321",
    borderRadius: scale(12),
    paddingHorizontal: scale(24),
    paddingVertical: scale(14),
    elevation: 4,
    shadowColor: "#7ed321",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyStateButtonText: {
    color: "#000",
    fontSize: scale(16),
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Hidden Elements
  hiddenShareTemplate: {
    opacity: 0,
    position: "absolute",
    left: -9999,
    top: -9999,
  },
});