import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale } from '../utils/utils';

export default function HomeScreen() {
  return (
    <LinearGradient colors={['#121212', '#1e1e1e', '#121212']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to QRush!</Text>
        <Text style={styles.subtitle}>Start generating your QR codes now.</Text>
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
    alignItems: 'center',
  },
  title: {
    fontSize: scale(28),
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: scale(20),
  },
  subtitle: {
    fontSize: scale(18),
    fontFamily: 'Inter-Regular',
    color: '#b0b0b0',
    textAlign: 'center',
  },
});