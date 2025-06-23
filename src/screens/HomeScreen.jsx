import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { scale } from '../utils/utils';
import { supabase } from '../../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';

export default function HomeScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const scaleAnim = useSharedValue(1);

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
  }, []);

  const getUserInfo = async () => {
    try {
      // First try to get user from Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session?.user?.email) {
        setUserEmail(session.user.email);
      } else {
        // Fallback to AsyncStorage (mainly for web)
        const storedSession = await AsyncStorage.getItem('userSession');
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          if (parsedSession.user?.email) {
            setUserEmail(parsedSession.user.email);
          }
        }
      }
    } catch (error) {
      console.log('Error getting user info:', error);
    }
  };

  const showToast = (type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    });
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // For web, show a simple confirm dialog
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        performLogout();
      }
    } else {
      // For mobile, use React Native Alert
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  const performLogout = async () => {
    setLoading(true);
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.log('Logout error:', error);
        showToast('error', 'Logout Error', error.message);
      } else {
        // Clear AsyncStorage
        await AsyncStorage.removeItem('userSession');
        showToast('success', 'Success', 'Logged out successfully!');
        // Navigation will be handled by the auth state listener in App.js
      }
    } catch (error) {
      console.log('Error during logout:', error);
      showToast('error', 'Error', 'An unexpected error occurred during logout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#121212', '#1e1e1e', '#121212']} style={styles.container}>
      <View style={styles.content}>
        {/* Header with Logout Button */}
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
              <Svg width={scale(20)} height={scale(20)} viewBox="0 0 24 24" fill="none" style={styles.logoutIcon}>
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
                {loading ? 'Logging out...' : 'Logout'}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>Welcome to QRush!</Text>
          {userEmail ? (
            <Text style={styles.userEmail}>Hello, {userEmail}</Text>
          ) : null}
          <Text style={styles.subtitle}>Start generating your QR codes now.</Text>

          {/* QR Generator Button Placeholder */}
          <TouchableOpacity style={styles.qrButton} activeOpacity={0.8}>
            <View style={styles.qrButtonContent}>
              <Svg width={scale(24)} height={scale(24)} viewBox="0 0 24 24" fill="none" style={styles.qrIcon}>
                <Path
                  d="M3 7V5C3 3.89543 3.89543 3 5 3H7"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Path
                  d="M17 3H19C20.1046 3 21 3.89543 21 5V7"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Path
                  d="M21 17V19C21 20.1046 20.1046 21 19 21H17"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Path
                  d="M7 21H5C3.89543 21 3 20.1046 3 19V17"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Path
                  d="M7 7H10V10H7V7Z"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Path
                  d="M14 7H17V10H14V7Z"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Path
                  d="M7 14H10V17H7V14Z"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <Path
                  d="M14 14H17V17H14V14Z"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.qrButtonText}>Generate QR Code</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: Platform.OS === 'ios' ? scale(50) : scale(30),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(40),
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutIcon: {
    marginRight: scale(8),
  },
  logoutButtonText: {
    fontSize: scale(14),
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: scale(100), // Add bottom padding to center content better
  },
  title: {
    fontSize: scale(32),
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: scale(10),
  },
  userEmail: {
    fontSize: scale(16),
    fontFamily: 'Inter-Regular',
    color: '#7ed321',
    textAlign: 'center',
    marginBottom: scale(20),
  },
  subtitle: {
    fontSize: scale(18),
    fontFamily: 'Inter-Regular',
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: scale(40),
  },
  qrButton: {
    backgroundColor: '#7ed321',
    paddingHorizontal: scale(30),
    paddingVertical: scale(16),
    borderRadius: scale(25),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  qrButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrIcon: {
    marginRight: scale(10),
  },
  qrButtonText: {
    fontSize: scale(18),
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
});