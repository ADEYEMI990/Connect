import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import InitialLayout from "@/components/initialLayout";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import { SplashScreen } from "expo-router";
import { useCallback, useEffect } from "react";
import { useFonts } from "expo-font";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  // Update the native navigation bar on Android
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#000000");
      NavigationBar.setButtonStyleAsync("light");
    }
  })

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  return (
    <ClerkAndConvexProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} onLayout={onLayoutRootView}>
          <InitialLayout />
        </SafeAreaView>
      </SafeAreaProvider>
      <StatusBar style="light" />
    </ClerkAndConvexProvider>
  );
}

