// Router — web equivalent of mobile navigation/AppNavigator.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Main pages
import Home from './pages/Home';

// Photoshoot flow
import ModelSelection from './pages/photoshoot/ModelSelection';
import Upload from './pages/photoshoot/Upload';
import Result from './pages/photoshoot/Result';

// Catalogue flow
import CatalogueMainModelSelection from './pages/catalogue/CatalogueMainModelSelection';
import CataloguePhotoSelection from './pages/catalogue/CataloguePhotoSelection';
import CatalogueBackgroundSelection from './pages/catalogue/CatalogueBackgroundSelection';
import CatalogueUpload from './pages/catalogue/CatalogueUpload';
import CatalogueResult from './pages/catalogue/CatalogueResult';

// Branding flow
import BrandingMainModelSelection from './pages/branding/BrandingMainModelSelection';
import BrandingPoseSelection from './pages/branding/BrandingPoseSelection';
import BrandingSettings from './pages/branding/BrandingSettings';
import BrandingUpload from './pages/branding/BrandingUpload';
import BrandingResult from './pages/branding/BrandingResult';

// Ads flow
import AdsHome from './pages/ads/AdsHome';
import AdsPrompt from './pages/ads/AdsPrompt';
import AdsGeneration from './pages/ads/AdsGeneration';
import AdsResult from './pages/ads/AdsResult';

// User pages
import UserProfile from './pages/user/UserProfile';
import UserHistory from './pages/user/UserHistory';
import BuyMoreImages from './pages/user/BuyMoreImages';

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-loader">
        <span className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Photoshoot flow */}
      <Route path="/photoshoot/models" element={<ModelSelection />} />
      <Route path="/photoshoot/upload" element={<Upload />} />
      <Route path="/photoshoot/result" element={<Result />} />

      {/* Catalogue flow */}
      <Route path="/catalogue/models" element={<CatalogueMainModelSelection />} />
      <Route path="/catalogue/photos" element={<CataloguePhotoSelection />} />
      <Route path="/catalogue/background" element={<CatalogueBackgroundSelection />} />
      <Route path="/catalogue/upload" element={<CatalogueUpload />} />
      <Route path="/catalogue/result" element={<CatalogueResult />} />

      {/* Branding flow */}
      <Route path="/branding/models" element={<BrandingMainModelSelection />} />
      <Route path="/branding/poses" element={<BrandingPoseSelection />} />
      <Route path="/branding/settings" element={<BrandingSettings />} />
      <Route path="/branding/upload" element={<BrandingUpload />} />
      <Route path="/branding/result" element={<BrandingResult />} />

      {/* Ads flow */}
      <Route path="/ads" element={<AdsHome />} />
      <Route path="/ads/prompt" element={<AdsPrompt />} />
      <Route path="/ads/generate" element={<AdsGeneration />} />
      <Route path="/ads/result" element={<AdsResult />} />

      {/* User */}
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/history" element={<UserHistory />} />
      <Route path="/buy-credits" element={<BuyMoreImages />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-center" />
      </BrowserRouter>
    </AuthProvider>
  );
}
