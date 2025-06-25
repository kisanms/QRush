import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  FlatList,
  Modal,
  Share,
  Linking,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { scale } from '../utils/utils'; // Ensure this utility is available
import { supabase } from '../../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast, { BaseToast } from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function HomeScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const scaleAnim = useSharedValue(1);
  const toastRef = useRef();
  const qrCodeRef = useRef(null); // Ref for QRCode component
  const navigation = useNavigation();

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
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        const storedSession = await AsyncStorage.getItem('userSession');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession.user?.email) {
            setUserEmail(parsedSession.user.email);
          }
        }
      }
    } catch (error) {
      console.error('Error getting user info:', error);
      showToast('error', 'Error', 'Failed to load user info');
    }
  };

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQrCodes(data || []);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      showToast('error', 'Error', 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQRCodes();
    setRefreshing(false);
  };

  const showToast = (type, title, message) => {
    if (toastRef.current) {
      toastRef.current.show({
        type,
        text1: title,
        text2: message,
        position: 'top',
        visibilityTime: 4000,
      });
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) performLogout();
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const performLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await AsyncStorage.removeItem('userSession');
      showToast('success', 'Success', 'Logged out successfully!');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error during logout:', error);
      showToast('error', 'Error', 'An unexpected error occurred during logout');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = () => {
    navigation.navigate('Add QR Code');
  };

  const handleCardPress = (qrCode) => {
    setSelectedQR(qrCode);
    setDetailModalVisible(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleShare = async (qrCode) => {
    try {
      let qrImageUri = null;
      if (qrCodeRef.current) {
        qrImageUri = await new Promise((resolve) => {
          qrCodeRef.current.toDataURL((data) => {
            resolve(`data:image/png;base64,${data}`);
          });
        });
      }

      if (Platform.OS === 'web') {
        // Web: Copy URL and image data to clipboard or trigger download
        const shareData = {
          title: qrCode.title,
          text: `Check out this QR code: ${qrCode.title}\n${qrCode.qr_data || qrCode.url}`,
        };

        if (navigator.share && !qrImageUri) {
          // Use navigator.share if no image (fallback)
          await navigator.share(shareData);
        } else if (qrImageUri) {
          // Create a downloadable image
          const link = document.createElement('a');
          link.href = qrImageUri;
          link.download = `${qrCode.title || 'qrcode'}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Also copy URL to clipboard
          await navigator.clipboard.writeText(qrCode.qr_data || qrCode.url);
          showToast('success', 'Success', 'QR code image downloaded and URL copied to clipboard');
        } else {
          // Fallback to copying URL
          await navigator.clipboard.writeText(qrCode.qr_data || qrCode.url);
          showToast('success', 'Copied', 'URL copied to clipboard');
        }
      } else {
        // Mobile: Share both URL and QR code image
        if (qrImageUri) {
          const fileUri = `${FileSystem.cacheDirectory}${qrCode.title || 'qrcode'}.png`;
          await FileSystem.writeAsStringAsync(fileUri, qrImageUri.split(',')[1], {
            encoding: FileSystem.EncodingType.Base64,
          });

          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: qrCode.title,
            UTI: 'public.png',
          });

          // Also share the URL in the message
          await Share.share({
            message: `${qrCode.title}\n${qrCode.qr_data || qrCode.url}`,
            title: qrCode.title,
          });
        } else {
          // Fallback to sharing URL only
          await Share.share({
            message: `${qrCode.title}\n${qrCode.qr_data || qrCode.url}`,
            url: qrCode.qr_data || qrCode.url,
            title: qrCode.title,
          });
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      showToast('error', 'Error', 'Failed to share QR code');
    }
  };

  const handleOpenURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error('Unsupported URL');
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      showToast('error', 'Error', 'Failed to open URL');
    }
  };

  const handleDelete = async (qrCodeId) => {
    const performDelete = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user?.id) throw new Error('No user session found');

        const { error } = await supabase
          .from('qr_codes')
          .delete()
          .eq('id', qrCodeId)
          .eq('user_id', session.user.id); // Added user_id check for security

        if (error) throw error;
        showToast('success', 'Deleted', 'QR code deleted successfully');
        await fetchQRCodes();
        setDetailModalVisible(false);
      } catch (error) {
        console.error('Error deleting QR code:', error);
        showToast('error', 'Error', `Failed to delete QR code: ${error.message}`);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this QR code?');
      if (confirmed) await performDelete();
    } else {
      Alert.alert(
        'Delete QR Code',
        'Are you sure you want to delete this QR code?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

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
            <Text style={styles.logoutButtonText}>{loading ? 'Logging out...' : 'Logout'}</Text>
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
    <TouchableOpacity
      style={styles.qrCard}
      onPress={() => handleCardPress(item)}
      activeOpacity={0.8}
    >
      <LinearGradient colors={['#2a2a2a', '#1a1a1a']} style={styles.cardGradient}>
        <View style={styles.qrPreview}>
          <QRCode
            value={item.qr_data || item.url}
            size={scale(100)}
            color="#000000"
            backgroundColor="#ffffff"
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardUrl} numberOfLines={1}>
            {item.url}
          </Text>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
            <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none">
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
    <LinearGradient colors={['#121212', '#1e1e1e', '#121212']} style={styles.container}>
      <FlatList
        data={qrCodes}
        renderItem={renderQRCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.qrList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M15 18L9 12L15 6"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedQR?.title}</Text>
              <View style={styles.placeholder} />
            </View>
            {selectedQR && (
              <View style={styles.modalDetails}>
                <View style={styles.qrPreviewLarge}>
                  <QRCode
                    value={selectedQR.qr_data || selectedQR.url}
                    size={scale(200)}
                    color="#000000"
                    backgroundColor="#ffffff"
                    getRef={(c) => (qrCodeRef.current = c)}
                  />
                </View>
                <Text style={styles.modalUrl} numberOfLines={2}>
                  {selectedQR.url}
                </Text>
                <Text style={styles.modalDate}>{formatDate(selectedQR.created_at)}</Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => handleOpenURL(selectedQR.url)}
                  >
                    <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
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
                    onPress={() => handleShare(selectedQR)}
                  >
                    <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
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
                    onPress={() => handleDelete(selectedQR.id)}
                  >
                    <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none">
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
            )}
          </View>
        </View>
      </Modal>

      <Toast ref={toastRef} />
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: scale(20),
    paddingBottom: scale(10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(10),
    borderRadius: scale(8),
    backgroundColor: '#ff4757',
    elevation: 2,
    shadowColor: '#000',
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
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '600',
  },
  welcomeSection: {
    marginBottom: scale(20),
    alignItems: 'center',
  },
  title: {
    fontSize: scale(26),
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  userEmail: {
    fontSize: scale(16),
    color: '#b0b0b0',
    marginTop: scale(8),
    fontStyle: 'italic',
  },
  qrButton: {
    backgroundColor: '#7ed321',
    padding: scale(15),
    borderRadius: scale(12),
    marginBottom: scale(20),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  qrButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrIcon: {
    marginRight: scale(10),
  },
  qrButtonText: {
    color: '#000',
    fontSize: scale(16),
    fontWeight: '600',
  },
  qrCodesSection: {
    marginBottom: scale(15),
  },
  sectionTitle: {
    fontSize: scale(20),
    color: '#fff',
    fontWeight: '700',
    marginBottom: scale(15),
  },
  emptyState: {
    alignItems: 'center',
    marginTop: scale(30),
    padding: scale(20),
  },
  emptyText: {
    color: '#b0b0b0',
    fontSize: scale(16),
    marginTop: scale(15),
    textAlign: 'center',
  },
  qrCard: {
    width: isMobile ? scale(160) : scale(200),
    margin: scale(10),
    borderRadius: scale(12),
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: scale(12),
  },
  qrPreview: {
    alignItems: 'center',
    marginBottom: scale(12),
    backgroundColor: '#fff',
    padding: scale(8),
    borderRadius: scale(8),
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: scale(16),
    color: '#fff',
    fontWeight: '600',
    marginBottom: scale(6),
    lineHeight: scale(20),
  },
  cardUrl: {
    fontSize: scale(12),
    color: '#b0b0b0',
    marginBottom: scale(6),
  },
  cardDate: {
    fontSize: scale(12),
    color: '#7ed321',
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    padding: scale(8),
  },
  qrList: {
    paddingBottom: scale(20),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: scale(20),
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    padding: scale(20),
    borderRadius: scale(12),
    width: isMobile ? '90%' : scale(400),
    maxWidth: 500,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: scale(15),
  },
  backButton: {
    padding: scale(8),
  },
  modalTitle: {
    fontSize: scale(20),
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: scale(32), // Balances the back button
  },
  modalDetails: {
    width: '100%',
    alignItems: 'center',
  },
  qrPreviewLarge: {
    marginBottom: scale(20),
    backgroundColor: '#fff',
    padding: scale(12),
    borderRadius: scale(8),
  },
  modalUrl: {
    fontSize: scale(14),
    color: '#b0b0b0',
    marginBottom: scale(10),
    textAlign: 'center',
    lineHeight: scale(18),
  },
  modalDate: {
    fontSize: scale(12),
    color: '#7ed321',
    marginBottom: scale(20),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: scale(10),
  },
  modalActionButton: {
    alignItems: 'center',
    padding: scale(10),
    borderRadius: scale(8),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalActionText: {
    color: '#fff',
    fontSize: scale(14),
    marginTop: scale(6),
    fontWeight: '500',
  },
});