# Backend Documentation - Brand Shoot AI

## Project Overview

**Brand Shoot AI** is a Flask-based REST API backend that powers an AI-driven image generation platform. The backend integrates with Google's Gemini 2.5 Flash Image model to generate professional product photography by combining user-uploaded product images with model poses, creating photorealistic marketing images across multiple categories.

### Core Capabilities
- **AI Image Generation**: Three generation modes (Photoshoot, Catalogue, Branding)
- **User Authentication**: Email/password and Google OAuth sign-in
- **Credit-Based System**: Pay-per-use model with in-app purchases
- **Admin Dashboard**: User management, analytics, and content control
- **Real-time Processing**: Asynchronous job-based image generation
- **Google Play Integration**: Purchase verification and webhook handling

---

## Technology Stack

### Core Framework
- **Flask**: Lightweight Python web framework
- **Flask-CORS**: Cross-origin resource sharing
- **Flask-Compress**: Response compression (gzip)
- **Gunicorn**: Production WSGI server

### Database
- **MongoDB**: NoSQL database via PyMongo
- **Collections**: users, generations, transactions, categories, app_models, branding_backgrounds, prompt_templates, admin_settings

### AI & Image Processing
- **Google Gemini 2.5 Flash Image**: Native image generation model
- **google-genai**: Official Google Generative AI SDK
- **Pillow (PIL)**: Image processing and compression

### Authentication & Security
- **PyJWT**: JSON Web Token generation and verification
- **Werkzeug**: Password hashing (PBKDF2-SHA256)
- **Google OAuth2**: Google Sign-In integration

### Payment Integration
- **Google Play Developer API**: In-app purchase verification
- **google-api-python-client**: Google API client library
- **google-auth**: Service account authentication

### Environment & Configuration
- **python-dotenv**: Environment variable management
- **Docker**: Containerization support

---

## Project Structure

```
backend/
├── app.py                          # Flask application entry point
├── config.py                       # Configuration management
├── database.py                     # MongoDB connection and collections
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Docker configuration
├── .env                            # Environment variables (not in git)
│
├── models/                         # Data models
│   ├── user.py                     # User model with credit management
│   ├── generation.py               # Generation tracking model
│   └── transaction.py              # Purchase transaction model
│
├── routes/                         # API route blueprints
│   ├── auth.py                     # Authentication endpoints
│   ├── generate.py                 # Image generation endpoints
│   ├── user.py                     # User profile endpoints
│   ├── content.py                  # Content delivery (categories, models)
│   ├── purchase.py                 # In-app purchase handling
│   ├── admin.py                    # Admin dashboard endpoints
│   ├── admin_content.py            # Admin content management
│   └── video.py                    # Video generation (future)
│
├── services/                       # Business logic services
│   ├── gemini_image_service.py     # Gemini API integration
│   ├── catalogue_prompt_generator.py # Catalogue prompt builder
│   ├── branding_prompt_generator.py  # Branding prompt builder
│   ├── prompt_builder.py           # Base prompt builder
│   └── video_generation_service.py # Video generation service
│
├── utils/                          # Utility modules
│   ├── auth_middleware.py          # JWT authentication decorator
│   ├── jwt_utils.py                # JWT token operations
│   ├── validators.py               # Input validation
│   └── image_utils.py              # Image processing utilities
│
├── prompts.py                      # Hardcoded prompt templates
├── category_scenarios.py           # Category-specific scenarios
├── seed_data.py                    # Database seeding script
└── uploads/                        # Generated image storage
```

---

## Architecture & Design Patterns

### 1. **Blueprint Architecture**
Flask blueprints organize routes into logical modules:
- `auth_bp`: Authentication routes (`/auth/*`)
- `generate_bp`: Image generation (`/generate/*`)
- `user_bp`: User operations (`/user/*`)
- `content_bp`: Content delivery (`/content/*`)
- `purchase_bp`: Purchase handling (`/purchase/*`)
- `admin_bp`: Admin operations (`/admin/*`)

### 2. **Model-Service-Controller Pattern**
- **Models** (`models/`): Data access layer with MongoDB operations
- **Services** (`services/`): Business logic and external API integration
- **Controllers** (`routes/`): Request handling and response formatting

### 3. **Middleware Pattern**
- `@require_auth`: JWT authentication decorator
- `@require_admin`: Admin role verification decorator
- Request validation and error handling

### 4. **Job-Based Async Processing**
Image generation uses background threads with in-memory job tracking:
- Client initiates generation → receives `jobId`
- Background thread processes images one-by-one
- Client polls `/generate/job/<jobId>` for progress
- Results persisted to MongoDB for recovery

### 5. **Credit-Based Economy**
- Users purchase credit packs via Google Play
- Each image generation deducts 1 credit
- Credits deducted upfront before generation starts
- Prevents abuse and ensures payment

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, lowercase),
  phone: String (optional),
  password_hash: String (bcrypt, optional for OAuth users),
  google_id: String (optional),
  profile_picture: String (URL),
  status: String ("active" | "suspended"),
  role: String ("user" | "admin"),
  credits: Number (default: 12),
  plan: String ("free" | "basic" | "premium"),
  created_at: DateTime,
  updated_at: DateTime,
  subscription: {
    plan: String,
    credits_remaining: Number,
    credits_total: Number,
    subscription_start: DateTime,
    subscription_end: DateTime,
    auto_renew: Boolean
  }
}
```

### Generations Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users),
  generation_type: String ("image" | "video"),
  category: String ("jewelry" | "fashion" | "home" | ...),
  prompt: String,
  result_urls: [String], // Array of generated image URLs
  status: String ("generating" | "completed" | "failed"),
  created_at: DateTime,
  metadata: {
    job_id: String,
    sub_category: String ("shoot" | "catalogue" | "branding"),
    total_images: Number,
    scenarios: [String], // Scenario labels
    model_labels: [String], // For catalogue
    total_tokens: {
      input_tokens: Number,
      output_tokens: Number,
      total_tokens: Number,
      thoughts_tokens: Number,
      image_tokens: Number,
      text_tokens: Number
    },
    original_product_url: String,
    business_name: String (for branding),
    aspect_ratio: String,
    background: String,
    errors: [Object],
    updated_at: DateTime
  }
}
```

