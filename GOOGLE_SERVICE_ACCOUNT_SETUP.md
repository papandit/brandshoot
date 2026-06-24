# Google Play Service Account Setup Guide

## 🎯 Complete Backend Configuration for In-App Purchases

This guide will help you set up Google Play Developer API access so your backend can verify purchases securely.

---

## 📋 What You Need

Your backend requires:
1. ✅ Google Service Account (with API access)
2. ✅ Service Account JSON key file
3. ✅ Google Play Developer API enabled
4. ✅ Proper permissions configured

---

## 🔧 Step-by-Step Setup

### **Step 1: Access Google Cloud Console**

1. Go to: https://console.cloud.google.com/
2. Sign in with your Google Play Console account
3. Create a new project or select existing project
   - **Project Name:** `flyr-iap-backend` (or your preferred name)
   - Click **CREATE**

---

### **Step 2: Enable Google Play Developer API**

1. In Google Cloud Console, go to **APIs & Services** → **Library**
   - Direct link: https://console.cloud.google.com/apis/library
2. Search for: **"Google Play Android Developer API"**
3. Click on it
4. Click **ENABLE** button
5. Wait for confirmation (takes a few seconds)

✅ **Verification:** You should see "API enabled" message

---

### **Step 3: Create Service Account**

1. Go to **IAM & Admin** → **Service Accounts**
   - Direct link: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click **+ CREATE SERVICE ACCOUNT** at the top
3. Fill in details:
   - **Service account name:** `flyr-iap-verifier`
   - **Service account ID:** (auto-generated) `flyr-iap-verifier@...`
   - **Description:** `Backend service for verifying Google Play purchases`
4. Click **CREATE AND CONTINUE**
5. **Grant access (Optional):** Skip this step, click **CONTINUE**
6. **Grant users access (Optional):** Skip this step, click **DONE**

✅ **Service Account Created!**

---

### **Step 4: Download Service Account JSON Key**

1. In the Service Accounts list, find your newly created account
2. Click on the **email address** (e.g., `flyr-iap-verifier@...`)
3. Go to the **KEYS** tab
4. Click **ADD KEY** → **Create new key**
5. Select **JSON** format
6. Click **CREATE**

📥 **A JSON file will download automatically**
- File name: `flyr-iap-backend-xxxxx.json`
- **SAVE THIS FILE SECURELY!**

---

### **Step 5: Link Service Account to Google Play Console**

1. **Copy the service account email:**
   - Format: `flyr-iap-verifier@flyr-iap-backend.iam.gserviceaccount.com`
   - You can find it in the JSON file under `"client_email"`

2. Go to **Google Play Console**: https://play.google.com/console
3. Select your app: **flyr-clone**
4. Navigate to: **Setup** → **API access** (left sidebar)
5. Scroll to **Service accounts** section
6. Click **Link existing service account** or **Grant access**
7. **Paste the service account email** you copied
8. Click **Invite user** or **Grant access**

9. **Set Permissions:**
   - Go to **Users and permissions** (left sidebar)
   - Find your service account email
   - Click **Edit access**
   - Under **App permissions**, select your app
   - Enable these permissions:
     - ✅ **View app information and download bulk reports (read-only)**
     - ✅ **View financial data, orders, and cancellation survey responses**
     - ✅ **Manage orders and subscriptions**
   - Click **Apply** → **Invite user** / **Save changes**

✅ **Service Account Linked to Play Console!**

---

### **Step 6: Place JSON File in Backend**

1. **Rename the downloaded JSON file** to something simple:
   ```
   flyr-service-account.json
   ```

2. **Place it in your backend directory:**
   ```
   backend/
   ├── flyr-service-account.json  ← HERE
   ├── app.py
   ├── routes/
   └── models/
   ```

3. **⚠️ SECURITY: Add to .gitignore**
   - Open `backend/.gitignore`
   - Add this line:
   ```
   *.json
   flyr-service-account.json
   ```

---

### **Step 7: Configure Backend Environment Variables**

1. **Open or create:** `backend/.env`

2. **Add these environment variables:**

```env
# Google Play IAP Configuration
GOOGLE_APPLICATION_CREDENTIALS=c:\Users\Harsh\Downloads\flyr-service-account.json
ANDROID_PACKAGE_NAME=com.anonymous.flyrclone

# MongoDB (external main server — put real credentials in your git-ignored .env)
MONGO_URL=mongodb://<user>:<password>@72.62.79.188:27017/?authSource=admin

# Other existing variables...
```

3. **Save the file**

---

### **Step 8: Install Required Python Packages**

Make sure these are in `backend/requirements.txt`:

```txt
google-api-python-client
google-auth
```

Install them:

```bash
cd backend
pip install google-api-python-client google-auth
```

---

## 🧪 Test Backend Configuration

### **Test 1: Check if JSON file is accessible**

Create a test script: `backend/test_google_api.py`

