# Brand Shoot AI - Frontend Documentation
## Mobile Application (React Native + Expo)

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture & Design Patterns](#3-architecture--design-patterns)
4. [Application Features](#4-application-features)
5. [User Flows](#5-user-flows)
6. [Component Structure](#6-component-structure)
7. [State Management](#7-state-management)
8. [API Integration](#8-api-integration)
9. [In-App Purchases](#9-in-app-purchases)
10. [Admin Panel](#10-admin-panel)
11. [References for ER Diagrams](#11-references-for-er-diagrams)

---

## 1. PROJECT OVERVIEW

### 1.1 Application Name
**Brand Shoot AI** (Package: `com.anonymous.flyrclonetest`)

### 1.2 Purpose
Brand Shoot AI is an AI-powered mobile application that enables users to generate professional product photoshoots, catalogues, and branded marketing materials using artificial intelligence. The app eliminates the need for expensive photoshoots by allowing users to upload product images and model photos, which are then processed through AI to create realistic, high-quality marketing images.

### 1.3 Target Users
- **E-commerce Sellers**: Generate product images for online stores
- **Small Business Owners**: Create branded marketing materials
- **Fashion Designers**: Showcase clothing on virtual models
- **Jewelry Brands**: Display jewelry on models without physical photoshoots
- **Marketing Professionals**: Create ad campaigns quickly

### 1.4 Core Value Proposition
- **Cost-Effective**: Eliminates expensive photoshoot costs
- **Time-Saving**: Generate images in minutes instead of days
- **Scalable**: Create unlimited variations of product images
- **Professional Quality**: AI-generated images suitable for e-commerce and marketing

### 1.5 Version Information
- **Current Version**: 1.0.3
- **Platform**: Android (iOS support available)
- **Minimum SDK**: Android 5.0+

---

## 2. TECHNOLOGY STACK

### 2.1 Core Framework
- **React Native**: 0.81.5
- **Expo**: ~54.0.32
- **React**: 19.1.0
- **TypeScript**: ~5.9.2

### 2.2 Navigation
- **@react-navigation/native**: ^7.1.28
- **@react-navigation/native-stack**: ^7.11.0
- Stack-based navigation with conditional routing based on authentication state

### 2.3 State Management
- **React Context API**: For global authentication state
- **Local Component State**: Using React hooks (useState, useEffect)
- **AsyncStorage**: For persistent data storage

### 2.4 Key Libraries

#### Authentication & Security
- `@react-native-google-signin/google-signin`: ^16.1.1 - Google OAuth integration
- `@react-native-async-storage/async-storage`: ^2.2.0 - Secure local storage

#### Media Handling
- `expo-image-picker`: ~17.0.10 - Image selection from gallery/camera
- `expo-media-library`: ^18.2.1 - Save generated images to device
- `expo-file-system`: ~19.0.21 - File management
- `react-native-image-zoom-viewer`: ^3.0.1 - Image zoom functionality

#### In-App Purchases
- `react-native-iap`: ^14.7.12 - Google Play billing integration

#### UI Components
- `react-native-vector-icons`: ^10.3.0 - Icon library
- `@react-native-community/slider`: 5.0.1 - Custom sliders
- `react-native-safe-area-context`: ~5.6.0 - Safe area handling

#### HTTP Client
- `axios`: ^1.13.4 - API communication with backend

### 2.5 Development Tools
- **Expo Dev Client**: ~6.0.20 - Custom development builds
- **TypeScript**: Type-safe development
- **React DevTools**: Debugging

---

## 3. ARCHITECTURE & DESIGN PATTERNS

### 3.1 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Card, Header, Text)
│   ├── CategoryCard.tsx
│   ├── ModelCard.tsx
│   ├── IAPProvider.tsx
│   └── ...
├── screens/            # Application screens
│   ├── auth/          # Authentication screens
│   ├── admin/         # Admin panel screens
│   ├── ads/           # Ad generation screens
│   └── ...            # Main app screens
├── services/          # API and business logic
│   ├── api.ts         # Main API service
│   ├── authApi.ts     # Authentication API
│   ├── iapService.ts  # In-app purchase logic
│   └── ...
├── context/           # React Context providers
│   └── AuthContext.tsx
├── navigation/        # Navigation configuration
│   └── AppNavigator.tsx
├── theme/            # Design system
│   ├── colors.ts
│   ├── spacing.ts
│   └── typography.ts
├── constants/        # Static data
│   ├── categories.ts
│   ├── models.ts
│   └── ...
└── utils/           # Utility functions
```

### 3.2 Design Patterns

#### 3.2.1 Component-Based Architecture
- **Atomic Design Principle**: Components organized from atoms (buttons) to organisms (cards) to templates (screens)
- **Reusability**: Shared components in `/components` folder
- **Separation of Concerns**: UI components separate from business logic

#### 3.2.2 Context Pattern
- **AuthContext**: Global authentication state management
- **IAPProvider**: In-app purchase state and listeners
- Provides centralized state accessible throughout the app

#### 3.2.3 Service Layer Pattern
- **API Services**: Centralized API communication
- **Business Logic**: Separated from UI components
- **Error Handling**: Consistent error handling across services

#### 3.2.4 Navigation Pattern
- **Conditional Routing**: Different navigation stacks based on user role
  - Auth Stack (Login/Signup)
  - Admin Stack (Admin Dashboard)
  - User Stack (Main App)
- **Stack Navigation**: Linear flow for user journeys

### 3.3 State Management Strategy

#### 3.3.1 Global State (Context API)
```typescript
AuthContext:
- user: User object
- token: JWT token
- isAuthenticated: boolean
- isAdmin: boolean
- login(), signup(), logout()
```

#### 3.3.2 Local State (Component State)
- Form inputs
- UI state (loading, modals)
- Screen-specific data

#### 3.3.3 Persistent State (AsyncStorage)
- Authentication token
- User preferences
- Processed purchase tokens (IAP deduplication)

---

## 4. APPLICATION FEATURES

### 4.1 Authentication System

#### 4.1.1 Email/Password Authentication
- User registration with name, email, phone, password
- Secure login with JWT token generation
- Token-based session management
- Automatic token verification on app launch

#### 4.1.2 Google OAuth Integration
- One-tap Google Sign-In
- Automatic account creation for new Google users
- Seamless authentication flow

#### 4.1.3 Role-Based Access Control
- **User Role**: Access to main app features
- **Admin Role**: Access to admin dashboard and content management
- Conditional navigation based on user role

### 4.2 Image Generation Features

#### 4.2.1 Photoshoot Generation
**Purpose**: Place products on models in professional settings

**User Flow**:
1. Select category (Jewelry, Fashion, Home, etc.)
2. Choose pre-loaded model or upload custom model image
3. Upload product image
4. AI generates multiple scenario-based images
5. View, download, or share results

**Scenarios Generated**:
- Temple Visit (for jewelry)
- Party Look
- Wedding
- Travel
- Casual Day
- Category-specific scenarios

**Technical Implementation**:
- Multi-image generation with polling mechanism
- Real-time progress updates
- Scenario-based prompt engineering
- Credit-based system (1 credit per image)

#### 4.2.2 Catalogue Generation
**Purpose**: Create product catalogues with multiple model poses and backgrounds

**User Flow**:
1. Select category
2. Choose main model (gender/style)
3. Select multiple model poses (side view, sitting, product view, etc.)
4. Choose background (solid color or texture)
5. Upload product image
6. Generate catalogue set
7. View grid of generated images

**Features**:
- Multiple pose selection (up to 5 poses)
- Background customization
- Batch generation
- Grid view display

**Technical Implementation**:
- Batch API calls for multiple poses
- Background color/texture integration
- Model pose preservation
- Catalogue-specific prompts

#### 4.2.3 Branding Generation
**Purpose**: Create branded marketing materials with logo and business details

**User Flow**:
1. Select category
2. Choose model pose
3. Upload product image
4. Upload business logo (optional)
5. Enter business details:
   - Business name
   - Phone number
   - Address
   - Website URL
6. Select background
7. Generate branded images (Main + Clean variants)

**Features**:
- Logo placement (bottom-left or top-right)
- Business information overlay
- Two variants: Main (with branding) and Clean (without branding)
- Professional branding strip design

**Technical Implementation**:
- Logo image upload and integration
- Text overlay rendering
- Dual variant generation
- Branding-specific prompts

#### 4.2.4 Video Ad Generation (Coming Soon)
**Purpose**: Create short video advertisements

**Current Status**: UI placeholder implemented
**Planned Features**:
- Text-to-video generation
- Product video creation
- Social media ad formats

### 4.3 User Management Features

#### 4.3.1 User Profile
- View profile information
- Display current credit balance
- Edit profile details
- Profile picture management
- Account status display

#### 4.3.2 Generation History
- View all past generations
- Filter by type (Photoshoot, Catalogue, Branding)
- View generation details:
  - Category
  - Number of images
  - Generation date
  - Credits used
- Re-download previous images
- Delete history entries

#### 4.3.3 Credit System
- Display current credit balance
- Credit deduction on image generation
- Low credit warnings
- Purchase more credits via IAP

### 4.4 In-App Purchase System

#### 4.4.1 Credit Packages
- **10 Images**: Entry-level package
- **25 Images**: Popular package
- **50 Images**: Value package
- **100 Images**: Premium package

#### 4.4.2 Purchase Flow
1. User selects credit package
2. Google Play billing initiated
3. Purchase confirmation
4. Backend verification with Google Play API
5. Credits added to user account
6. Success/failure notification

#### 4.4.3 Purchase Security
- **Frontend Deduplication**: Prevents multiple verification requests
- **Backend Atomic Operations**: Prevents race conditions
- **Token Tracking**: Processed tokens stored to prevent replay attacks
- **Google Play Verification**: Server-side purchase validation

### 4.5 Admin Panel Features

#### 4.5.1 Dashboard
- **User Statistics**:
  - Total users
  - Active users
  - New users (today/week/month)
- **Generation Statistics**:
  - Total generations
  - Generations by type
  - Popular categories
- **Token Usage**:
  - Total tokens consumed
  - Token usage trends
  - Cost analysis
- **Revenue Metrics**:
  - Total purchases
  - Revenue by package
  - Purchase trends

#### 4.5.2 User Management
- **User List**:
  - Search and filter users
  - View user details
  - User status (active/inactive)
- **User Details**:
  - Profile information
  - Generation history
  - Token usage breakdown
  - Purchase history
  - Credit management (add/remove credits)
  - User status control

#### 4.5.3 Content Management
- **Categories**:
  - Create/edit/delete categories
  - Set category order
  - Upload showcase images
  - Manage prompts (Photoshoot, Catalogue, Branding)
  - Enable/disable categories
  - Icon customization

- **Models**:
  - Upload model images
  - Categorize models (Photoshoot, Catalogue, Branding)
  - Set model labels
  - Manage model availability

- **Backgrounds**:
  - Upload background images/textures
  - Set background colors
  - Categorize backgrounds
  - Background labels

- **Prompts**:
  - System prompts
  - Category-specific prompts
  - Quality prompts
  - Template management

#### 4.5.4 Analytics
- **Token Statistics**:
  - Daily/weekly/monthly token usage
  - Token usage by user
  - Token usage by category
  - Cost per generation
  - Trend analysis

- **User Analytics**:
  - User growth charts
  - Active user metrics
  - User engagement
  - Retention analysis

---

## 5. USER FLOWS

### 5.1 Authentication Flow

```
App Launch
    ↓
Check Stored Token
    ↓
    ├─→ Token Valid → Verify with Backend → Main App/Admin Panel
    └─→ No Token/Invalid → Login Screen
            ↓
            ├─→ Email/Password Login → JWT Token → AsyncStorage → Main App
            ├─→ Google Sign-In → Google OAuth → JWT Token → Main App
            └─→ Sign Up → Create Account → JWT Token → Main App
```

### 5.2 Photoshoot Generation Flow

```
Home Screen
    ↓
Select Category (Jewelry/Fashion/etc.)
    ↓
Model Selection Screen
    ├─→ Choose Pre-loaded Model
    └─→ Upload Custom Model
    ↓
Upload Product Image
    ↓
Check Credits (Sufficient?)
    ├─→ Yes → Start Generation
    └─→ No → Buy More Credits Screen
    ↓
Generation Process (Backend)
    ├─→ Poll Job Status (every 4 seconds)
    ├─→ Update Progress
    └─→ Receive Images
    ↓
Result Screen
    ├─→ View Images (Zoom, Swipe)
    ├─→ Download to Gallery
    └─→ Share Images
```

### 5.3 Catalogue Generation Flow

```
Home Screen → Catalogue
    ↓
Select Category
    ↓
Choose Main Model (Gender/Style)
    ↓
Select Model Poses (Multiple Selection)
    ├─→ Side View
    ├─→ Sitting
    ├─→ Product View
    ├─→ Key Highlights
    └─→ Before
    ↓
Choose Background
    ├─→ Solid Color
    └─→ Texture/Image
    ↓
Upload Product Image
    ↓
Check Credits (1 credit per pose)
    ↓
Generate Catalogue
    ↓
Result Screen (Grid View)
    ├─→ View All Images
    ├─→ Download Individual/All
    └─→ Share
```

### 5.4 Branding Generation Flow

```
Home Screen → Branding
    ↓
Select Category
    ↓
Choose Model Pose
    ↓
Upload Product Image
    ↓
Upload Business Logo (Optional)
    ↓
Enter Business Details
    ├─→ Business Name (Required)
    ├─→ Phone Number
    ├─→ Address
    └─→ Website URL
    ↓
Select Background
    ↓
Check Credits (2 credits: Main + Clean)
    ↓
Generate Branded Images
    ↓
Result Screen
    ├─→ View Main Variant (with branding)
    ├─→ View Clean Variant (without branding)
    ├─→ Download Both
    └─→ Share
```

### 5.5 In-App Purchase Flow

```
Low Credits Warning / Buy More Images Screen
    ↓
Select Credit Package
    ├─→ 10 Images
    ├─→ 25 Images
    ├─→ 50 Images
    └─→ 100 Images
    ↓
Initiate Google Play Purchase
    ↓
Google Play Billing
    ├─→ User Confirms Purchase
    └─→ Payment Processing
    ↓
Purchase Success
    ↓
Frontend Verification Request
    ├─→ Check Deduplication (AsyncStorage)
    └─→ Send to Backend
    ↓
Backend Verification
    ├─→ Verify with Google Play API
    ├─→ Check Duplicate (Database)
    └─→ Add Credits to User Account
    ↓
Success Modal
    ├─→ Display Credits Added
    └─→ Return to App
```

### 5.6 Admin Content Management Flow

```
Admin Dashboard
    ↓
Content Management
    ↓
    ├─→ Categories
    │   ├─→ View All Categories
    │   ├─→ Add New Category
    │   │   ├─→ Basic Info (ID, Title, Icon, Order)
    │   │   ├─→ Prompts (Photoshoot, Catalogue, Branding)
    │   │   ├─→ Showcase Items (Before/After Images)
    │   │   └─→ Enable/Disable Status
    │   ├─→ Edit Category
    │   └─→ Delete Category
    │
    ├─→ Models
    │   ├─→ Upload Model Images
    │   ├─→ Set Category & Type
    │   ├─→ Add Labels
    │   └─→ Manage Availability
    │
    ├─→ Backgrounds
    │   ├─→ Upload Background Images
    │   ├─→ Set Colors
    │   └─→ Categorize
    │
    └─→ Prompts
        ├─→ System Prompts
        ├─→ Category Prompts
        └─→ Quality Prompts
```

---

## 6. COMPONENT STRUCTURE

### 6.1 Screen Components

#### 6.1.1 Authentication Screens

**LoginScreen.tsx**
- Email/password input fields
- Google Sign-In button
- Form validation
- Error handling
- Navigation to Signup

**SignupScreen.tsx**
- Name, email, phone, password inputs
- Form validation (email format, password strength)
- Terms & conditions checkbox
- Navigation to Login

#### 6.1.2 Main App Screens

**HomeScreen.tsx**
- Category grid display
- User credit balance
- Quick access to generation types
- Sidebar navigation
- Profile access

**CategoryScreen.tsx**
- Subcategory selection (Photoshoot/Catalogue/Branding)
- Category-specific information
- Navigation to respective flows

**ModelSelectionScreen.tsx**
- Pre-loaded model grid
- Upload custom model option
- Model preview
- Category-specific models

**UploadScreen.tsx**
- Product image upload
- Image preview
- Crop/edit options
- Validation

**ResultScreen.tsx**
- Image carousel/grid
- Zoom functionality
- Download button
- Share functionality
- Loading states with progress

#### 6.1.3 Catalogue Screens

**CatalogueMainModelSelectionScreen.tsx**
- Main model selection (gender/style)
- Model preview cards

**CatalogueModelSelectionScreen.tsx**
- Multiple pose selection
- Checkbox selection UI
- Selected poses counter

**CatalogueBackgroundSelectionScreen.tsx**
- Background color picker
- Background texture gallery
- Preview

**CatalogueUploadScreen.tsx**
- Product upload
- Summary of selections

**CatalogueResultScreen.tsx**
- Grid view of generated images
- Individual image download
- Batch download

#### 6.1.4 Branding Screens

**BrandingMainModelSelectionScreen.tsx**
- Model selection for branding

**BrandingPoseSelectionScreen.tsx**
- Single pose selection

**BrandingSettingsScreen.tsx**
- Business details form
- Logo upload
- Background selection

**BrandingUploadScreen.tsx**
- Product upload
- Generation summary

**BrandingResultScreen.tsx**
- Main variant display
- Clean variant display
- Toggle between variants

#### 6.1.5 User Screens

**UserProfileScreen.tsx**
- User information display
- Credit balance
- Edit profile form
- Logout button

**UserHistoryScreen.tsx**
- Generation history list
- Filter by type
- View details
- Re-download images

**BuyMoreImagesScreen.tsx**
- Credit package cards
- Pricing display
- Purchase button
- Current balance

#### 6.1.6 Admin Screens

**AdminDashboardScreen.tsx**
- Statistics cards
- Charts and graphs
- Quick actions
- Recent activity

**AdminUsersScreen.tsx**
- User list with search
- User status indicators
- Navigation to user details

**AdminUserDetailScreen.tsx**
- User profile information
- Generation history
- Token usage breakdown
- Credit management
- Purchase history

**AdminCategoriesScreen.tsx**
- Category list
- Add/edit/delete categories
- Prompt management
- Showcase image upload
- Enable/disable toggle

**AdminModelsScreen.tsx**
- Model image upload
- Model categorization
- Label management

**AdminBackgroundsScreen.tsx**
- Background upload
- Color management

**AdminPromptsScreen.tsx**
- Prompt template editor
- System prompt management

**AdminTokenStatsScreen.tsx**
- Token usage analytics
- Charts and trends
- Cost analysis

### 6.2 Reusable Components

#### 6.2.1 UI Components

**AppButton.tsx**
```typescript
Props:
- title: string
- onPress: function
- variant: 'primary' | 'secondary' | 'outline'
- loading: boolean
- disabled: boolean
- icon: ReactNode
```

**AppCard.tsx**
```typescript
Props:
- children: ReactNode
- style: StyleProp
- onPress: function (optional)
- elevation: number
```

**AppHeader.tsx**
```typescript
Props:
- title: string
- showBack: boolean
- onBackPress: function
- rightComponent: ReactNode
```

**AppText.tsx**
```typescript
Props:
- children: string
- variant: 'h1' | 'h2' | 'body' | 'caption'
- color: string
- style: StyleProp
```

#### 6.2.2 Feature Components

**CategoryCard.tsx**
- Category icon display
- Category title
- Tap to navigate
- Visual feedback

**ModelCard.tsx**
- Model image display
- Selection state
- Tap to select

**CatalogueCard.tsx**
- Multiple image display
- Grid layout
- Selection indicators

**BeforeAfterSlider.tsx**
- Before/after image comparison
- Slider control
- Smooth transition

**UploadDropzone.tsx**
- Drag-and-drop area (web)
- Tap to upload (mobile)
- File validation
- Preview

**SidebarDrawer.tsx**
- Navigation menu
- User profile section
- Credit display
- Menu items
- Logout

**InsufficientCreditsModal.tsx**
- Credit warning
- Package suggestions
- Navigate to purchase

**PurchaseSuccessModal.tsx**
- Success animation
- Credits added display
- Confetti effect

**PurchaseCancelledModal.tsx**
- Cancellation message
- Retry option

**IAPProvider.tsx**
- IAP connection initialization
- Purchase listener setup
- Pending purchase resolution

---

## 7. STATE MANAGEMENT

### 7.1 Authentication State (AuthContext)

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name, email, phone, password) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

**State Flow**:
1. App launches → Check AsyncStorage for token
2. Token found → Verify with backend
3. Valid token → Set user and token state
4. Invalid/No token → Show login screen
5. Login success → Store token in AsyncStorage
6. Logout → Clear token from AsyncStorage

### 7.2 Component State Patterns

#### 7.2.1 Form State
```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [errors, setErrors] = useState({});
const [loading, setLoading] = useState(false);
```

#### 7.2.2 Data Fetching State
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

#### 7.2.3 Modal State
```typescript
const [modalVisible, setModalVisible] = useState(false);
const [modalData, setModalData] = useState(null);
```

### 7.3 Persistent State (AsyncStorage)

**Stored Data**:
- `auth_token`: JWT authentication token
- `processed_purchase_tokens`: Set of processed IAP tokens
- User preferences (future implementation)

**Usage Pattern**:
```typescript
// Store
await AsyncStorage.setItem('auth_token', token);

// Retrieve
const token = await AsyncStorage.getItem('auth_token');

// Remove
await AsyncStorage.removeItem('auth_token');
```

---

## 8. API INTEGRATION

### 8.1 API Service Architecture

**Base Configuration** (`services/api.ts`):
```typescript
export const backendURL = 'http://72.62.79.188:8001';
axios.defaults.timeout = 30000;
axios.defaults.headers.common['Content-Type'] = 'application/json';
```

**Authentication Header**:
```typescript
async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem("auth_token");
}

// Usage in API calls
const token = await getAuthToken();
const response = await axios.post(url, data, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 8.2 API Endpoints

#### 8.2.1 Authentication APIs (`authApi.ts`)

**Login**
```typescript
POST /auth/login
Body: { email, password }
Response: { success, token, user }
```

**Signup**
```typescript
POST /auth/signup
Body: { name, email, phone, password }
Response: { success, token, user }
```

**Google Sign-In**
```typescript
POST /auth/google-signin
Body: { idToken }
Response: { success, token, user }
```

**Verify Token**
```typescript
POST /auth/verify-token
Headers: { Authorization: Bearer <token> }
Response: { success, user }
```

#### 8.2.2 Generation APIs (`api.ts`)

**Start Photoshoot Generation**
```typescript
POST /generate/generate-image
Headers: { Authorization }
Body: {
  categoryId: string,
  modelImage: base64,
  productImage: base64
}
Response: {
  jobId: string,
  totalImages: number,
  scenarios: Array<{id, label}>
}
```

**Start Catalogue Generation**
```typescript
POST /generate/generate-catalogue
Body: {
  categoryId,
  modelImages: base64[],
  productImage: base64,
  modelLabels: string[]
}
Response: { jobId, totalImages, scenarios }
```

**Start Branding Generation**
```typescript
POST /generate/generate-branding
Body: {
  categoryId,
  modelId,
  poseImage: base64,
  productImage: base64,
  logoImage: base64 | null,
  businessName,
  phoneNumber,
  address,
  webUrl,
  backgroundColor,
  backgroundLabel
}
Response: { jobId, totalImages, scenarios }
```

**Poll Job Status**
```typescript
GET /generate/job-status/:jobId
Headers: { Authorization }
Response: {
  status: 'pending' | 'processing' | 'done',
  currentScenario,
  totalScenarios,
  images: Array<{scenarioId, label, imageUrl}>
}
```

#### 8.2.3 User APIs (`userApi.ts`)

**Get User Profile**
```typescript
GET /user/profile
Headers: { Authorization }
Response: { user }
```

**Update User Profile**
```typescript
PUT /user/profile
Body: { name, phone, profile_picture }
Response: { success, user }
```

**Get Generation History**
```typescript
GET /user/generations
Headers: { Authorization }
Response: { generations: Array }
```

**Get App Settings**
```typescript
GET /user/app-settings
Response: { per_image_cost, ... }
```

#### 8.2.4 Content APIs (`contentApi.ts`)

**Get Categories**
```typescript
GET /content/categories
Response: { categories: Array }
```

**Get Models**
```typescript
GET /content/models/:type
Response: { models: Array }
```

**Get Backgrounds**
```typescript
GET /content/backgrounds
Response: { backgrounds: Array }
```

#### 8.2.5 Purchase APIs (`iapService.ts`)

**Verify Purchase**
```typescript
POST /purchase/verify
Headers: { Authorization }
Body: {
  productId,
  purchaseToken,
  packageName,
  transactionId
}
Response: {
  success,
  credits_added,
  new_balance
}
```

#### 8.2.6 Admin APIs (`adminApi.ts`)

**Dashboard Stats**
```typescript
GET /admin/dashboard-stats
Headers: { Authorization }
Response: {
  total_users,
  total_generations,
  total_tokens,
  ...
}
```

**Get Users**
```typescript
GET /admin/users
Response: { users: Array }
```

**Get User Detail**
```typescript
GET /admin/users/:userId
Response: { user, generation_stats }
```

**Add User Credits**
```typescript
POST /admin/users/:userId/credits
Body: { credits, reason }
Response: { success, new_balance }
```

**Content Management**
```typescript
GET /admin/content/:collection
POST /admin/content/:collection
PUT /admin/content/:collection/:id
DELETE /admin/content/:collection/:id
```

### 8.3 Error Handling

**Axios Interceptor**:
```typescript
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (error.message === 'Network Error') {
      console.error('Network Error');
    } else if (error.response) {
      console.error('Server Error:', error.response.status);
    }
    return Promise.reject(error);
  }
);
```

**Component-Level Error Handling**:
```typescript
try {
  const response = await api.someEndpoint();
  // Handle success
} catch (error) {
  console.error('Error:', error);
  Alert.alert('Error', 'Something went wrong');
}
```

---

## 9. IN-APP PURCHASES

### 9.1 IAP Architecture

**Product SKUs**:
```typescript
const PRODUCT_SKUS = [
  'image_pack_10',   // 10 credits
  'image_pack_25',   // 25 credits
  'image_pack_50',   // 50 credits
  'image_pack_100',  // 100 credits
];
```

### 9.2 Purchase Flow Implementation

#### 9.2.1 Initialization
```typescript
export const initializeIAP = async (): Promise<boolean> => {
  await RNIap.initConnection();
  await RNIap.flushFailedPurchasesCachedAsPendingAndroid();
  return true;
};
```

#### 9.2.2 Get Products
```typescript
export const getProducts = async () => {
  const products = await RNIap.getProducts({ skus: PRODUCT_SKUS });
  return products;
};
```

#### 9.2.3 Purchase Product
```typescript
export const purchaseProduct = async (productId: string) => {
  return new Promise(async (resolve, reject) => {
    pendingPurchases.set(productId, { resolve, reject });
    await RNIap.requestPurchase({ skus: [productId] });
    
    // Timeout after 5 minutes
    setTimeout(() => {
      if (pendingPurchases.has(productId)) {
        pendingPurchases.delete(productId);
        reject(new Error('Purchase timeout'));
      }
    }, 300000);
  });
};
```

#### 9.2.4 Purchase Listener
```typescript
export const setupPurchaseListener = (onSuccess, onError) => {
  const subscription = RNIap.purchaseUpdatedListener(async (purchase) => {
    const { productId, transactionReceipt, purchaseToken } = purchase;
    
    // Check deduplication
    if (verifyingPurchases.has(purchaseToken)) {
      return; // Already processing
    }
    
    verifyingPurchases.add(purchaseToken);
    
    try {
      // Verify with backend
      const result = await verifyPurchaseAPI({
        productId,
        purchaseToken,
        packageName: PACKAGE_NAME,
      });
      
      if (result.success) {
        // Mark as processed
        await markPurchaseAsProcessed(purchaseToken);
        
        // Consume purchase
        await RNIap.finishTransaction({ purchase });
        
        // Resolve promise
        if (pendingPurchases.has(productId)) {
          pendingPurchases.get(productId).resolve(result);
          pendingPurchases.delete(productId);
        }
        
        onSuccess?.(result);
      }
    } catch (error) {
      onError?.(error);
    } finally {
      verifyingPurchases.delete(purchaseToken);
    }
  });
  
  return subscription;
};
```

### 9.3 Deduplication Strategy

#### 9.3.1 Frontend Deduplication
```typescript
// In-memory set of currently verifying purchases
const verifyingPurchases = new Set<string>();

// AsyncStorage set of processed purchases
const markPurchaseAsProcessed = async (token: string) => {
  const processed = await AsyncStorage.getItem('processed_purchase_tokens');
  const set = new Set(JSON.parse(processed || '[]'));
  set.add(token);
  await AsyncStorage.setItem('processed_purchase_tokens', 
    JSON.stringify([...set]));
};
```

#### 9.3.2 Backend Deduplication
- Backend checks for existing transactions with same purchase token
- Atomic database operations prevent race conditions
- Returns success if already processed

### 9.4 Error Handling

**Purchase Errors**:
- User cancellation
- Payment failure
- Network errors
- Verification failure

**Error Display**:
- `PurchaseCancelledModal`: User cancelled
- `InsufficientCreditsModal`: Low balance warning
- Alert dialogs for other errors

---

## 10. ADMIN PANEL

### 10.1 Admin Dashboard Features

#### 10.1.1 Statistics Display
- **User Metrics**: Total, active, new users
- **Generation Metrics**: Total generations, by type
- **Token Metrics**: Total tokens, usage trends
- **Revenue Metrics**: Total purchases, by package

#### 10.1.2 User Management
- Search users by name/email
- View user details
- Manage user credits
- View user generation history
- View user purchase history
- Update user status

#### 10.1.3 Content Management
- Categories: CRUD operations, prompts, showcase images
- Models: Upload, categorize, label
- Backgrounds: Upload, set colors
- Prompts: System, category, quality prompts

#### 10.1.4 Analytics
- Token usage charts
- User growth trends
- Generation statistics
- Cost analysis

### 10.2 Admin Access Control

**Role Check**:
```typescript
const { isAdmin } = useAuth();

if (!isAdmin) {
  // Redirect to main app
  navigation.replace('Home');
}
```

**Backend Verification**:
- All admin API endpoints require admin role
- JWT token verification
- Role-based authorization

---

## 11. REFERENCES FOR ER DIAGRAMS

### 11.1 Database Schema Reference

**For creating ER diagrams, use Claude AI with the following prompt:**

```
Create an Entity-Relationship (ER) diagram for a mobile app with the following entities:

1. Users
   - _id (Primary Key)
   - name
   - email (Unique)
   - phone
   - password_hash
   - profile_picture
   - credits (Integer)
   - role (user/admin)
   - status (active/inactive)
   - created_at
   - updated_at

2. Generations
   - _id (Primary Key)
   - user_id (Foreign Key → Users)
   - generation_type (image/video)
   - category (jewelry/fashion/home/etc.)
   - prompt (Text)
   - result_urls (Array of URLs)
   - metadata (JSON: scenarios, total_images, tokens)
   - status (pending/processing/completed/failed)
   - created_at

3. Transactions
   - _id (Primary Key)
   - user_id (Foreign Key → Users)
   - product_id
   - purchase_token (Unique)
   - transaction_id
   - credits (Integer)
   - amount (Decimal)
   - status (pending/success/failed)
   - created_at

4. Categories
   - _id (Primary Key)
   - category_id (Unique)
   - title
   - icon
   - order (Integer)
   - is_active (Boolean)
   - subcategories (Array)
   - prompts (JSON: shoot, catalogue, branding)
   - showcase_items (JSON)
   - created_at
   - updated_at

5. Models
   - _id (Primary Key)
   - model_id (Unique)
   - category_id (Foreign Key → Categories)
   - type (photoshoot/catalogue/branding)
   - label
   - image_url
   - is_active (Boolean)
   - order (Integer)
   - created_at

6. Backgrounds
   - _id (Primary Key)
   - background_id (Unique)
   - label
   - color (Hex code)
   - image_url
   - is_active (Boolean)
   - order (Integer)
   - created_at

Relationships:
- Users (1) → (Many) Generations
- Users (1) → (Many) Transactions
- Categories (1) → (Many) Models
- Categories (1) → (Many) Generations

Include cardinality and relationship types.
```

### 11.2 System Architecture Diagram Reference

**Prompt for Claude AI:**

```
Create a system architecture diagram for a React Native mobile app with the following components:

Frontend (Mobile App):
- React Native + Expo
- Authentication Layer (JWT)
- Navigation (React Navigation)
- State Management (Context API)
- API Services (Axios)
- IAP Service (react-native-iap)
- Media Services (expo-image-picker, expo-media-library)

Backend (Flask):
- Flask REST API
- JWT Authentication
- MongoDB Database
- Google Play API Integration
- Gemini AI API Integration
- File Storage System

External Services:
- Google OAuth
- Google Play Billing
- Gemini AI (Image Generation)
- MongoDB Atlas

Show data flow between components with arrows and labels.
```

### 11.3 User Flow Diagram Reference

**Prompt for Claude AI:**

```
Create user flow diagrams for:

1. Photoshoot Generation Flow
2. Catalogue Generation Flow
3. Branding Generation Flow
4. In-App Purchase Flow
5. Authentication Flow

Use standard flowchart symbols:
- Rectangles for processes
- Diamonds for decisions
- Arrows for flow direction
- Parallelograms for input/output
```

---

## APPENDIX A: Key Technologies Explained

### A.1 React Native
Cross-platform mobile framework using React and JavaScript to build native mobile apps for iOS and Android from a single codebase.

### A.2 Expo
Development platform for React Native that provides tools, libraries, and services for building, deploying, and iterating on mobile apps.

### A.3 TypeScript
Superset of JavaScript that adds static typing, improving code quality and developer experience.

### A.4 React Navigation
Routing and navigation library for React Native apps, providing stack, tab, and drawer navigation patterns.

### A.5 Context API
React's built-in state management solution for sharing data across component tree without prop drilling.

### A.6 AsyncStorage
Asynchronous, persistent, key-value storage system for React Native.

### A.7 Axios
Promise-based HTTP client for making API requests.

### A.8 react-native-iap
Library for implementing in-app purchases on iOS and Android.

---

## APPENDIX B: Code Quality & Best Practices

### B.1 TypeScript Usage
- All components use TypeScript for type safety
- Interface definitions for props and state
- Type checking prevents runtime errors

### B.2 Component Organization
- Functional components with hooks
- Separation of concerns (UI vs logic)
- Reusable components in `/components`
- Screen-specific components in `/screens`

### B.3 Error Handling
- Try-catch blocks for async operations
- User-friendly error messages
- Logging for debugging
- Graceful degradation

### B.4 Performance Optimization
- Image optimization (compression, caching)
- Lazy loading for large lists
- Memoization for expensive computations
- Debouncing for search inputs

### B.5 Security Practices
- JWT token authentication
- Secure storage (AsyncStorage)
- HTTPS for API communication
- Input validation
- Role-based access control

---

## APPENDIX C: Future Enhancements

### C.1 Planned Features
- Video ad generation (UI ready, backend pending)
- Social media integration
- Batch processing
- Template library
- AI prompt customization
- Multi-language support

### C.2 Performance Improvements
- Image caching optimization
- Offline mode
- Background processing
- Push notifications

### C.3 User Experience
- Onboarding tutorial
- In-app help system
- Advanced filters
- Favorites/bookmarks
- Collaboration features

---

## CONCLUSION

Brand Shoot AI is a comprehensive mobile application that leverages AI technology to democratize professional product photography. The frontend is built with modern React Native architecture, providing a seamless user experience across authentication, image generation, in-app purchases, and admin management.

The application demonstrates:
- **Scalable Architecture**: Modular component structure
- **Robust State Management**: Context API with persistent storage
- **Secure Transactions**: Multi-layer IAP verification
- **Professional UI/UX**: Intuitive navigation and visual feedback
- **Admin Capabilities**: Comprehensive content and user management

This documentation provides a complete overview of the frontend implementation, suitable for academic project reports, technical documentation, and future development reference.

---

**Document Version**: 1.0  
**Last Updated**: April 2026  
**Project**: Brand Shoot AI Mobile Application  
**Technology**: React Native + Expo + TypeScript
