import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';

const { height } = Dimensions.get('window');
const scale = (size) => size;

export default function AddQRCodeScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [qrCode, setQrCode] = useState(null);

  const generateQRCode = () => {
    if (url) {
      setQrCode(url);
    }
  };

  return (
    <LinearGradient colors={['#121212', '#1e1e1e', '#121212']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create QR Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter URL"
          value={url}
          onChangeText={setUrl}
          placeholderTextColor="#b0b0b0"
        />
        <TouchableOpacity style={styles.button} onPress={generateQRCode}>
          <Text style={styles.buttonText}>Generate QR Code</Text>
        </TouchableOpacity>
        {qrCode && (
          <View style={styles.qrContainer}>
            <QRCode value={qrCode} size={200} />
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: scale(20), paddingTop: scale(50), alignItems: 'center' },
  title: { fontSize: scale(24), color: '#fff', marginBottom: scale(20) },
  input: { width: '100%', height: scale(50), backgroundColor: '#2e2e2e', borderRadius: scale(10), paddingHorizontal: scale(10), color: '#fff', marginBottom: scale(20) },
  button: { backgroundColor: '#7ed321', paddingVertical: scale(10), paddingHorizontal: scale(20), borderRadius: scale(10), marginBottom: scale(20) },
  buttonText: { color: '#000', fontSize: scale(16) },
  qrContainer: { backgroundColor: '#d1e7dd', padding: scale(20), borderRadius: scale(10) },
});