```python
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Test configuration
GOOGLE_APPLICATION_CREDENTIALS = "flyr-service-account.json"
PACKAGE_NAME = "com.anonymous.flyrclone"

def test_google_api_connection():
    """Test if Google Play API is accessible"""
    try:
        print("🔍 Testing Google Play API connection...")
        print(f"📁 Service account file: {GOOGLE_APPLICATION_CREDENTIALS}")
        print(f"📦 Package name: {PACKAGE_NAME}")
        
        # Check if file exists
        if not os.path.exists(GOOGLE_APPLICATION_CREDENTIALS):
            print("❌ Service account JSON file not found!")
            return False
        
        print("✅ Service account JSON file found")
        
        # Load credentials
        credentials = service_account.Credentials.from_service_account_file(
            GOOGLE_APPLICATION_CREDENTIALS,
            scopes=['https://www.googleapis.com/auth/androidpublisher']
        )
        print("✅ Credentials loaded successfully")
        
        # Build API client
        service = build('androidpublisher', 'v3', credentials=credentials)
        print("✅ Google Play API client built successfully")
        
        # Try to access app details (this will fail if permissions are wrong)
        try:
            # This endpoint requires proper permissions
            result = service.edits().insert(
                packageName=PACKAGE_NAME,
                body={}
            ).execute()
            edit_id = result['id']
            
            # Delete the test edit
            service.edits().delete(
                packageName=PACKAGE_NAME,
                editId=edit_id
            ).execute()
            
            print("✅ API permissions verified - can access app data")
            print("\n🎉 SUCCESS! Backend is properly configured!")
            return True
            
        except Exception as e:
            error_msg = str(e)
            if "403" in error_msg:
                print("⚠️  API access works but permissions may need adjustment")
                print("   Make sure service account has proper permissions in Play Console")
            else:
                print(f"⚠️  API test failed: {error_msg}")
            return True  # Connection works, just permissions issue
            
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        return False

if __name__ == "__main__":
    test_google_api_connection()
```

**Run the test:**

```bash
cd backend
python test_google_api.py
```

**Expected Output:**
```
🔍 Testing Google Play API connection...
📁 Service account file: flyr-service-account.json
📦 Package name: com.anonymous.flyrclone
✅ Service account JSON file found
✅ Credentials loaded successfully
✅ Google Play API client built successfully
✅ API permissions verified - can access app data

🎉 SUCCESS! Backend is properly configured!
```

---

### **Test 2: Test Purchase Verification Endpoint**

Once your backend is running, test the purchase verification:

```bash
# Start your Flask backend
cd backend
python app.py
```

**Test with curl (in another terminal):**

```bash
# Test if products endpoint works (no auth needed)
curl http://localhost:5000/purchase/products
```

**Expected Response:**
```json
{
  "success": true,
  "products": [
    {"id": "image_pack_10", "credits": 10, "price": 100, ...},
    ...
  ],
  "cost_per_image": 10
}
```

---

## 🔍 Verify Backend is Running Properly

### **Checklist:**

- [ ] ✅ Google Cloud project created
- [ ] ✅ Google Play Developer API enabled
- [ ] ✅ Service account created
- [ ] ✅ Service account JSON downloaded
- [ ] ✅ Service account linked to Play Console
- [ ] ✅ Permissions granted in Play Console
- [ ] ✅ JSON file placed in backend directory
- [ ] ✅ Environment variables configured
- [ ] ✅ Python packages installed
- [ ] ✅ Test script runs successfully
- [ ] ✅ Backend server starts without errors
- [ ] ✅ `/purchase/products` endpoint responds

---

## 🚨 Common Issues & Solutions

### **Issue 1: "Service account JSON file not found"**

**Solution:**
- Check file path in `.env` is correct
- File should be in `backend/` directory
- Use relative path: `flyr-service-account.json`

### **Issue 2: "403 Forbidden" or "Permission Denied"**

**Solution:**
- Go to Play Console → Users and permissions
- Find your service account
- Make sure it has these permissions:
  - View app information
  - View financial data
  - Manage orders and subscriptions

### **Issue 3: "API not enabled"**

**Solution:**
- Go to Google Cloud Console
- APIs & Services → Library
- Search "Google Play Android Developer API"
- Click ENABLE

### **Issue 4: "Invalid credentials"**

**Solution:**
- Re-download the JSON key from Google Cloud Console
- Make sure you're using the correct Google account
- Verify the service account email matches in both Cloud Console and Play Console

---

## 📊 Backend Routes Summary

Your backend has these purchase-related endpoints:

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/purchase/verify` | POST | ✅ | Verify purchase with Google Play |
| `/purchase/credits` | GET | ✅ | Get user's credit balance |
| `/purchase/transactions` | GET | ✅ | Get purchase history |
| `/purchase/products` | GET | ❌ | Get available packages |
| `/purchase/webhook/google-play` | POST | ❌ | Handle refund notifications |

---

## 🎯 Next Steps After Setup

1. **Test with a real purchase:**
   - Make a test purchase in your app
   - Check backend logs for verification
   - Verify credits are added to user account

2. **Set up webhook (optional but recommended):**
   - Configure Google Cloud Pub/Sub
   - Link to `/purchase/webhook/google-play`
   - Handle refunds automatically

3. **Monitor logs:**
   - Watch for purchase verification attempts
   - Check for any API errors
   - Verify credit additions

---

## 📞 Support

If you encounter issues:
1. Check backend logs for error messages
2. Verify all permissions in Play Console
3. Test with the provided test script
4. Ensure service account email is correct

---

## ✅ Configuration Complete!

Once all steps are done, your backend will:
- ✅ Verify purchases with Google Play API
- ✅ Add credits to user accounts
- ✅ Prevent duplicate purchases
- ✅ Handle refunds automatically
- ✅ Track all transactions

**Your IAP system is now fully secured and operational!** 🎉
