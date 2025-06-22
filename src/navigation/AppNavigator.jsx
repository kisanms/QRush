import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#1e1e1e' },
          animationEnabled: true,
          gestureEnabled: true,
        }}
      >
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
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}