### Transactions Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: users),
  product_id: String ("image_pack_10" | "image_pack_25" | ...),
  purchase_token: String (unique, Google Play token),
  credits: Number,
  amount: Number (in INR),
  currency: String ("INR"),
  platform: String ("android" | "ios"),
  status: String ("pending" | "success" | "failed" | "refunded" | "revoked"),
  created_at: DateTime,
  updated_at: DateTime,
  verified_at: DateTime,
  refunded_at: DateTime,
  metadata: {
    verification: Object, // Google Play API response
    notification_type: Number,
    error: String
  }
}
```

### Categories Collection
```javascript
{
  _id: ObjectId,
  category_id: String (unique),
  title: String,
  icon: String (emoji or URL),
  is_active: Boolean,
  order: Number,
  subcategories: [String],
  showcase_items: {
    model: String (URL),
    product: String (URL),
    result: String (URL)
  },
  scenarios: [{
    id: String,
    label: String,
    prompt_hint: String,
    is_active: Boolean
  }],
  prompts: {
    shoot: String,
    catalogue: String,
    branding: String
  }
}
```

### App Models Collection
```javascript
{
  _id: ObjectId,
  model_id: String (unique),
  name: String,
  sub_type: String ("photoshoot" | "catalogue" | "branding"),
  image_url: String,
  is_active: Boolean,
  order: Number,
  // For catalogue models:
  photos: [{
    id: String,
    label: String,
    image_url: String
  }],
  // For branding models:
  poses: [{
    id: String,
    label: String,
    image_url: String
  }],
  before_image_url: String,
  after_image_url: String
}
```

### Branding Backgrounds Collection
```javascript
{
  _id: ObjectId,
  bg_id: String (unique),
  type: String ("color" | "image"),
  label: String,
  color: String (hex code, for color type),
  image_url: String (for image type),
  is_active: Boolean,
  order: Number
}
```

### Admin Settings Collection
```javascript
{
  _id: ObjectId,
  type: String ("cost_settings"),
  input_cost_per_million: Number (USD),
  output_cost_per_million: Number (USD),
  usd_to_inr: Number,
  per_image_cost: Number (INR),
  updated_at: DateTime
}
```

---

## API Endpoints

### Authentication Routes (`/auth`)

#### POST `/auth/signup`
**Description**: Register new user with email/password  
**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "password": "SecurePass123!"
}
```
**Response**:
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9876543210",
    "status": "active",
    "role": "user"
  }
}
```

#### POST `/auth/login`
**Description**: Login with email/password  
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
**Response**: Same as signup

#### POST `/auth/google-signin`
**Description**: Google OAuth sign-in  
**Request Body**:
```json
{
  "id_token": "google_id_token_from_client"
}
```
**Response**: Same as signup with profile picture

#### POST `/auth/verify-token`
**Description**: Verify JWT token validity  
**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```
**Response**:
```json
{
  "success": true,
  "user": { /* user object */ }
}
```

---

### Image Generation Routes (`/generate`)

#### POST `/generate/generate-image`
**Description**: Start photoshoot image generation job  
**Authentication**: Required  
**Request Body**:
```json
{
  "categoryId": "jewelry",
  "modelImage": "base64_encoded_image",
  "productImage": "base64_encoded_image"
}
```
**Response**:
```json
{
  "jobId": "a3f5c2d1",
  "totalImages": 3,
  "scenarios": [
    {"id": "temple", "label": "Temple Visit"},
    {"id": "party", "label": "Party Look"}
  ]
}
```

#### POST `/generate/generate-catalogue`
**Description**: Start catalogue image generation with multiple model poses  
**Authentication**: Required  
**Request Body**:
```json
{
  "categoryId": "jewelry",
  "modelImages": ["base64_1", "base64_2", "base64_3"],
  "productImage": "base64_encoded_image",
  "modelLabels": ["Front View", "Side View", "Back View"],
  "backgroundColor": "#FFFFFF",
  "backgroundLabel": "White"
}
```
**Response**: Same as generate-image

#### POST `/generate/generate-branding`
**Description**: Start branding image generation with business details  
**Authentication**: Required  
**Request Body**:
```json
{
  "categoryId": "jewelry",
  "modelId": "model_1",
  "poseImage": "base64_encoded_image",
  "productImage": "base64_encoded_image",
  "logoImage": "base64_encoded_image",
  "businessName": "Sharma Jewellers",
  "phoneNumber": "+91 9876543210",
  "address": "123 MG Road, Mumbai",
  "webUrl": "www.sharmajewellers.com",
  "backgroundColor": "#000000",
  "backgroundLabel": "Black",
  "aspectRatio": "4:5",
  "aspectRatioDescription": "Instagram Portrait"
}
```
**Response**: Same as generate-image

#### GET `/generate/job/<job_id>`
**Description**: Poll job status and get generated images  
**Authentication**: Not required  
**Response**:
```json
{
  "jobId": "a3f5c2d1",
  "status": "generating" | "done",
  "totalImages": 3,
  "completedImages": 2,
  "currentScenario": "Party Look",
  "images": [
    {
      "scenarioId": "temple",
      "label": "Temple Visit",
      "imageUrl": "/uploads/john_doe_temple_20260414_143022_shoot.jpg",
      "filename": "john_doe_temple_20260414_143022_shoot.jpg"
    }
  ],
  "errors": []
}
```

---

### User Routes (`/user`)

#### GET `/user/app-settings`
**Description**: Get app-wide settings (public endpoint)  
**Response**:
```json
{
  "success": true,
  "per_image_cost": 10
}
```

#### GET `/user/my-generations`
**Description**: Get user's generation history (last 30 days)  
**Authentication**: Required  
**Query Params**: `?category=jewelry` (optional)  
**Response**:
```json
{
  "generations": [
    {
      "id": "507f1f77bcf86cd799439011",
      "category": "jewelry",
      "sub_category": "shoot",
      "prompt": "Generated 3 images for jewelry",
      "total_images": 3,
      "result_urls": ["/uploads/image1.jpg", "/uploads/image2.jpg"],
      "status": "completed",
      "created_at": "2026-04-14T10:30:00Z"
    }
  ],
  "total": 15,
  "categories": ["jewelry", "fashion", "home"]
}
```

