# Deployment Guide for Netlify

Your application is now configured for Netlify deployment using a serverless architecture for the backend (Netlify Functions) and a Vite static frontend.

## 1. Prerequisites
- A Netlify account.
- Your project pushed to a GitHub/GitLab repository.

## 2. Environment Variables
In the Netlify dashboard (Site settings > Environment variables), you must add the following variables:

| Variable | Description |
| :--- | :--- |
| `EMAIL_USER` | Your Gmail address (for OTP). |
| `EMAIL_PASS` | Your Gmail App Password. |
| `VITE_ADMIN_EMAIL` | Default admin email. |
| `VITE_ADMIN_PASSWORD` | Default admin password. |
| `VITE_PLAYER_EMAIL` | Optional: Default player email for testing. |
| `VITE_PLAYER_PASSWORD` | Optional: Default player password for testing. |

## 3. Deployment Steps
1. In Netlify, click **"Add new site"** > **"Import an existing project"**.
2. Select your repository.
3. The build settings should be automatically detected from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
4. Click **"Deploy site"**.

## 4. Known Limitations (Mock Mode)
- **Data Persistence**: This app currently uses `localStorage` for tournament data and user accounts. This means each player has their own private data. For a shared experience, you must integrate a real database like **Firebase Firestore**.
- **OTP Storage**: OTPs are stored in a server-side `Map`. In a serverless environment like Netlify, if multiple function instances are running, they won't share this Map. For a production app, use **Redis** or **Firestore** for OTP verification.

## 5. Next Steps for Professional App
- Run the `set_up_firebase` tool to add a real database for shared tournament state.
- Update `VITE_API_URL` to your live Netlify URL if you generate an APK using Capacitor.
