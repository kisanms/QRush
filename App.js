import React, { useState, useEffect, useCallback } from "react";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import AppNavigator from "./src/navigation/AppNavigator";
import { StatusBar, View } from "react-native";
import { supabase } from "./src/utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-web";

// Prevent the splash screen from auto-hiding until resources are loaded
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading, true = authenticated, false = not authenticated

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync({
          "Inter-Regular": require("./assets/fonts/Inter-Regular.ttf"),
          "Inter-Bold": require("./assets/fonts/Inter-Bold.ttf"),
        });

        // Check authentication state
        await checkAuthState();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const checkAuthState = async () => {
    try {
      // Check if user session exists in Supabase
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.log("Auth error:", error);
        setIsAuthenticated(false);
        return;
      }

      if (session?.user) {
        // Store session info in AsyncStorage for web compatibility
        await AsyncStorage.setItem(
          "userSession",
          JSON.stringify({
            user: session.user,
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          })
        );
        setIsAuthenticated(true);
      } else {
        // Check AsyncStorage as fallback (mainly for web)
        const storedSession = await AsyncStorage.getItem("userSession");
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          // Verify if the stored session is still valid
          if (parsedSession.user && parsedSession.accessToken) {
            setIsAuthenticated(true);
          } else {
            await AsyncStorage.removeItem("userSession");
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.log("Error checking auth state:", error);
      setIsAuthenticated(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_IN" && session?.user) {
        await AsyncStorage.setItem(
          "userSession",
          JSON.stringify({
            user: session.user,
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          })
        );
        setIsAuthenticated(true);
      } else if (event === "SIGNED_OUT") {
        await AsyncStorage.removeItem("userSession");
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && isAuthenticated !== null) {
      // Hide the splash screen once resources are loaded and auth state is determined
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, isAuthenticated]);

  if (!appIsReady || isAuthenticated === null) {
    return null;
  }

  return (
    <View onLayout={onLayoutRootView} style={{ flex: 1 }}>
      <StatusBar />
      <AppNavigator isAuthenticated={isAuthenticated} />
      <Toast />
    </View>
  );
}