#### GET `/user/my-profile`
**Description**: Get current user's profile  
**Authentication**: Required  
**Response**:
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "profile_picture": "https://...",
  "status": "active",
  "role": "user",
  "created_at": "2026-01-15T08:00:00Z"
}
```

#### PUT `/user/my-profile`
**Description**: Update user profile  
**Authentication**: Required  
**Request Body**:
```json
{
  "name": "John Updated",
  "phone": "+91 9999999999",
  "profile_picture": "https://..."
}
```

---

### Content Routes (`/content`)

#### GET `/content/categories`
**Description**: Get all active categories  
**Query Params**: `?active=true` (default: true)  
**Response**:
```json
[
  {
    "id": "jewelry",
    "title": "Jewelry",
    "icon": "💎",
    "is_active": true,
    "order": 1,
    "subcategories": ["necklace", "earrings", "bangles"],
    "showcase_items": {
      "model": "/uploads/model.jpg",
      "product": "/uploads/product.jpg",
      "result": "/uploads/result.jpg"
    },
    "scenarios": [
      {
        "id": "temple",
        "label": "Temple Visit",
        "prompt_hint": "...",
        "is_active": true
      }
    ]
  }
]
```

#### GET `/content/models`
**Description**: Get models by sub_type  
**Query Params**: `?sub_type=photoshoot|catalogue|branding&active=true`  
**Response**:
```json
[
  {
    "id": "model_1",
    "name": "Model 1",
    "sub_type": "photoshoot",
    "image_url": "/uploads/model1.jpg",
    "is_active": true,
    "order": 1
  }
]
```

#### GET `/content/branding-backgrounds`
**Description**: Get branding background options  
**Response**:
```json
[
  {
    "id": "white",
    "type": "color",
    "label": "White",
    "color": "#FFFFFF",
    "is_active": true,
    "order": 1
  },
  {
    "id": "gradient_1",
    "type": "image",
    "label": "Gradient Blue",
    "image_url": "/uploads/bg_gradient.jpg",
    "is_active": true,
    "order": 2
  }
]
```

---

### Purchase Routes (`/purchase`)

#### POST `/purchase/verify`
**Description**: Verify and process Google Play purchase  
**Authentication**: Required  
**Request Body**:
```json
{
  "productId": "image_pack_10",
  "purchaseToken": "google_purchase_token_here",
  "packageName": "com.anonymous.flyrclone",
  "transactionId": "GPA.1234-5678-9012-34567"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Successfully added 10 credits",
  "credits_added": 10,
  "total_credits": 22,
  "transaction_id": "507f1f77bcf86cd799439011",
  "order_id": "GPA.1234-5678-9012-34567"
}
```

#### GET `/purchase/credits`
**Description**: Get user's current credit balance  
**Authentication**: Required  
**Response**:
```json
{
  "success": true,
  "credits": 22
}
```

#### GET `/purchase/transactions`
**Description**: Get user's transaction history  
**Authentication**: Required  
**Query Params**: `?limit=50`  
**Response**:
```json
{
  "success": true,
  "transactions": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user_id": "507f191e810c19729de860ea",
      "product_id": "image_pack_10",
      "credits": 10,
      "amount": 100,
      "currency": "INR",
      "status": "success",
      "created_at": "2026-04-14T10:00:00Z"
    }
  ]
}
```

#### GET `/purchase/products`
**Description**: Get available credit packages  
**Response**:
```json
{
  "success": true,
  "products": [
    {
      "id": "image_pack_10",
      "credits": 10,
      "price": 100,
      "currency": "INR",
      "price_display": "₹100"
    },
    {
      "id": "image_pack_25",
      "credits": 25,
      "price": 250,
      "currency": "INR",
      "price_display": "₹250"
    }
  ],
  "cost_per_image": 10
}
```

#### POST `/purchase/webhook/google-play`
**Description**: Google Play Real-Time Developer Notifications webhook  
**Request Body**: Pub/Sub message from Google Play  
**Handles**: Purchase, Cancellation, Refund, Revoke notifications

---

### Admin Routes (`/admin`)

All admin routes require `@require_admin` decorator (role = "admin")

#### GET `/admin/dashboard`
**Description**: Get dashboard statistics  
**Response**:
```json
{
  "users": {
    "total": 1250,
    "active": 1200,
    "suspended": 50,
    "new_this_week": 45
  },
  "generations": {
    "total": 15000,
    "this_month": 2500
  },
  "tokens": {
    "total_input_tokens": 5000000,
    "total_output_tokens": 3000000,
    "total_tokens": 8000000,
    "total_images": 15000
  }
}
```

#### GET `/admin/users`
**Description**: List all users with pagination  
**Query Params**: `?page=1&limit=20&search=john`  
**Response**:
```json
{
  "users": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+91 9876543210",
      "status": "active",
      "role": "user",
      "created_at": "2026-01-15T08:00:00Z"
    }
  ],
  "total": 1250,
  "page": 1,
  "limit": 20,
  "totalPages": 63
}
```

#### GET `/admin/users/<user_id>`
**Description**: Get detailed user info with generation stats  
**Response**:
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "credits": 22,
    "status": "active",
    "role": "user",
    "created_at": "2026-01-15T08:00:00Z"
  },
  "generation_stats": {
    "total_generations": 50,
    "total_images": 150,
    "total_tokens": 500000
  }
}
```

#### PUT `/admin/users/<user_id>/status`
**Description**: Update user status  
**Request Body**:
```json
{
  "status": "active" | "suspended"
}
```

#### POST `/admin/users/<user_id>/credits`
**Description**: Add credits to user account  
**Request Body**:
```json
{
  "credits": 100,
  "reason": "Admin bonus"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Successfully added 100 credits",
  "credits_added": 100,
  "total_credits": 122,
  "reason": "Admin bonus"
}
```

