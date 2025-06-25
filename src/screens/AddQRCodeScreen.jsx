import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Dimensions, Platform, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../supabaseClient';

const { height, width } = Dimensions.get('window');

// Improved responsive scaling function
const scale = (size) => {
  if (Platform.OS === 'web') {
    const baseWidth = Math.min(width, 400); // Adjusted max width for better scaling
    return Math.max(size * (baseWidth / 375), size * 0.8); // Minimum 80% of original size
  }
  return size * (width / 375);
};

// Responsive breakpoints for web
const isDesktop = Platform.OS === 'web' && width > 768;
const isTablet = Platform.OS === 'web' && width > 480 && width <= 768;

export default function AddQRCodeScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const qrCodeRef = useRef();

  useEffect(() => {
    if (qrCode) {
      console.log('QR code state updated, showing modal');
      setModalVisible(true);
    }
  }, [qrCode]);

  const generateQRCode = () => {
    if (url.trim()) {
      let formattedUrl = url.trim();

      // Enhanced URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      const hasValidChars = formattedUrl.length > 0 && !formattedUrl.includes(' ');

      if (!hasValidChars || (!urlPattern.test(formattedUrl) && !formattedUrl.startsWith('http'))) {
        Alert.alert('Invalid URL', 'Please enter a valid URL (e.g., https://example.com or example.com)');
        return;
      }

      // Add https:// if no protocol is specified and it looks like a domain
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        if (formattedUrl.includes('.')) {
          formattedUrl = 'https://' + formattedUrl;
        }
      }

      console.log('Generating QR code for URL:', formattedUrl);
      setQrCode(formattedUrl);
    } else {
      Alert.alert('Error', 'Please enter a URL');
    }
  };

  const showAlert = (title, message, onPress) => {
    if (Platform.OS === 'web') {
      // Use window.alert for web as a fallback
      window.alert(`${title}: ${message}`);
      if (onPress) onPress();
    } else {
      Alert.alert(title, message, [
        {
          text: 'OK',
          onPress,
        },
      ]);
    }
  };

  const saveQRCode = async () => {
    if (!title.trim()) {
      showAlert('Error', 'Please enter a title for the QR code');
      return;
    }

    if (!qrCode) {
      showAlert('Error', 'QR code not generated');
      return;
    }

    setLoading(true);
    console.log('Starting QR code save process...');

    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get user session');
      }

      if (!session?.user?.id) {
        console.error('No user session found');
        throw new Error('User session not found');
      }

      const userId = session.user.id;
      console.log('User ID:', userId);
      console.log('QR Code URL to save:', qrCode);

      // Get SVG data from QR code with extended timeout for web
      let svgData = null;
      if (qrCodeRef.current) {
        console.log('Attempting to get SVG data...');
        try {
          svgData = await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.log('Timeout getting SVG data');
              resolve(null);
            }, Platform.OS === 'web' ? 10000 : 5000); // Longer timeout for web

            qrCodeRef.current.toDataURL((data) => {
              clearTimeout(timeout);
              console.log('SVG data received:', data ? 'Success' : 'Failed');
              if (data && typeof data === 'string' && data.length > 0) {
                resolve(data);
              } else {
                console.log('Invalid SVG data received');
                resolve(null);
              }
            });
          });
        } catch (svgError) {
          console.error('Error getting SVG data:', svgError);
          svgData = null;
        }
      }

      console.log('Final SVG data status:', svgData ? 'Available' : 'Not available');

      // Prepare data for insertion
      const insertData = {
        user_id: userId,
        title: title.trim(),
        url: qrCode,
        qr_data: svgData || null,
        created_at: new Date().toISOString(),
      };

      console.log('Insert data prepared:', {
        user_id: insertData.user_id,
        title: insertData.title,
        url: insertData.url,
        qr_data: insertData.qr_data ? 'SVG data present' : 'No SVG data',
        created_at: insertData.created_at,
      });

      // Insert into Supabase with retry mechanism
      let retries = 3;
      let insertedData = null;
      let insertError = null;

      while (retries > 0) {
        try {
          const { data, error } = await supabase
            .from('qr_codes')
            .insert([insertData])
            .select();

          if (error) throw error;
          insertedData = data;
          break;
        } catch (error) {
          console.error(`Insert attempt ${4 - retries} failed:`, error);
          insertError = error;
          retries--;
          if (retries === 0) break;
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait before retry
        }
      }

      if (insertError && !insertedData) {
        console.error('Supabase insert error:', insertError);
        throw new Error(`Failed to save QR code: ${insertError.message}`);
      }

      console.log('QR code saved successfully:', insertedData);
      showAlert('Success', 'QR code saved successfully!', () => {
        setModalVisible(false);
        setTitle('');
        setQrCode(null);
        setUrl('');
        navigation.navigate('Home');
      });
    } catch (error) {
      console.error('Unexpected error saving QR code:', error);
      showAlert('Error', `Failed to save QR code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelQRCode = () => {
    setModalVisible(false);
    setTitle('');
    setQrCode(null);
    setUrl('');
  };

  const getQRSize = () => {
    if (isDesktop) return scale(250);
    if (isTablet) return scale(200);
    return scale(180);
  };

  const getContainerWidth = () => {
    if (isDesktop) return scale(500);
    if (isTablet) return '80%';
    return '90%';
  };

  return (
    <LinearGradient colors={['#121212', '#1e1e1e', '#121212']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, { width: getContainerWidth() }]}>
          <Text style={styles.title}>Create QR Code</Text>

          <TextInput
            style={[styles.input, isDesktop && styles.desktopInput]}
            placeholder="Enter URL (e.g., https://example.com)"
            value={url}
            onChangeText={setUrl}
            placeholderTextColor="#b0b0b0"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <TouchableOpacity
            style={[styles.button, !url.trim() && styles.disabledButton, isDesktop && styles.desktopButton]}
            onPress={generateQRCode}
            activeOpacity={0.8}
            disabled={!url.trim()}
          >
            <Text style={styles.buttonText}>Generate QR Code</Text>
          </TouchableOpacity>

          {qrCode && (
            <View style={[styles.qrContainer, isDesktop && styles.desktopQrContainer]}>
              <QRCode
                ref={qrCodeRef}
                value={qrCode}
                size={getQRSize()}
                color="#000000"
                backgroundColor="#ffffff"
              />
              <Text style={[styles.qrUrl, isDesktop && styles.desktopQrUrl]} numberOfLines={2} ellipsizeMode="tail">
                {qrCode}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
        transparent={true}
        visible={modalVisible}
        onRequestClose={cancelQRCode}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDesktop && styles.desktopModal, isTablet && styles.tabletModal]}>
            <Text style={styles.modalTitle}>Save QR Code</Text>

            <TextInput
              style={[styles.modalInput, isDesktop && styles.desktopModalInput]}
              placeholder="Enter title for QR code"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#b0b0b0"
              autoCapitalize="words"
              maxLength={100}
            />

            <View style={[styles.modalButtons, isDesktop && styles.desktopModalButtons]}>
              <TouchableOpacity
                style={[styles.cancelButton, isDesktop && styles.desktopModalButton]}
                onPress={cancelQRCode}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, (!title.trim() || loading) && styles.disabledButton, isDesktop && styles.desktopModalButton]}
                onPress={saveQRCode}
                disabled={!title.trim() || loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height,
    paddingVertical: scale(30),
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: scale(20),
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: scale(15),
    paddingVertical: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: isDesktop ? scale(28) : scale(24),
    color: '#fff',
    fontWeight: '700',
    marginBottom: scale(25),
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    height: scale(50),
    backgroundColor: '#2e2e2e',
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    color: '#fff',
    fontSize: scale(16),
    marginBottom: scale(20),
    borderWidth: 1,
    borderColor: '#3e3e3e',
  },
  desktopInput: {
    height: scale(55),
    fontSize: scale(18),
    maxWidth: scale(500),
  },
  button: {
    backgroundColor: '#7ed321',
    paddingVertical: scale(12),
    paddingHorizontal: scale(30),
    borderRadius: scale(10),
    marginBottom: scale(20),
    minWidth: scale(200),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  desktopButton: {
    paddingVertical: scale(15),
    paddingHorizontal: scale(40),
    minWidth: scale(250),
  },
  buttonText: {
    color: '#000',
    fontSize: isDesktop ? scale(18) : scale(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#a9d86e',
    opacity: 0.6,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: scale(15),
    borderRadius: scale(12),
    marginTop: scale(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  desktopQrContainer: {
    padding: scale(20),
    borderRadius: scale(15),
  },
  qrUrl: {
    marginTop: scale(10),
    color: '#333',
    fontSize: scale(12),
    textAlign: 'center',
    maxWidth: scale(250),
  },
  desktopQrUrl: {
    fontSize: scale(14),
    maxWidth: scale(300),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: isDesktop ? 'center' : 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    padding: scale(20),
    borderRadius: scale(15),
    width: isDesktop ? scale(450) : isTablet ? '80%' : '100%',
    minHeight: scale(250),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  desktopModal: {
    borderRadius: scale(20),
    maxWidth: scale(500),
  },
  tabletModal: {
    borderRadius: scale(15),
    width: '85%',
  },
  modalTitle: {
    fontSize: isDesktop ? scale(22) : scale(20),
    color: '#fff',
    fontWeight: '700',
    marginBottom: scale(20),
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    height: scale(50),
    backgroundColor: '#2e2e2e',
    borderRadius: scale(10),
    paddingHorizontal: scale(15),
    color: '#fff',
    fontSize: scale(16),
    marginBottom: scale(20),
    borderWidth: 1,
    borderColor: '#3e3e3e',
  },
  desktopModalInput: {
    height: scale(55),
    fontSize: scale(18),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: scale(15),
  },
  desktopModalButtons: {
    gap: scale(20),
  },
  cancelButton: {
    backgroundColor: '#ff4757',
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(10),
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: '#7ed321',
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(10),
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  desktopModalButton: {
    paddingVertical: scale(15),
    paddingHorizontal: scale(25),
  },
});