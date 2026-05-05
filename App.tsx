import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { IAPProvider } from "./src/components/IAPProvider";
import { configureGoogleSignIn } from "./src/config/googleSignIn";
import { initializeBackendURL } from "./src/services/api";
import AppNavigator from "./src/navigation/AppNavigator";
import AppStatusBar from "./src/components/AppStatusBar";

// Configure Google Sign-In on app start
configureGoogleSignIn();

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize backend URL from database before app starts
        await initializeBackendURL();
        console.log("✅ App initialized with backend URL");
      } catch (error) {
        console.warn("⚠️ Failed to initialize backend URL, using default:", error);
      } finally {
        setIsInitialized(true);
      }
    };
    initApp();
  }, []);

  // Show loading while initializing backend URL
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppStatusBar />
      <IAPProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </IAPProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