#### GET `/admin/token-stats`
**Description**: Get token usage statistics with filters  
**Query Params**: `?filter=all|month|previous_month|last_3_months|last_6_months|year|custom&from=2026-01-01&to=2026-04-14`  
**Response**:
```json
{
  "filter": "month",
  "total_generations": 2500,
  "total_images": 7500,
  "total_input_tokens": 1000000,
  "total_output_tokens": 600000,
  "total_tokens": 1600000,
  "categories": [
    {
      "category": "jewelry",
      "count": 1200,
      "tokens": 800000,
      "images": 3600
    }
  ]
}
```

#### GET `/admin/settings`
**Description**: Get cost settings  
**Response**:
```json
{
  "input_cost_per_million": 2,
  "output_cost_per_million": 12,
  "usd_to_inr": 83.5,
  "per_image_cost": 10
}
```

#### PUT `/admin/settings`
**Description**: Update cost settings  
**Request Body**: Same as GET response

---

## Core Services

### 1. Gemini Image Service (`services/gemini_image_service.py`)

**Purpose**: Interface with Google Gemini 2.5 Flash Image model for native image generation

**Key Functions**:

#### `generate_image_with_gemini(prompt, model_image_base64, product_image_base64)`
Generates a single photorealistic image by fusing model and product images.

**Process**:
1. Decode base64 images to bytes
2. Build multi-part content with images and text prompt
3. Call Gemini API with `response_modalities=["IMAGE", "TEXT"]`
4. Extract generated image bytes from response
5. Track token usage (input, output, thoughts, image, text tokens)
6. Handle safety filter blocks

**Returns**: `(image_bytes, token_usage_dict)`

#### `generate_branding_image_with_gemini(prompt, pose_image_base64, product_image_base64, logo_image_base64)`
Specialized for branding images with optional logo overlay.

**Features**:
- Supports optional logo image injection
- Maintains business branding elements
- Aspect ratio control
- Background customization

---

### 2. Catalogue Prompt Generator (`services/catalogue_prompt_generator.py`)

**Purpose**: Generate category-specific prompts for catalogue images that maintain model pose accuracy

**Key Features**:
- **Pose Preservation**: Strict instructions to maintain exact model pose (front, side, back view)
- **Category-Specific Contexts**: Different environments per category
  - Jewelry: Saree, traditional hairstyle, temple/wedding background
  - Fashion: Aesthetic destinations (Paris, Santorini, Japanese gardens)
  - Home Decor: Luxury house interiors with premium materials
  - Kitchen: Gourmet kitchen with professional setup
  - Electronics: Modern tech environment with clean lines
  - Beauty: Vanity setup with flawless makeup
  - Sports: Athletic environment with energetic poses

**Background Control**:
- Solid color backgrounds with hex code accuracy
- Image texture backgrounds
- Studio backgrounds with professional lighting

**Function**: `generate_catalogue_prompt(category_id, model_pose, product_description, bg_color, bg_label)`

---

### 3. Branding Prompt Generator (`services/branding_prompt_generator.py`)

**Purpose**: Expert prompt writer for professional branded marketing images

**Prompt Structure** (8 sections):
1. **Art Direction**: Category-specific photography style and mood
2. **Subject Lock**: Strict model/pose preservation rules
3. **Product Integration**: Photorealistic placement with correct scale, shadows, reflections
4. **Background**: Color/texture/image background with lighting integration
5. **Branding Overlay**: Business name, logo, contact details in professional typography
6. **Composition**: Aspect ratio, rule-of-thirds, safe zones
7. **Technical Quality**: Resolution, color accuracy, retouching standards
8. **Prohibitions**: Explicit list of forbidden actions

**Branding Variants**:
- **Main Variant**: Full branding with business name, logo, contact details
- **Clean Variant**: No branding overlay, white-label ready

**Function**: `generate_branding_prompt(category_id, label, branding_meta)`

---

### 4. Prompt Builder (`services/prompt_builder.py`)

**Purpose**: Base prompt construction with category-specific templates

**Hardcoded Templates** (`prompts.py`):
- `JEWELRY_PROMPT`: Luxury jewelry editorial with metallic reflections
- `FASHION_PROMPT`: High-end fashion with fabric draping
- `HOME_PROMPT`: Interior design with product integration
- `BEAUTY_PROMPT`: Beauty campaign with flawless skin
- `ELECTRONICS_PROMPT`: Tech product with screen rendering
- `ACCESSORIES_PROMPT`, `KIDS_PROMPT`, `FOOD_PROMPT`

**Scenario Integration** (`category_scenarios.py`):
Each category has predefined scenarios with `prompt_hint`:
```python
{
  "id": "temple",
  "label": "Temple Visit",
  "prompt_hint": "The person is visiting a grand traditional temple..."
}
```

---

## Data Models

### User Model (`models/user.py`)

**Key Methods**:

#### `create_user(name, email, password, phone, google_id, profile_picture, status, role)`
Creates new user with:
- Password hashing (Werkzeug PBKDF2-SHA256)
- Default 12 credits on signup
- Status: "active" or "suspended"
- Role: "user" or "admin"

#### `find_by_email(email)`, `find_by_google_id(google_id)`, `find_by_id(user_id)`
User lookup methods

#### `verify_password(user, password)`
Secure password verification

#### `get_credits(user_id)`, `add_credits(user_id, credits, reason)`, `deduct_credits(user_id, credits, reason)`
Credit management with atomic operations

**Credit Deduction Response**:
```python
{
  "success": True/False,
  "remaining_credits": 11,
  "message": "Successfully deducted 1 credits"
}
```

---

### Generation Model (`models/generation.py`)

**Key Methods**:

#### `create_generation(user_id, generation_type, category, prompt, result_urls, metadata, status)`
Records image/video generation with:
- User reference
- Category and type
- Result URLs array
- Rich metadata (tokens, scenarios, job_id)

#### `find_by_user(user_id, limit)`, `find_by_id(generation_id)`
Query methods

#### `get_user_stats(user_id)`
Aggregates user's generation statistics:
```python
{
  "total_generations": 50,
  "image_generations": 48,
  "video_generations": 2,
  "by_category": {
    "jewelry": 30,
    "fashion": 20
  }
}
```

