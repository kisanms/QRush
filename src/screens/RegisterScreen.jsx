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

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('Registration Error', error.message);
      } else {
        Alert.alert(
          'Registration Completed',
          'Your account has been created successfully! Please check your email for verification.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
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
        <Text style={styles.welcome}>Create your account</Text>

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

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              <Text style={styles.loginTextGray}>Already have an account? </Text>
              <Text style={styles.loginTextLink}>Log in</Text>
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
  registerButton: {
    height: scale(56),
    backgroundColor: '#7ed321',
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(24),
    marginTop: scale(8),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#000000',
  },
  loginText: {
    textAlign: 'center',
    fontSize: scale(14),
  },
  loginTextGray: {
    color: '#888888',
  },
  loginTextLink: {
    color: '#888888',
    textDecorationLine: 'underline',
  },
});