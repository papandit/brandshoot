import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Default/fallback backend URL (used for initial config fetch)
// This URL is used ONLY for fetching the dynamic backend URL from database
// Change this to your server's IP where MongoDB has the app_config
// Production: port 1300, Local dev: port 5000
const DEFAULT_BACKEND_URL = 'http://192.168.31.55:1300';

// Dynamic backend URL - will be updated from database
let _backendURL = DEFAULT_BACKEND_URL;

// Export getter for backendURL
export const getBackendURL = () => _backendURL;

// For backward compatibility - but prefer getBackendURL()
export let backendURL = DEFAULT_BACKEND_URL;

// Storage key for caching backend URL
const BACKEND_URL_STORAGE_KEY = 'cached_backend_url';

/**
 * Initialize backend URL from database or cache
 * Call this on app startup before making any API calls
 */
export async function initializeBackendURL(): Promise<string> {
  try {
    // First, try to load cached URL for faster startup
    const cachedUrl = await AsyncStorage.getItem(BACKEND_URL_STORAGE_KEY);
    if (cachedUrl) {
      _backendURL = cachedUrl;
      backendURL = cachedUrl;
      console.log("📡 Using cached backend URL:", cachedUrl);
    }

    // Then fetch fresh URL from server (using default URL for this request)
    const response = await axios.get(`${DEFAULT_BACKEND_URL}/content/app-config`, {
      timeout: 10000, // 10 second timeout for config fetch
    });

    if (response.data?.success && response.data?.backend_url) {
      const newUrl = response.data.backend_url;
      _backendURL = newUrl;
      backendURL = newUrl;
      
      // Cache the URL for next startup
      await AsyncStorage.setItem(BACKEND_URL_STORAGE_KEY, newUrl);
      console.log("✅ Backend URL updated from server:", newUrl);
      
      // Check maintenance mode
      if (response.data.maintenance_mode) {
        console.warn("⚠️ App is in maintenance mode");
      }
      
      return newUrl;
    }
  } catch (error) {
    console.warn("⚠️ Failed to fetch backend URL from server, using default/cached:", error);
  }
  
  return _backendURL;
}

/**
 * Get current app configuration (backend URL, maintenance mode, etc.)
 */
export async function getAppConfig() {
  try {
    const response = await axios.get(`${_backendURL}/content/app-config`);
    return response.data as {
      success: boolean;
      backend_url: string;
      app_name: string;
      maintenance_mode: boolean;
      min_app_version: string;
    };
  } catch (error) {
    console.error("Failed to fetch app config:", error);
    return null;
  }
}

