# Brand Shoot — Web App (User Website)

This is the **user-facing website** version of the mobile app (the React Native app in the project root).
It is completely separate from `web-frontend/` (which is the **admin dashboard**).

It uses the **same Flask + MongoDB backend** and the same theme as the mobile app.

## Run it

```bash
cd web-app
npm install
npm run dev      # opens on http://localhost:5174
```

Production build:

```bash
npm run build    # output in dist/
```

## Backend URL

Set in [src/config.js](src/config.js):

```js
export const API_BASE_URL = 'http://72.62.79.188:1300';
```

Change it to `http://localhost:5000` (or your server IP) for local development.

## Folder structure

```
web-app/
├── index.html
├── vite.config.js
├── src/
│   ├── main.jsx              # entry point
│   ├── App.jsx               # all routes (like AppNavigator.tsx in mobile)
│   ├── config.js             # backend URL
│   ├── theme.css             # same colors/spacing as mobile src/theme/
│   ├── context/
│   │   └── AuthContext.jsx   # login/signup/google/logout (token in localStorage)
│   ├── services/
│   │   └── api.js            # ALL backend calls (auth, content, generate, user, purchase, video)
│   ├── utils/
│   │   └── imageUtils.js     # file→base64, downloads
│   ├── components/           # shared UI (header, dropzone, modals, sidebar, result viewer)
│   └── pages/
│       ├── auth/             # Login, Signup (with Google Sign-In)
│       ├── Home.jsx          # Discover page (categories + showcase)
│       ├── photoshoot/       # model → upload → result
│       ├── catalogue/        # model → photos → background → upload → result
│       ├── branding/         # model → pose → settings → upload → result
│       ├── ads/              # AI video ads (category → prompt → generate → result)
│       └── user/             # profile, my creations, buy credits
```

## Screen mapping (mobile → web)

| Mobile screen | Web route |
| --- | --- |
| LoginScreen / SignupScreen | `/login`, `/signup` |
| HomeScreen | `/` |
| ModelSelection → Upload → Result | `/photoshoot/models` → `/photoshoot/upload` → `/photoshoot/result` |
| Catalogue flow | `/catalogue/models` → `/catalogue/photos` → `/catalogue/background` → `/catalogue/upload` → `/catalogue/result` |
| Branding flow | `/branding/models` → `/branding/poses` → `/branding/settings` → `/branding/upload` → `/branding/result` |
| AdsHome → AdsPrompt → AdsGeneration → AdsResult | `/ads` → `/ads/prompt` → `/ads/generate` → `/ads/result` |
| UserProfile / UserHistory / BuyMoreImages | `/profile`, `/history`, `/buy-credits` |

## Notes

- **Google Sign-In** uses the same web client ID as the mobile app. For it to work, your
  website origin (e.g. `http://localhost:5174` and your production domain) must be added
  to "Authorized JavaScript origins" in the Google Cloud Console for that OAuth client.
- **Buying credits**: payments go through Google Play in-app purchases, which only exist
  inside the Android app. The web Buy page shows the same UI and points users to the app.
- **CORS**: the backend uses flask-cors, so the website can call it directly.
