import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../supabaseClient';
import { scale, moderateScale, verticalScale } from 'react-native-size-matters';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) alert(error.message);
    else {
      alert('Check your email for verification!');
      navigation.navigate('Login');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) alert(error.message);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Code Generator</Text>
      <Text style={styles.welcome}>Create an account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <Text style={styles.googleButtonText}>Sign up with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.signup}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: moderateScale(20),
    justifyContent: 'center',
  },
  title: {
    fontSize: scale(24),
    color: '#fff',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },
  welcome: {
    fontSize: scale(18),
    color: '#fff',
    textAlign: 'center',
    marginBottom: verticalScale(30),
  },
  input: {
    height: verticalScale(50),
    backgroundColor: '#333',
    borderRadius: moderateScale(5),
    marginBottom: verticalScale(15),
    paddingHorizontal: moderateScale(15),
    color: '#fff',
    fontSize: scale(16),
  },
  button: {
    backgroundColor: '#00cc00',
    height: verticalScale(50),
    borderRadius: moderateScale(5),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  buttonText: {
    color: '#fff',
    fontSize: scale(18),
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#4285f4',
    height: verticalScale(50),
    borderRadius: moderateScale(5),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  googleButtonText: {
    color: '#fff',
    fontSize: scale(18),
  },
  signup: {
    color: '#888',
    textAlign: 'center',
  },
});