import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Dimensions, Platform, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../supabaseClient';

const { height, width } = Dimensions.get('window');

// Improved responsive scaling function
const scale = (size) => {
  if (Platform.OS === 'web') {
    // For web, use responsive sizing based on viewport
    const baseWidth = Math.min(width, 1200); // Max width for large screens
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

      // Simple validation - just check if it looks like a URL
      const hasValidChars = formattedUrl.length > 0 && !formattedUrl.includes(' ');

      if (!hasValidChars) {
        Alert.alert('Invalid URL', 'Please enter a valid URL (e.g., https://example.com)');
        return;
      }

      // Add https:// if no protocol is specified
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        // Check if it looks like a domain (contains a dot)
        if (formattedUrl.includes('.')) {
          formattedUrl = 'https://' + formattedUrl;
        }
      }

      console.log('Generating QR code for URL:', formattedUrl);
      setQrCode(formattedUrl);
    } else {
      Alert.alert('Error', 'Please enter a valid URL');
    }
  };

  const saveQRCode = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the QR code');
      return;
    }

    if (!qrCode) {
      Alert.alert('Error', 'QR code not generated');
      return;
    }

    setLoading(true);
    console.log('Starting QR code save process...');

    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.log('Session error:', sessionError);
        Alert.alert('Authentication Error', 'Failed to get user session. Please login again.');
        setLoading(false);
        return;
      }

      if (!session?.user?.id) {
        console.log('No user session found');
        Alert.alert('Authentication Error', 'User session not found. Please login again.');
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      console.log('User ID:', userId);

      // Get SVG data from QR code
      let svgData = null;

      if (qrCodeRef.current) {
        console.log('Attempting to get SVG data...');

        try {
          svgData = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout getting SVG data'));
            }, 5000);

            qrCodeRef.current.toDataURL((data) => {
              clearTimeout(timeout);
              console.log('SVG data received:', data ? 'Success' : 'Failed');

              if (data && typeof data === 'string' && data.length > 0) {
                resolve(data);
              } else {
                reject(new Error('Invalid SVG data received'));
              }
            });
          });
        } catch (svgError) {
          console.log('Error getting SVG data:', svgError);
          svgData = null;
        }
      }

      // Prepare data for insertion
      const insertData = {
        user_id: userId,
        title: title.trim(),
        url: qrCode, // Store the original URL
        qr_data: svgData, // Store SVG data separately
        created_at: new Date().toISOString()
      };

      console.log('Inserting data...');

      // Insert into Supabase
      const { data: insertedData, error: insertError } = await supabase
        .from('qr_codes')
        .insert(insertData)
        .select();

      if (insertError) {
        console.log('Supabase insert error:', insertError);
        Alert.alert('Database Error', `Failed to save QR code: ${insertError.message}`);
        setLoading(false);
        return;
      }

      console.log('QR code saved successfully:', insertedData);
      Alert.alert('Success', 'QR code saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setModalVisible(false);
            setTitle('');
            setQrCode(null);
            setUrl('');
            navigation.navigate('Home');
          }
        }
      ]);

    } catch (error) {
      console.log('Unexpected error saving QR code:', error);
      Alert.alert('Error', 'An unexpected error occurred while saving the QR code.');
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
    if (isDesktop) return 250;
    if (isTablet) return 200;
    return scale(180);
  };

  const getContainerWidth = () => {
    if (isDesktop) return '50%';
    if (isTablet) return '70%';
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
            placeholder="Enter URL"
            value={url}
            onChangeText={setUrl}
            placeholderTextColor="#b0b0b0"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <TouchableOpacity
            style={[
              styles.button,
              !url.trim() && styles.disabledButton,
              isDesktop && styles.desktopButton
            ]}
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
              <Text style={[styles.qrUrl, isDesktop && styles.desktopQrUrl]}>
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
          <View style={[
            styles.modalContent,
            isDesktop && styles.desktopModal,
            isTablet && styles.tabletModal
          ]}>
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
                style={[
                  styles.saveButton,
                  (!title.trim() || loading) && styles.disabledButton,
                  isDesktop && styles.desktopModalButton
                ]}
                onPress={saveQRCode}
                disabled={!title.trim() || loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
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
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height,
    paddingVertical: scale(20)
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: scale(20)
  },
  title: {
    fontSize: isDesktop ? 32 : scale(24),
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: scale(30),
    textAlign: 'center'
  },
  input: {
    width: '100%',
    height: scale(50),
    backgroundColor: '#2e2e2e',
    borderRadius: scale(10),
    paddingHorizontal: scale(15),
    color: '#fff',
    fontSize: scale(16),
    marginBottom: scale(20),
    borderWidth: 1,
    borderColor: '#3e3e3e'
  },
  desktopInput: {
    height: 55,
    fontSize: 18,
    maxWidth: 500
  },
  button: {
    backgroundColor: '#7ed321',
    paddingVertical: scale(12),
    paddingHorizontal: scale(30),
    borderRadius: scale(10),
    marginBottom: scale(20),
    minWidth: '50%'
  },
  desktopButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    minWidth: 200
  },
  buttonText: {
    color: '#000',
    fontSize: isDesktop ? 18 : scale(16),
    fontWeight: '600',
    textAlign: 'center'
  },
  disabledButton: {
    backgroundColor: '#a9d86e',
    opacity: 0.6
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: scale(20),
    borderRadius: scale(15),
    marginTop: scale(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  desktopQrContainer: {
    padding: 30,
    borderRadius: 20
  },
  qrUrl: {
    marginTop: scale(10),
    color: '#333',
    fontSize: scale(12),
    textAlign: 'center',
    maxWidth: scale(200),
  },
  desktopQrUrl: {
    fontSize: 14,
    maxWidth: 300
  },
  modalOverlay: {
    flex: 1,
    justifyContent: isDesktop ? 'center' : 'flex-end',
    alignItems: isDesktop ? 'center' : 'stretch',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    height: Platform.OS === 'web' && isDesktop ? 'auto' : height / 2,
    backgroundColor: '#1e1e1e',
    padding: scale(20),
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    alignItems: 'center'
  },
  desktopModal: {
    borderRadius: 20,
    width: 500,
    maxWidth: '90%',
    height: 'auto',
    minHeight: 300
  },
  tabletModal: {
    borderRadius: 15,
    width: '80%',
    height: 'auto',
    minHeight: 250
  },
  modalTitle: {
    fontSize: isDesktop ? 24 : scale(20),
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: scale(20),
    textAlign: 'center'
  },
  modalInput: {
    width: '90%',
    height: scale(50),
    backgroundColor: '#2e2e2e',
    borderRadius: scale(10),
    paddingHorizontal: scale(15),
    color: '#fff',
    fontSize: scale(16),
    marginBottom: scale(20),
    borderWidth: 1,
    borderColor: '#3e3e3e'
  },
  desktopModalInput: {
    height: 55,
    fontSize: 18
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    gap: scale(10)
  },
  desktopModalButtons: {
    gap: 15
  },
  cancelButton: {
    backgroundColor: '#ff4757',
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(10),
    flex: 1
  },
  saveButton: {
    backgroundColor: '#7ed321',
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    borderRadius: scale(10),
    flex: 1
  },
  desktopModalButton: {
    paddingVertical: 15,
    paddingHorizontal: 25
  }
});