import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { CardStyleInterpolators, TransitionSpecs } from '@react-navigation/stack';
import { Platform, BackHandler } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createStackNavigator();

const linking = {
  prefixes: ['http://localhost:8081', 'https://your-app-domain.com'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      Home: 'home',
    },
  },
};

export default function AppNavigator({ isAuthenticated }) {
  const navigationRef = React.useRef();

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        const currentRoute = navigationRef.current?.getCurrentRoute();

        // If user is on Login screen or Home screen, exit the app
        if (currentRoute?.name === 'Login' || currentRoute?.name === 'Home') {
          BackHandler.exitApp();
          return true;
        }

        // Allow default back behavior for other screens
        return false;
      });

      return () => backHandler.remove();
    }
  }, []);

  // Screen options for mobile (with animations)
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

  // Screen options for web (no animations)
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
        initialRouteName={isAuthenticated ? "Home" : "Login"}
        screenOptions={screenOptions}
      >
        {isAuthenticated ? (
          // Authenticated user screens
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'Home',
              gestureEnabled: false,
              ...(Platform.OS !== 'web' && {
                transitionSpec: {
                  open: TransitionSpecs.FadeInFromBottomAndroidSpec,
                  close: TransitionSpecs.FadeOutToBottomAndroidSpec,
                },
                cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
              }),
            }}
          />
        ) : (
          // Non-authenticated user screens
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                title: 'Login',
                animationTypeForReplace: 'push',
              }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: 'Register',
                animationTypeForReplace: 'push',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}