---

### Transaction Model (`models/transaction.py`)

**Key Methods**:

#### `create_transaction(user_id, product_id, purchase_token, credits, amount, currency, platform, status)`
Records in-app purchase with:
- Google Play purchase token (unique constraint)
- Product details and credits
- Status: "pending" → "success" / "failed" / "refunded" / "revoked"

#### `find_by_purchase_token(purchase_token)`
Prevents duplicate purchase processing (idempotency)

#### `mark_as_verified(purchase_token, verification_data)`
Updates transaction after Google Play verification

#### `get_user_total_spent(user_id)`
Aggregates user's spending:
```python
{
  "total_amount": 1500,  # INR
  "total_credits": 150,
  "transaction_count": 6
}
```

---

## Authentication & Security

### JWT Authentication

**Token Generation** (`utils/jwt_utils.py`):
```python
payload = {
  "user_id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "iat": datetime.utcnow(),
  "exp": datetime.utcnow() + timedelta(days=7)  # 7-day expiry
}
token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
```

**Token Verification**:
- Validates signature with `JWT_SECRET`
- Checks expiration
- Returns decoded payload or `None`

**Middleware** (`utils/auth_middleware.py`):
```python
@require_auth
def protected_route():
    user_id = request.user_id
    user = request.current_user
    # ... route logic
```

**Flow**:
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token signature and expiration
3. Fetch user from database
4. Check user status is "active"
5. Attach `request.user_id` and `request.current_user`
6. Proceed to route handler

---

### Password Security

**Hashing**: Werkzeug's `generate_password_hash()` uses PBKDF2-SHA256
- High computational cost (prevents brute force)
- Unique salt per password
- Industry-standard algorithm

**Validation** (`utils/validators.py`):
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

---

### Google OAuth Integration

**Sign-In Flow**:
1. Client obtains Google ID token from Google Sign-In SDK
2. Backend verifies token with Google's public keys
3. Extract user info: `sub` (Google ID), `email`, `name`, `picture`
4. Check if user exists by Google ID or email
5. Link Google account to existing user OR create new user
6. Generate JWT token and return to client

**Configuration**:
- `GOOGLE_CLIENT_ID` in environment variables
- Uses `google.oauth2.id_token.verify_oauth2_token()`

---

### Google Play Purchase Verification

**Service Account Setup**:
```python
credentials = service_account.Credentials.from_service_account_file(
    GOOGLE_APPLICATION_CREDENTIALS,
    scopes=['https://www.googleapis.com/auth/androidpublisher']
)
service = build('androidpublisher', 'v3', credentials=credentials)
```

**Verification Process**:
1. Client completes purchase in Google Play
2. Client sends `purchaseToken` and `productId` to backend
3. Backend calls Google Play Developer API:
   ```python
   result = service.purchases().products().get(
       packageName=PACKAGE_NAME,
       productId=product_id,
       token=purchase_token
   ).execute()
   ```
4. Check `purchaseState == 0` (purchased, not canceled)
5. Add credits to user account
6. Mark transaction as verified
7. Client consumes purchase (for consumables)

**Idempotency**: `purchase_token` is unique constraint in database to prevent duplicate processing

**Webhook Handling**:
- Google Play sends Pub/Sub notifications for refunds/revokes
- Backend processes notification and deducts credits if necessary

---

## Image Generation Workflow

### Photoshoot Generation Flow

**1. Client Request**:
```
POST /generate/generate-image
{
  "categoryId": "jewelry",
  "modelImage": "base64...",
  "productImage": "base64..."
}
```

**2. Backend Processing**:
```python
# Validate inputs
if not product_image or not model_image:
    return error

# Fetch scenarios for category
scenarios = get_scenarios(category_id)  # e.g., 3 scenarios

# Check credits
credits_needed = len(scenarios)  # 3 credits
current_credits = User.get_credits(user_id)
if current_credits < credits_needed:
    return 402 Payment Required

# Deduct credits upfront
User.deduct_credits(user_id, credits_needed, reason="image_generation_shoot")

# Create job
job_id = uuid.uuid4()[:8]
jobs[job_id] = {
    "status": "generating",
    "totalImages": 3,
    "images": [],
    "errors": [],
    "scenarios": scenarios
}

# Persist to database
Generation.create_generation(user_id, "image", category_id, ...)

# Start background thread
thread = threading.Thread(target=_run_generation, args=(job_id, ...))
thread.start()

# Return immediately
return {"jobId": job_id, "totalImages": 3, "scenarios": [...]}
```

**3. Background Generation** (`_run_generation`):
```python
for scenario in scenarios:
    # Build prompt
    prompt = build_prompt(category_id, scenario_hint=scenario["prompt_hint"])
    
    # Generate image
    image_bytes, token_usage = generate_image_with_gemini(
        prompt, model_image, product_image
    )
    
    # Save to disk with creative filename
    filename = f"{user_name}_{user_email}_{scenario_label}_{timestamp}_shoot.jpg"
    saved_path = save_image_bytes(image_bytes, filename)
    
    # Update job state
    job["images"].append({
        "scenarioId": scenario["id"],
        "label": scenario["label"],
        "imageUrl": saved_path,
        "tokens": token_usage
    })
    
    # Persist to database
    _persist_job_state(job_id, job)

# Mark job as done
job["status"] = "done"
generations_col.update_one({"metadata.job_id": job_id}, {
    "$set": {
        "status": "completed",
        "result_urls": all_urls,
        "metadata.total_tokens": total_tokens
    }
})
```

**4. Client Polling**:
```
GET /generate/job/{job_id}
```
Returns current status and all generated images so far.

---

### Catalogue Generation Flow

**Differences from Photoshoot**:
- Multiple model images (different poses: front, side, back)
- Each model image generates one output
- Background color/texture control
- Catalogue-specific prompts maintain pose accuracy

**Request**:
```json
{
  "categoryId": "jewelry",
  "modelImages": ["base64_front", "base64_side", "base64_back"],
  "modelLabels": ["Front View", "Side View", "Back View"],
  "productImage": "base64...",
  "backgroundColor": "#FFFFFF",
  "backgroundLabel": "White"
}
```

