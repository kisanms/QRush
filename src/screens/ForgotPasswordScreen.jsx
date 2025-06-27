import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { supabase } from '../utils/supabaseClient';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import { scale } from '../utils/utils';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const scaleAnim = useSharedValue(1);
  const emailInputRef = useRef(null);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1);
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

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showToast('error', 'Error', 'Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      // Updated redirect URL to point to the reset password page
      const redirectTo = 'https://qrush-reset-password.vercel.app/reset-password';

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        showToast('error', 'Reset Password Error', error.message);
      } else {
        showToast('success', 'Success', 'Password reset email sent! Please check your inbox and follow the instructions.');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.log('Reset password error:', error);
      showToast('error', 'Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#121212', '#1e1e1e', '#121212']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Svg width={scale(60)} height={scale(60)} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="#7ed321"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text style={styles.title}>QRush Code Generator</Text>
        <Text style={styles.welcome}>Reset your password</Text>
        <View style={styles.formContainer}>
          <TextInput
            ref={emailInputRef}
            style={[styles.input, emailFocused && styles.inputFocused]}
            placeholder="Email"
            placeholderTextColor="#b0b0b0"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.resetButton, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Animated.View style={animatedButtonStyle}>
              <Text style={styles.resetButtonText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backContainer}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 400 : '90%',
    paddingHorizontal: scale(20),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: scale(20),
  },
  title: {
    fontSize: scale(28),
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: scale(40),
  },
  welcome: {
    fontSize: scale(24),
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: scale(40),
  },
  formContainer: {
    width: '100%',
  },
  input: {
    height: scale(56),
    backgroundColor: '#3a3a3a',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    fontSize: scale(16),
    color: '#ffffff',
    marginBottom: scale(16),
    borderWidth: 0,
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
  inputFocused: {
    borderWidth: 2,
    borderColor: '#7ed321',
  },
  resetButton: {
    height: scale(56),
    backgroundColor: '#7ed321',
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(24),
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
  resetButtonText: {
    fontSize: scale(18),
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  backContainer: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    alignItems: 'center',
  },
  backText: {
    textAlign: 'center',
    fontSize: scale(14),
    color: '#b0b0b0',
    textDecorationLine: 'underline',
  },
});