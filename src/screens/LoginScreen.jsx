import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { supabase } from '../../supabaseClient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive scaling function
const scale = (size) => {
  const baseWidth = 375; // iPhone X width as base
  const ratio = screenWidth / baseWidth;
  const maxWidth = 400; // Maximum width for web

  if (Platform.OS === 'web' && screenWidth > maxWidth) {
    return size * (maxWidth / baseWidth);
  }

  return size * ratio;
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('Login Error', error.message);
      } else {
        Alert.alert('Success', 'Login successful!', [
          { text: 'OK', onPress: () => navigation.navigate('Home') }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>QRush Code Generator</Text>
        <Text style={styles.welcome}>Welcome back</Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Log In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
          >
            <Text style={styles.signupText}>
              <Text style={styles.signupTextGray}>Don't have an account? </Text>
              <Text style={styles.signupTextLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 400 : '90%',
    paddingHorizontal: scale(20),
  },
  title: {
    fontSize: scale(28),
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: scale(40),
  },
  welcome: {
    fontSize: scale(24),
    fontWeight: '500',
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
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: scale(24),
  },
  forgotText: {
    fontSize: scale(14),
    color: '#888888',
    textDecorationLine: 'underline',
  },
  loginButton: {
    height: scale(56),
    backgroundColor: '#7ed321',
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#000000',
  },
  signupText: {
    textAlign: 'center',
    fontSize: scale(14),
  },
  signupTextGray: {
    color: '#888888',
  },
  signupTextLink: {
    color: '#888888',
    textDecorationLine: 'underline',
  },
});