**Prompt Generation**:
```python
prompt = generate_catalogue_prompt(
    category_id="jewelry",
    model_pose="Front View",
    bg_color="#FFFFFF",
    bg_label="White"
)
```

Prompt emphasizes:
- Maintain exact model pose (DO NOT change angle)
- Saree and traditional hairstyle for jewelry
- Solid white background with no gradients
- Jewelry as focal point

---

### Branding Generation Flow

**Purpose**: Create branded marketing images with business details

**Request**:
```json
{
  "categoryId": "jewelry",
  "modelId": "model_1",
  "poseImage": "base64...",
  "productImage": "base64...",
  "logoImage": "base64...",  // optional
  "businessName": "Sharma Jewellers",
  "phoneNumber": "+91 9876543210",
  "address": "123 MG Road, Mumbai",
  "webUrl": "www.sharmajewellers.com",
  "backgroundColor": "#000000",
  "backgroundLabel": "Black",
  "aspectRatio": "4:5",
  "aspectRatioDescription": "Instagram Portrait"
}
```

**Scenarios Generated**:
1. **Main Variant**: Full branding with logo, business name, contact details
2. **Clean Variant**: No branding overlay (white-label)

**Prompt Structure**:
```
You are an expert commercial photographer...

① ART DIRECTION: Luxury jewelry editorial...
② SUBJECT LOCK: Preserve model's exact face, pose, body...
③ PRODUCT INTEGRATION: Realistic placement with shadows...
④ BACKGROUND: Solid black (#000000) with soft shadows...
⑤ BRANDING:
   • Business Name: "Sharma Jewellers" (bold typography)
   • Logo: Bottom-left corner, 60px height
   • Contact: 📞 +91 9876543210 | 📍 123 MG Road | 🌐 www...
   • Branding strip: Max 15% height, semi-transparent overlay
⑥ COMPOSITION: 4:5 aspect ratio, rule-of-thirds...
⑦ TECHNICAL QUALITY: High resolution, accurate colors...
⑧ PROHIBITIONS: Do NOT alter model, do NOT add watermarks...
```

---

## File Storage & Naming

### Creative Filename Generation

**Format**: `{name}_{email_prefix}_{scenario}_{date}_{time}_{type}.jpg`

**Example**: `john_doe_john_temple_visit_20260414_143022_shoot.jpg`

**Benefits**:
- Unique filenames (timestamp + user info)
- Searchable by user name/email
- Identifiable scenario/type
- No filename collisions

**Storage Location**: `backend/uploads/`

**URL Format**: `http://IP_ADDRESS:5000/uploads/{filename}`

**Image Serving** (`app.py`):
```python
@app.route("/uploads/<path:filename>")
def serve_image(filename):
    response = make_response(send_from_directory("uploads", filename))
    response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    return response
```

**Caching Strategy**:
- 1-year cache for immutable images
- Aggressive caching reduces server load
- Images never change after generation

---

## Admin Dashboard Features

### User Management

**Capabilities**:
- List all users with search and pagination
- View detailed user profile with generation stats
- Toggle user status (active ↔ suspended)
- Add credits to user accounts (admin bonus)
- View user's generation history

**Use Cases**:
- Suspend abusive users
- Reward loyal users with bonus credits
- Investigate user issues
- Monitor user activity

---

### Analytics & Reporting

**Dashboard Metrics**:
- Total users, active users, suspended users
- New sign-ups this week
- Total generations, generations this month
- Token usage (input, output, total)
- Total images generated

**Token Statistics**:
- Filter by time period (month, quarter, year, custom range)
- Per-category breakdown
- Cost calculation based on admin settings

**Cost Settings**:
- Input token cost per million (USD)
- Output token cost per million (USD)
- USD to INR conversion rate
- Per-image cost for users (INR)

**Example Cost Calculation**:
```python
input_cost_usd = (input_tokens / 1_000_000) * input_cost_per_million
output_cost_usd = (output_tokens / 1_000_000) * output_cost_per_million
total_cost_usd = input_cost_usd + output_cost_usd
total_cost_inr = total_cost_usd * usd_to_inr
```

---

### Content Management

**Admin Content Routes** (`/admin/content`):
- Manage categories (create, update, activate/deactivate)
- Manage models (photoshoot, catalogue, branding)
- Manage branding backgrounds
- Update prompt templates
- Configure scenarios per category

**Dynamic Content**:
- All content served from database
- No code changes needed to add new categories/models
- Admin can A/B test different prompts

---

## Error Handling & Safety

### Safety Filters

**Gemini Safety Blocks**:
```python
try:
    response = client.models.generate_content(...)
except Exception as e:
    if "IMAGE_SAFETY" in str(e):
        raise RuntimeError("Image generation blocked by safety filters")
```

**Finish Reason Checks**:
```python
if hasattr(candidate, 'finish_reason'):
    if 'SAFETY' in finish_reason or 'BLOCKED' in finish_reason:
        raise RuntimeError(f"Content blocked: {finish_reason}")
```

**Safety Policies**:
- No suggestive poses or revealing clothing
- Professional, modest attire required
- Appropriate for commercial use
- Family-friendly content

---

### Input Validation

**Email Validation** (`utils/validators.py`):
- RFC 5322 compliant regex
- Max 254 characters
- Lowercase normalization

**Password Validation**:
- 8-128 characters
- Mixed case, digit, special character required
- Prevents weak passwords

**Name Validation**:
- 2-100 characters
- Letters, spaces, hyphens, apostrophes only
- No special characters or numbers

---

### Error Responses

**Standard Error Format**:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTP Status Codes**:
- `200 OK`: Success
- `201 Created`: Resource created (signup)
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid token
- `402 Payment Required`: Insufficient credits
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource (email exists)
- `500 Internal Server Error`: Server error

---

## Performance Optimization

### Response Compression

