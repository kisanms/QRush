import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransitionSpecs, CardStyleInterpolators } from '@react-navigation/stack'; // Added imports
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AddQRCodeScreen from '../screens/AddQRCodeScreen';
// import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const linking = {
  prefixes: ['http://localhost:8081', 'https://your-app-domain.com'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      Home: 'home',
      AddQRCode: 'add-qrcode',
      Settings: 'settings',
    },
  },
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Add QR Code') {
            iconName = focused ? 'qr-code' : 'qr-code-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#7ed321',
        tabBarInactiveTintColor: '#b0b0b0',
        tabBarStyle: { backgroundColor: '#1e1e1e' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Add QR Code" component={AddQRCodeScreen} />
      {/* <Tab.Screen name="Settings" component={SettingsScreen} /> */}
    </Tab.Navigator>
  );
}

export default function AppNavigator({ isAuthenticated }) {
  const navigationRef = React.useRef();

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        if (currentRoute?.name === 'Login' || currentRoute?.name === 'Home') {
          BackHandler.exitApp();
          return true;
        }
        return false;
      });
      return () => backHandler.remove();
    }
  }, []);

  const mobileScreenOptions = {
    headerShown: false,
    cardStyle: { backgroundColor: '#1e1e1e' },
    animationEnabled: true,
    gestureEnabled: true,
    transitionSpec: {
      open: TransitionSpecs.TransitionIOSSpec,
      close: TransitionSpecs.TransitionIOSSpec,
    },
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  };

  const webScreenOptions = {
    headerShown: false,
    cardStyle: { backgroundColor: '#1e1e1e' },
    animationEnabled: false,
    gestureEnabled: false,
  };

  const screenOptions = Platform.OS === 'web' ? webScreenOptions : mobileScreenOptions;

  return (
    <NavigationContainer linking={linking} ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "TabNavigator" : "Login"}
        screenOptions={screenOptions}
      >
        {isAuthenticated ? (
          <Stack.Screen
            name="TabNavigator"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'Login', animationTypeForReplace: 'push' }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Register', animationTypeForReplace: 'push' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}