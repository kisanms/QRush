import React, { useState } from 'react';
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
import { supabase } from '../../supabaseClient';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import { scale } from '../utils/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
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

  const showToast = (type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    });
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('error', 'Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        showToast('error', 'Login Error', error.message);
      } else if (data.session) {
        // Store session in AsyncStorage
        await AsyncStorage.setItem('userSession', JSON.stringify({
          user: data.session.user,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        }));

        showToast('success', 'Success', 'Login successful!');
        // Navigation will be handled by the auth state listener in App.js
      }
    } catch (error) {
      console.log('Login error:', error);
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
        <Text style={styles.welcome}>Welcome back</Text>
        <View style={styles.formContainer}>
          <TextInput
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
          <TextInput
            style={[styles.input, passwordFocused && styles.inputFocused]}
            placeholder="Password"
            placeholderTextColor="#b0b0b0"
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            secureTextEntry
            editable={!loading}
          />
          <TouchableOpacity style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Fixed Login Button - TouchableOpacity wraps the entire button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Animated.View style={animatedButtonStyle}>
              <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Fixed Sign Up Button - TouchableOpacity wraps the entire area */}
          <TouchableOpacity
            style={styles.signupContainer}
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.signupText}>
              <Text style={styles.signupTextGray}>Don't have an account? </Text>
              <Text style={styles.signupTextLink}>Sign up</Text>
            </Text>
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
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: scale(24),
    padding: scale(5), // Add padding for better touch area
  },
  forgotText: {
    fontSize: scale(14),
    color: '#b0b0b0',
    textDecorationLine: 'underline',
  },
  loginButton: {
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
  loginButtonText: {
    fontSize: scale(18),
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  signupContainer: {
    paddingVertical: scale(10), // Add padding for better touch area
    paddingHorizontal: scale(20), // Add horizontal padding for better touch area
    alignItems: 'center',
  },
  signupText: {
    textAlign: 'center',
    fontSize: scale(14),
  },
  signupTextGray: {
    color: '#b0b0b0',
  },
  signupTextLink: {
    color: '#b0b0b0',
    textDecorationLine: 'underline',
  },
});