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
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const scaleAnim = useSharedValue(1);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

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

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showToast('error', 'Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', 'Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      showToast('error', 'Error', 'Password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        showToast('error', 'Registration Error', error.message);
      } else {
        showToast('success', 'Registration Completed', 'Your account has been created successfully! Please check your email for verification.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      showToast('error', 'Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    if (passwordInputRef.current && passwordFocused) {
      passwordInputRef.current.focus();
    }
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    if (confirmPasswordInputRef.current && confirmPasswordFocused) {
      confirmPasswordInputRef.current.focus();
    }
    setShowConfirmPassword(!showConfirmPassword);
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
        <Text style={styles.welcome}>Create your account</Text>
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
          <View style={styles.inputContainer}>
            <TextInput
              ref={passwordInputRef}
              style={[styles.input, passwordFocused && styles.inputFocused, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor="#b0b0b0"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={toggleShowPassword}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={scale(24)}
                color="#b0b0b0"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              ref={confirmPasswordInputRef}
              style={[styles.input, confirmPasswordFocused && styles.inputFocused, styles.passwordInput]}
              placeholder="Confirm Password"
              placeholderTextColor="#b0b0b0"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setConfirmPasswordFocused(true)}
              onBlur={() => setConfirmPasswordFocused(false)}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={toggleShowConfirmPassword}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={scale(24)}
                color="#b0b0b0"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Animated.View style={animatedButtonStyle}>
              <Text style={styles.registerButtonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginContainer}
            onPress={() => navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              <Text style={styles.loginTextGray}>Already have an account? </Text>
              <Text style={styles.loginTextLink}>Log in</Text>
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
  inputContainer: {
    position: 'relative',
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
  passwordInput: {
    paddingRight: scale(48),
  },
  inputFocused: {
    borderWidth: 2,
    borderColor: '#7ed321',
  },
  eyeIcon: {
    position: 'absolute',
    right: scale(16),
    top: scale(16),
  },
  registerButton: {
    height: scale(56),
    backgroundColor: '#7ed321',
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(24),
    marginTop: scale(8),
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
  registerButtonText: {
    fontSize: scale(18),
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  loginContainer: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(20),
    alignItems: 'center',
  },
  loginText: {
    textAlign: 'center',
    fontSize: scale(14),
  },
  loginTextGray: {
    color: '#b0b0b0',
  },
  loginTextLink: {
    color: '#b0b0b0',
    textDecorationLine: 'underline',
  },
});