axios.defaults.timeout = 30000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server took too long to respond');
    } else if (error.message === 'Network Error') {
      console.error('Network Error - Check if server is reachable:', _backendURL);
    } else if (error.response) {
      console.error('Server Error:', error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

console.log("📡 Initial backendURL:", backendURL);

/**
 * Get authentication token from storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("auth_token");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Start a generation job. Returns immediately with jobId + scenario info.
 */
export async function startGenerationJob(payload: {
  categoryId: string;
  modelImage: string;
  productImage: string;
}) {
  const token = await getAuthToken();
  const response = await axios.post(
    `${_backendURL}/generate/generate-image`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data as {
    jobId: string;
    totalImages: number;
    scenarios: { id: string; label: string }[];
  };
}

/**
 * Start a catalogue generation job with multiple model images.
 */
export async function startCatalogueGenerationJob(payload: {
  categoryId: string;
  modelImages: string[];
  productImage: string;
  modelLabels: string[];
}) {
  const token = await getAuthToken();
  const response = await axios.post(
    `${_backendURL}/generate/generate-catalogue`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data as {
    jobId: string;
    totalImages: number;
    scenarios: { id: string; label: string }[];
  };
}

/**
 * Start a branding generation job with pose, product, logo, and business details.
 */
export async function startBrandingGenerationJob(payload: {
  categoryId: string;
  modelId: string;
  poseImage: string;
  productImage: string;
  logoImage: string | null;
  businessName: string;
  phoneNumber?: string;
  address?: string;
  webUrl?: string;
  backgroundColor?: string | null;
  backgroundLabel?: string;
  aspectRatio?: string;
  aspectRatioDescription?: string;
}) {
  const token = await getAuthToken();
  const response = await axios.post(
    `${_backendURL}/generate/generate-branding`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data as {
    jobId: string;
    totalImages: number;
    scenarios: { id: string; label: string }[];
  };
}

/**
 * Poll a job for its current status + images generated so far.
 */
export async function pollJobStatus(jobId: string) {
  const response = await axios.get(
    `${_backendURL}/generate/job/${jobId}`
  );
  return response.data as {
    jobId: string;
    status: "generating" | "done";
    totalImages: number;
    completedImages: number;
    currentScenario: string | null;
    images: { scenarioId: string; label: string; imageUrl: string }[];
    errors: { scenarioId: string; label: string; error: string }[];
  };
}

/**
 * Get app settings like per_image_cost (public endpoint, no auth required)
 */
export async function getAppSettings() {
  const response = await axios.get(`${_backendURL}/user/app-settings`);
  return response.data as {
    success: boolean;
    per_image_cost: number;
  };
}

/**
 * Get user's current credit balance
 */
export async function getUserCredits() {
  const token = await getAuthToken();
  const response = await axios.get(
    `${_backendURL}/purchase/credits`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data as {
    success: boolean;
    credits: number;
  };
}

/**
 * Verify purchase with backend after Google Play purchase
 */
export const verifyPurchase = async (purchaseData: {
  productId: string;
  purchaseToken: string;
  packageName: string;
  transactionId?: string;
}) => {
  console.log('\n' + '='.repeat(60));
  console.log('📤 SENDING PURCHASE VERIFICATION TO BACKEND');
  console.log('='.repeat(60));
  console.log('🏷️  Product ID:', purchaseData.productId);
  console.log('🎫 Purchase Token:', purchaseData.purchaseToken.substring(0, 50) + '...');
  console.log('📱 Package Name:', purchaseData.packageName);
  console.log('🔖 Transaction ID:', purchaseData.transactionId || 'N/A');
  console.log('🌐 Backend URL:', `${_backendURL}/purchase/verify`);
  
  try {
    const token = await getAuthToken();
    const response = await axios.post(
      `${_backendURL}/purchase/verify`,
      purchaseData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('\n📥 BACKEND RESPONSE:');
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    if (response.data.credits_added) {
      console.log('   Credits Added:', response.data.credits_added);
      console.log('   Total Credits:', response.data.total_credits);
    }
    if (response.data.error) {
      console.log('   Error:', response.data.error);
    }
    console.log('='.repeat(60) + '\n');
    
    return response.data;
  } catch (error: any) {
    console.log('\n❌ VERIFICATION REQUEST FAILED:');
    console.log('   Error:', error.message);
    console.log('   Stack:', error.stack);
    console.log('='.repeat(60) + '\n');
    throw error;
  }
};

/**
 * Get available product packages
 */
export async function getProducts() {
  const response = await axios.get(`${_backendURL}/purchase/products`);
  return response.data as {
    success: boolean;
    products: Array<{
      id: string;
      credits: number;
      price: number;
      currency: string;
      price_display: string;
    }>;
    cost_per_image: number;
  };
}

/**
 * Get user's transaction history
 */
export async function getTransactions(limit: number = 50) {
  const token = await getAuthToken();
  const response = await axios.get(
    `${_backendURL}/purchase/transactions?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data as {
    success: boolean;
    transactions: Array<{
      _id: string;
      product_id: string;
      credits: number;
      amount: number;
      status: string;
      created_at: string;
    }>;
  };
}
