import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme/theme";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";

// Main App Screens
import HomeScreen from "../screens/HomeScreen";
import CategoryScreen from "../screens/CategoryScreen";
import ModelSelectionScreen from "../screens/ModelSelectionScreen";
import CatalogueMainModelSelectionScreen from "../screens/CatalogueMainModelSelectionScreen";
import CatalogueModelSelectionScreen from "../screens/CatalogueModelSelectionScreen";
import CatalogueBackgroundSelectionScreen from "../screens/CatalogueBackgroundSelectionScreen";
import CatalogueUploadScreen from "../screens/CatalogueUploadScreen";
import CatalogueResultScreen from "../screens/CatalogueResultScreen";
import ResultScreen from "../screens/ResultScreen";
import UploadScreen from "../screens/UploadScreen";

// Branding Screens
import BrandingMainModelSelectionScreen from "../screens/BrandingMainModelSelectionScreen";
import BrandingPoseSelectionScreen from "../screens/BrandingPoseSelectionScreen";
import BrandingSettingsScreen from "../screens/BrandingSettingsScreen";
import BrandingUploadScreen from "../screens/BrandingUploadScreen";
import BrandingResultScreen from "../screens/BrandingResultScreen";

// Ads Screens
import AdsHomeScreen from "../screens/ads/AdsHomeScreen";
import ComingSoonAdsScreen from "../screens/ads/ComingSoonAdsScreen";

// User screens
import UserHistoryScreen from "../screens/UserHistoryScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import BuyMoreImagesScreen from "../screens/BuyMoreImagesScreen";
import AdsPromptScreen from "../screens/ads/AdsPromptScreen";
import AdsGenerationScreen from "../screens/ads/AdsGenerationScreen";
import AdsResultScreen from "../screens/ads/AdsResultScreen";

// Admin Screens
import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";
import AdminUserDetailScreen from "../screens/admin/AdminUserDetailScreen";
import AdminTokenStatsScreen from "../screens/admin/AdminTokenStatsScreen";
import AdminContentScreen from "../screens/admin/AdminContentScreen";
import AdminCategoriesScreen from "../screens/admin/AdminCategoriesScreen";
import AdminModelsScreen from "../screens/admin/AdminModelsScreen";
import AdminBackgroundsScreen from "../screens/admin/AdminBackgroundsScreen";
import AdminPromptsScreen from "../screens/admin/AdminPromptsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth Stack - Show Login/Signup when not authenticated
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      ) : isAdmin ? (
        // Admin Stack - Show Brand Shoot Admin when role is admin
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
          <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
          <Stack.Screen name="AdminTokenStats" component={AdminTokenStatsScreen} />
          <Stack.Screen name="AdminContent" component={AdminContentScreen} />
          <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
          <Stack.Screen name="AdminModels" component={AdminModelsScreen} />
          <Stack.Screen name="AdminBackgrounds" component={AdminBackgroundsScreen} />
          <Stack.Screen name="AdminPrompts" component={AdminPromptsScreen} />
        </>
      ) : (
        // Main App Stack - Show after authentication (regular users)
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Category" component={CategoryScreen} />
          <Stack.Screen name="ModelSelection" component={ModelSelectionScreen} />
          <Stack.Screen name="CatalogueMainModelSelection" component={CatalogueMainModelSelectionScreen} />
          <Stack.Screen name="CataloguePhotoSelection" component={CatalogueModelSelectionScreen} />
          <Stack.Screen name="CatalogueBackgroundSelection" component={CatalogueBackgroundSelectionScreen} />
          <Stack.Screen name="CatalogueUpload" component={CatalogueUploadScreen} />
          <Stack.Screen name="CatalogueResult" component={CatalogueResultScreen} />
          <Stack.Screen name="Upload" component={UploadScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />

          {/* Branding Flow Screens */}
          <Stack.Screen name="BrandingMainModelSelection" component={BrandingMainModelSelectionScreen} />
          <Stack.Screen name="BrandingPoseSelection" component={BrandingPoseSelectionScreen} />
          <Stack.Screen name="BrandingSettings" component={BrandingSettingsScreen} />
          <Stack.Screen name="BrandingUpload" component={BrandingUploadScreen} />
          <Stack.Screen name="BrandingResult" component={BrandingResultScreen} />

          {/* Ads Creation Screens */}
          <Stack.Screen name="AdsHome" component={AdsHomeScreen} />
          <Stack.Screen name="ComingSoonAds" component={ComingSoonAdsScreen} />
          <Stack.Screen name="AdsPrompt" component={AdsPromptScreen} />
          <Stack.Screen name="AdsGeneration" component={AdsGenerationScreen} />
          <Stack.Screen name="AdsResult" component={AdsResultScreen} />

          {/* User Profile & History */}
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="UserHistory" component={UserHistoryScreen} />
          <Stack.Screen name="BuyMoreImages" component={BuyMoreImagesScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
});
