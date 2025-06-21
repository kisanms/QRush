import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView
} from 'react-native';
import { supabase } from '../../supabaseClient';

const { width: screenWidth } = Dimensions.get('window');

// Responsive scaling function
const scale = (size) => {
  const baseWidth = 375;
  const ratio = screenWidth / baseWidth;
  const maxWidth = 400;

  if (Platform.OS === 'web' && screenWidth > maxWidth) {
    return size * (maxWidth / baseWidth);
  }

  return size * ratio;
};

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getCurrentUser();
  }, []);

  const handleLogout = async () => {
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
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert('Error', error.message);
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>QR Code Generator</Text>
          <Text style={styles.subtitle}>Welcome to your dashboard</Text>
        </View>

        <View style={styles.userSection}>
          <View style={styles.userCard}>
            <Text style={styles.userTitle}>User Information</Text>
            <Text style={styles.userEmail}>
              {user?.email || 'No email available'}
            </Text>
            <Text style={styles.userStatus}>
              Status: {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
            </Text>
          </View>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>

          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📱</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Generate QR Code</Text>
              <Text style={styles.featureDescription}>
                Create custom QR codes for text, URLs, and more
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📊</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Analytics</Text>
              <Text style={styles.featureDescription}>
                Track your QR code scans and performance
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>⚙️</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Settings</Text>
              <Text style={styles.featureDescription}>
                Customize your QR codes and preferences
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, loading && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={loading}
        >
          <Text style={styles.logoutButtonText}>
            {loading ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: scale(30),
  },
  title: {
    fontSize: scale(28),
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: scale(16),
    color: '#888888',
    textAlign: 'center',
  },
  userSection: {
    marginBottom: scale(30),
  },
  userCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: scale(12),
    padding: scale(16),
  },
  userTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: scale(8),
  },
  userEmail: {
    fontSize: scale(16),
    color: '#7ed321',
    marginBottom: scale(4),
  },
  userStatus: {
    fontSize: scale(14),
    color: '#888888',
  },
  featuresSection: {
    flex: 1,
    marginBottom: scale(20),
  },
  sectionTitle: {
    fontSize: scale(20),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: scale(16),
  },
  featureCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: scale(50),
    height: scale(50),
    backgroundColor: '#3a3a3a',
    borderRadius: scale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
  },
  featureIconText: {
    fontSize: scale(20),
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: scale(4),
  },
  featureDescription: {
    fontSize: scale(14),
    color: '#888888',
  },
  logoutButton: {
    height: scale(56),
    backgroundColor: '#ff4757',
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#ffffff',
  },
});