**Flask-Compress Configuration**:
```python
app.config["COMPRESS_MIMETYPES"] = [
    'text/html', 'text/css', 'application/json',
    'image/jpeg', 'image/png'
]
app.config["COMPRESS_LEVEL"] = 6  # Balance speed vs size
app.config["COMPRESS_MIN_SIZE"] = 500  # Only compress > 500 bytes
```

**Benefits**:
- Reduced bandwidth usage
- Faster API responses
- Lower hosting costs

---

### Image Compression

**Pillow Optimization** (`utils/image_utils.py`):
```python
def save_image_bytes(image_bytes, filename):
    image = Image.open(BytesIO(image_bytes))
    image.save(filepath, "JPEG", quality=85, optimize=True)
```

**Quality Settings**:
- JPEG quality: 85 (good balance)
- Optimize flag: True (smaller file size)
- Progressive encoding for web

---

### Database Indexing

**Recommended Indexes**:
```javascript
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "google_id": 1 })
db.users.createIndex({ "status": 1 })

// Generations collection
db.generations.createIndex({ "user_id": 1, "created_at": -1 })
db.generations.createIndex({ "metadata.job_id": 1 })
db.generations.createIndex({ "category": 1 })

// Transactions collection
db.transactions.createIndex({ "purchase_token": 1 }, { unique: true })
db.transactions.createIndex({ "user_id": 1, "created_at": -1 })
db.transactions.createIndex({ "status": 1 })
```

---

### Async Processing

**Background Threads**:
- Image generation runs in daemon threads
- Non-blocking API responses
- Job-based polling for progress

**Benefits**:
- API remains responsive
- Multiple generations can run concurrently
- Client can show progress UI

**Limitations**:
- In-memory job store (lost on server restart)
- Database persistence for recovery
- Single-server architecture (no distributed jobs)

---

## Deployment

### Environment Variables (`.env`)

```bash
# MongoDB (external main server — put real credentials in your git-ignored .env)
MONGO_URL=mongodb://<user>:<password>@72.62.79.188:27017/?authSource=admin
DB_NAME=flyr_clone

# Server
EXPO_PUBLIC_IP_ADDRESS=192.168.1.100

# Google AI
GEMINI_API_KEY=your_gemini_api_key_here

# Authentication
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Google Play
GOOGLE_APPLICATION_CREDENTIALS=./flyr-service-account.json
ANDROID_PACKAGE_NAME=com.anonymous.flyrclone
```

---

### Docker Deployment

**Dockerfile**:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-b", "0.0.0.0:5000", "-w", "4", "app:app"]
```

**Build & Run**:
```bash
docker build -t flyr-backend .
docker run -p 5000:5000 --env-file .env flyr-backend
```

---

### Production Considerations

**Gunicorn Configuration**:
```bash
gunicorn -b 0.0.0.0:5000 -w 4 --timeout 300 app:app
```
- 4 worker processes
- 300-second timeout (for long image generation)

**Nginx Reverse Proxy**:
```nginx
location /api {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 50M;
}

