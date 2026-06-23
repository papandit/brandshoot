import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Single shared login + register (original UI, email/password only)
import Login from './user/pages/auth/Login';
import Signup from './user/pages/auth/Signup';

// ── Admin app (real web-frontend) ────────────────────────────────────────────
import AdminLayout from './admin/components/Layout/Layout';
import Dashboard from './admin/pages/Dashboard';
import Users from './admin/pages/Users';
import UserDetail from './admin/pages/UserDetail';
import TokenStats from './admin/pages/TokenStats';
import Categories from './admin/pages/Categories';
import Models from './admin/pages/Models';
import Backgrounds from './admin/pages/Backgrounds';
import Prompts from './admin/pages/Prompts';

// ── User app (real web-app) ──────────────────────────────────────────────────
import Home from './user/pages/Home';
import ModelSelection from './user/pages/photoshoot/ModelSelection';
import Upload from './user/pages/photoshoot/Upload';
import Result from './user/pages/photoshoot/Result';
import CatalogueMainModelSelection from './user/pages/catalogue/CatalogueMainModelSelection';
import CataloguePhotoSelection from './user/pages/catalogue/CataloguePhotoSelection';
import CatalogueBackgroundSelection from './user/pages/catalogue/CatalogueBackgroundSelection';
import CatalogueUpload from './user/pages/catalogue/CatalogueUpload';
import CatalogueResult from './user/pages/catalogue/CatalogueResult';
import BrandingMainModelSelection from './user/pages/branding/BrandingMainModelSelection';
import BrandingPoseSelection from './user/pages/branding/BrandingPoseSelection';
import BrandingSettings from './user/pages/branding/BrandingSettings';
import BrandingUpload from './user/pages/branding/BrandingUpload';
import BrandingResult from './user/pages/branding/BrandingResult';
import AdsHome from './user/pages/ads/AdsHome';
import AdsPrompt from './user/pages/ads/AdsPrompt';
import AdsGeneration from './user/pages/ads/AdsGeneration';
import AdsResult from './user/pages/ads/AdsResult';
import UserProfile from './user/pages/user/UserProfile';
import UserHistory from './user/pages/user/UserHistory';
import BuyMoreImages from './user/pages/user/BuyMoreImages';
import ApiKeys from './user/pages/user/ApiKeys';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* One login + register for everyone -> role-based redirect happens inside. */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ── Admin area: admins only, wrapped in the admin Layout (sidebar). ── */}
          <Route
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:userId" element={<UserDetail />} />
            <Route path="/token-stats" element={<TokenStats />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/models" element={<Models />} />
            <Route path="/backgrounds" element={<Backgrounds />} />
            <Route path="/prompts" element={<Prompts />} />
          </Route>

          {/* ── User area: any authenticated account. ── */}
          <Route
            element={
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />

            <Route path="/photoshoot/models" element={<ModelSelection />} />
            <Route path="/photoshoot/upload" element={<Upload />} />
            <Route path="/photoshoot/result" element={<Result />} />

            <Route path="/catalogue/models" element={<CatalogueMainModelSelection />} />
            <Route path="/catalogue/photos" element={<CataloguePhotoSelection />} />
            <Route path="/catalogue/background" element={<CatalogueBackgroundSelection />} />
            <Route path="/catalogue/upload" element={<CatalogueUpload />} />
            <Route path="/catalogue/result" element={<CatalogueResult />} />

            <Route path="/branding/models" element={<BrandingMainModelSelection />} />
            <Route path="/branding/poses" element={<BrandingPoseSelection />} />
            <Route path="/branding/settings" element={<BrandingSettings />} />
            <Route path="/branding/upload" element={<BrandingUpload />} />
            <Route path="/branding/result" element={<BrandingResult />} />

            <Route path="/ads" element={<AdsHome />} />
            <Route path="/ads/prompt" element={<AdsPrompt />} />
            <Route path="/ads/generate" element={<AdsGeneration />} />
            <Route path="/ads/result" element={<AdsResult />} />

            <Route path="/profile" element={<UserProfile />} />
            <Route path="/history" element={<UserHistory />} />
            <Route path="/buy-credits" element={<BuyMoreImages />} />
            <Route path="/api-keys" element={<ApiKeys />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" />
      </BrowserRouter>
    </AuthProvider>
  );
}
