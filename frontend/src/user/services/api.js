// API layer — web port of the mobile app's src/services/*.ts
// Talks to the same Flask + MongoDB backend.
import axios from 'axios';
import { API_BASE_URL } from '../config';

axios.defaults.timeout = 30000;

function getAuthToken() {
  return localStorage.getItem('auth_token');
}

// The backend expects RAW base64 (like the mobile app sends via expo-file-system),
// so strip the "data:image/...;base64," prefix browsers add.
function toRawBase64(value) {
  if (typeof value === 'string' && value.startsWith('data:')) {
    return value.split(',')[1] || value;
  }
  return value;
}

function authHeaders() {
  return { Authorization: `Bearer ${getAuthToken()}` };
}

// ─── Auth (authApi.ts) ───────────────────────────────────────────────────────

export async function signupUser(name, email, phone, password) {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/signup`, {
      name,
      email,
      phone,
      password,
    });
    return res.data;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Signup failed',
    };
  }
}

export async function loginUser(email, password) {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    return res.data;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Login failed',
    };
  }
}

export async function googleSignIn(idToken) {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/google-signin`, {
      id_token: idToken,
    });
    return res.data;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Google sign-in failed',
    };
  }
}

export async function verifyToken(token) {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/verify-token`, { token });
    return res.data;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Token verification failed',
    };
  }
}

// ─── Content (contentApi.ts) ─────────────────────────────────────────────────

export async function fetchCategories() {
  const res = await axios.get(`${API_BASE_URL}/content/categories`);
  return res.data;
}

export async function fetchCategory(categoryId) {
  const res = await axios.get(`${API_BASE_URL}/content/categories/${categoryId}`);
  return res.data;
}

export async function fetchPhotoshootModels() {
  const res = await axios.get(`${API_BASE_URL}/content/models?sub_type=photoshoot`);
  return res.data;
}

export async function fetchCatalogueModels() {
  const res = await axios.get(`${API_BASE_URL}/content/models?sub_type=catalogue`);
  return res.data;
}

export async function fetchCatalogueModel(modelId) {
  const res = await axios.get(`${API_BASE_URL}/content/models/${modelId}`);
  return res.data;
}

export async function fetchBrandingModels() {
  const res = await axios.get(`${API_BASE_URL}/content/models?sub_type=branding`);
  return res.data;
}

export async function fetchBrandingBackgrounds() {
  const res = await axios.get(`${API_BASE_URL}/content/branding-backgrounds`);
  return res.data;
}

// ─── Generation (api.ts) ─────────────────────────────────────────────────────

export async function startGenerationJob(payload) {
  // payload: { categoryId, modelImage, productImage }
  const body = {
    ...payload,
    modelImage: toRawBase64(payload.modelImage),
    productImage: toRawBase64(payload.productImage),
  };
  const res = await axios.post(`${API_BASE_URL}/generate/generate-image`, body, {
    headers: authHeaders(),
  });
  return res.data; // { jobId, totalImages, scenarios }
}

export async function startCatalogueGenerationJob(payload) {
  // payload: { categoryId, modelImages, productImage, modelLabels }
  const body = {
    ...payload,
    modelImages: (payload.modelImages || []).map(toRawBase64),
    productImage: toRawBase64(payload.productImage),
  };
  const res = await axios.post(`${API_BASE_URL}/generate/generate-catalogue`, body, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function startBrandingGenerationJob(payload) {
  // payload: { categoryId, modelId, poseImage, productImage, logoImage,
  //            businessName, phoneNumber, address, webUrl,
  //            backgroundColor, backgroundLabel, aspectRatio, aspectRatioDescription }
  const body = {
    ...payload,
    poseImage: toRawBase64(payload.poseImage),
    productImage: toRawBase64(payload.productImage),
    logoImage: payload.logoImage ? toRawBase64(payload.logoImage) : null,
  };
  const res = await axios.post(`${API_BASE_URL}/generate/generate-branding`, body, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function pollJobStatus(jobId) {
  const res = await axios.get(`${API_BASE_URL}/generate/job/${jobId}`);
  return res.data; // { jobId, status, totalImages, completedImages, currentScenario, images, errors }
}

// ─── User (userApi.ts) ───────────────────────────────────────────────────────

export async function fetchMyGenerations(category) {
  const res = await axios.get(`${API_BASE_URL}/user/my-generations`, {
    headers: authHeaders(),
    params: category && category !== 'all' ? { category } : {},
  });
  return res.data; // { generations, total, categories }
}

export async function fetchMyProfile() {
  const res = await axios.get(`${API_BASE_URL}/user/my-profile`, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function updateMyProfile(payload) {
  // payload: { name, phone, profile_picture? }
  const res = await axios.put(`${API_BASE_URL}/user/my-profile`, payload, {
    headers: authHeaders(),
  });
  return res.data.user;
}

export async function getAppSettings() {
  const res = await axios.get(`${API_BASE_URL}/user/app-settings`);
  return res.data; // { success, per_image_cost }
}

// ─── Developer API Keys (api_keys routes) ────────────────────────────────────

// NOTE: the management API lives under /user/api-keys (NOT /api-keys). The latter
// is the SPA's dashboard page route, which the production proxy serves as static
// HTML; /user/* is forwarded to Flask, so the API must sit beneath it.
export async function fetchApiPlans() {
  const res = await axios.get(`${API_BASE_URL}/user/api-keys/plans`, {
    headers: authHeaders(),
  });
  return res.data; // { success, plans }
}

export async function listApiKeys() {
  const res = await axios.get(`${API_BASE_URL}/user/api-keys`, {
    headers: authHeaders(),
  });
  return res.data; // { success, keys }
}

export async function createApiKey(name, plan) {
  const res = await axios.post(
    `${API_BASE_URL}/user/api-keys`,
    { name, plan },
    { headers: authHeaders() }
  );
  return res.data; // { success, key: { ...fields, secret } }  <- secret shown once
}

export async function rotateApiKey(keyId) {
  const res = await axios.post(
    `${API_BASE_URL}/user/api-keys/${keyId}/rotate`,
    {},
    { headers: authHeaders() }
  );
  return res.data; // { success, key: { ...fields, secret } }
}

export async function revokeApiKey(keyId) {
  const res = await axios.delete(`${API_BASE_URL}/user/api-keys/${keyId}`, {
    headers: authHeaders(),
  });
  return res.data; // { success, message }
}

// ─── Credits & Purchases (api.ts / purchase routes) ─────────────────────────

export async function getUserCredits() {
  const res = await axios.get(`${API_BASE_URL}/purchase/credits`, {
    headers: authHeaders(),
  });
  return res.data; // { success, credits }
}

export async function getProducts() {
  const res = await axios.get(`${API_BASE_URL}/purchase/products`);
  return res.data; // { success, products, cost_per_image }
}

export async function getTransactions(limit = 50) {
  const res = await axios.get(`${API_BASE_URL}/purchase/transactions?limit=${limit}`, {
    headers: authHeaders(),
  });
  return res.data; // { success, transactions }
}

// ─── Video / Ads (videoApi.ts) ───────────────────────────────────────────────

export async function refinePrompt(prompt, category = 'general') {
  const res = await axios.post(`${API_BASE_URL}/video/refine-prompt`, {
    prompt,
    category,
  });
  return res.data;
}

export async function generateVideo(prompt, category = 'general', aspectRatio = '9:16', resolution = '720p') {
  const res = await axios.post(
    `${API_BASE_URL}/video/generate`,
    { prompt, category, aspectRatio, resolution },
    {
      timeout: 300000, // Veo generation + server-side download can take a few minutes
      headers: authHeaders(),
    }
  );
  return res.data;
}