location /uploads {
    alias /app/backend/uploads;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**File Upload Limits**:
```python
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB
```

---

## Database Seeding

**Script**: `seed_data.py`

**Purpose**: Populate database with initial data for development/testing

**Seeds**:
- Categories with scenarios and prompts
- Photoshoot models
- Catalogue models with multiple photos
- Branding models with poses
- Branding backgrounds (colors and images)
- Prompt templates
- Admin settings

**Usage**:
```bash
python seed_data.py
```

---

## ER Diagram References for Claude AI

### Entity Relationships

```
┌─────────────┐
│    Users    │
│─────────────│
│ _id (PK)    │
│ email       │
│ credits     │
│ role        │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────┐
│  Generations    │
│─────────────────│
│ _id (PK)        │
│ user_id (FK)    │
│ category        │
│ result_urls[]   │
│ metadata        │
└─────────────────┘

┌─────────────┐
│    Users    │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────┐
│ Transactions    │
│─────────────────│
│ _id (PK)        │
│ user_id (FK)    │
│ purchase_token  │
│ credits         │
│ status          │
└─────────────────┘

┌──────────────┐
│  Categories  │
│──────────────│
│ category_id  │
│ scenarios[]  │
│ prompts{}    │
└──────────────┘

┌──────────────┐
│  App Models  │
│──────────────│
│ model_id     │
│ sub_type     │
│ photos[]     │
│ poses[]      │
└──────────────┘

┌──────────────────┐
│ Branding BGs     │
│──────────────────│
│ bg_id            │
│ type             │
│ color/image_url  │
└──────────────────┘
```

### Prompt for Claude to Generate Full ER Diagram:

```
Create a detailed Entity-Relationship Diagram for the Brand Shoot AI backend database with the following entities:

1. Users (authentication, credits, role)
2. Generations (image generation records with metadata)
3. Transactions (in-app purchases)
4. Categories (product categories with scenarios)
5. App Models (photoshoot, catalogue, branding models)
6. Branding Backgrounds (color/image backgrounds)
7. Prompt Templates (AI prompt templates)
8. Admin Settings (cost configuration)

Show:
- Primary keys (_id)
- Foreign keys (user_id references)
- Cardinality (1:1, 1:N, N:M)
- Key attributes for each entity
- Embedded documents (metadata, subscription)
- Array fields (result_urls[], scenarios[], photos[])

Use MongoDB document model conventions.
```

---

## API Integration Examples

### Frontend Integration (React Native)

**Authentication**:
```typescript
// Login
const response = await axios.post(`${API_URL}/auth/login`, {
  email: 'john@example.com',
  password: 'SecurePass123!'
});
const { token, user } = response.data;
await AsyncStorage.setItem('token', token);

// Authenticated Request
const config = {
  headers: { Authorization: `Bearer ${token}` }
};
const profile = await axios.get(`${API_URL}/user/my-profile`, config);
```

**Image Generation**:
```typescript
// Start generation
const response = await axios.post(
  `${API_URL}/generate/generate-image`,
  {
    categoryId: 'jewelry',
    modelImage: base64ModelImage,
    productImage: base64ProductImage
  },
  { headers: { Authorization: `Bearer ${token}` } }
);
const { jobId, totalImages } = response.data;

// Poll for results
const pollInterval = setInterval(async () => {
  const job = await axios.get(`${API_URL}/generate/job/${jobId}`);
  
  if (job.data.status === 'done') {
    clearInterval(pollInterval);
    const images = job.data.images;
    // Display images
  } else {
    // Update progress: job.data.completedImages / job.data.totalImages
  }
}, 2000);
```

**Purchase Credits**:
```typescript
// Get available products
const products = await axios.get(`${API_URL}/purchase/products`);

// User completes purchase in Google Play
const purchase = await RNIap.requestPurchase('image_pack_10');

// Verify purchase
const response = await axios.post(
  `${API_URL}/purchase/verify`,
  {
    productId: purchase.productId,
    purchaseToken: purchase.purchaseToken,
    packageName: 'com.anonymous.flyrclone'
  },
  { headers: { Authorization: `Bearer ${token}` } }
);

// Consume purchase (for consumables)
await RNIap.finishTransaction(purchase);

// Credits added: response.data.credits_added
```

---

## Testing & Development

### Manual Testing Endpoints

**Health Check**:
```bash
curl http://localhost:5000/
# Response: {"status": "Gemini image backend running"}
```

**Test Authentication**:
```bash
curl http://localhost:5000/auth/test
# Lists all auth endpoints
```

**Get Categories**:
```bash
curl http://localhost:5000/content/categories
```

**Get User Credits** (requires token):
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/purchase/credits
```

---

### Development Workflow

1. **Start MongoDB**:
   ```bash
   mongod --dbpath ./data
   ```

2. **Seed Database**:
   ```bash
   python seed_data.py
   ```

3. **Run Development Server**:
   ```bash
   python app.py
   # Runs on http://0.0.0.0:5000 with debug=True
   ```

4. **Test API with Postman/Insomnia**:
   - Import API collection
   - Set environment variables (API_URL, TOKEN)
   - Test all endpoints

5. **Monitor Logs**:
   - Flask prints detailed logs for each request
   - Token usage tracked per generation
   - Error stack traces in console

---

## Future Enhancements

### Planned Features

1. **Video Generation** (`routes/video.py`):
   - Animate generated images
   - Product showcase videos
   - Social media video formats

2. **Batch Processing**:
   - Generate multiple products in one job
   - Bulk catalogue generation
   - CSV upload for product lists

3. **Advanced Analytics**:
   - User engagement metrics
   - Popular categories/scenarios
   - A/B testing for prompts
   - Revenue analytics

4. **Webhook System**:
   - Real-time notifications to client
   - Generation completion webhooks
   - Purchase confirmation webhooks

5. **CDN Integration**:
   - Upload generated images to S3/CloudFront
   - Faster image delivery
   - Reduced server load

6. **Multi-Language Support**:
   - Internationalized prompts
   - Regional category variations
   - Localized business branding

7. **AI Model Upgrades**:
   - Support for Gemini 2.0 Ultra
   - Custom fine-tuned models
   - Style transfer options

---

## Troubleshooting

### Common Issues

**Issue**: "Insufficient credits" error  
**Solution**: User needs to purchase credits via in-app purchase

**Issue**: "Image generation blocked by safety filters"  
**Solution**: Model/product image contains inappropriate content. Use different images.

**Issue**: Job status stuck at "generating"  
**Solution**: Server restarted (in-memory job lost). Check database for generation record.

**Issue**: Purchase verification fails  
**Solution**: 
- Check Google service account credentials
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path
- Ensure service account has `androidpublisher` API access

**Issue**: Token expired  
**Solution**: Client should refresh token or re-login (7-day expiry)

**Issue**: MongoDB connection error  
**Solution**: Ensure MongoDB is running and `MONGO_URL` is correct

---

## Security Best Practices

1. **Environment Variables**: Never commit `.env` or service account JSON to git
2. **JWT Secret**: Use strong, random secret (min 32 characters)
3. **Password Hashing**: Always use Werkzeug's secure hashing (never plain text)
4. **Input Validation**: Validate all user inputs before processing
5. **Rate Limiting**: Implement rate limiting for API endpoints (future)
6. **HTTPS**: Use HTTPS in production (TLS certificate)
7. **CORS**: Configure CORS to allow only trusted origins in production
8. **SQL Injection**: MongoDB is NoSQL, but still sanitize inputs
9. **File Upload**: Validate file types and sizes (max 50MB)
10. **Admin Access**: Restrict admin endpoints with role-based access control

---

## Conclusion

The Brand Shoot AI backend is a robust, scalable Flask application that leverages Google's Gemini 2.5 Flash Image model to generate professional product photography. With a credit-based economy, Google Play integration, and comprehensive admin dashboard, it provides a complete solution for AI-powered image generation.

**Key Strengths**:
- ✅ Native AI image generation (no image editing, true generation)
- ✅ Three generation modes (Photoshoot, Catalogue, Branding)
- ✅ Secure authentication with JWT and Google OAuth
- ✅ Credit-based pay-per-use model
- ✅ Real-time job tracking with async processing
- ✅ Comprehensive admin dashboard
- ✅ Google Play purchase verification
- ✅ Category-specific prompt engineering
- ✅ MongoDB for flexible schema
- ✅ Docker-ready for deployment

**Architecture Highlights**:
- Blueprint-based modular design
- Model-Service-Controller pattern
- Middleware for authentication
- Job-based async processing
- Idempotent purchase handling
- Token usage tracking
- Safety filter integration

This backend serves as the foundation for a production-ready AI image generation platform suitable for e-commerce, marketing agencies, and content creators.

---

## Appendix: Complete API Reference

See individual route sections above for detailed endpoint documentation.

**Base URL**: `http://IP_ADDRESS:5000`

**Authentication**: `Authorization: Bearer <JWT_TOKEN>`

**Content-Type**: `application/json`

**Routes**:
- `/auth/*` - Authentication
- `/generate/*` - Image generation
- `/user/*` - User operations
- `/content/*` - Content delivery
- `/purchase/*` - In-app purchases
- `/admin/*` - Admin dashboard
- `/uploads/*` - Static file serving

---

**End of Backend Documentation**
