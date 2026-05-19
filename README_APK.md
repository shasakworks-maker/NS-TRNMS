# Converting NS Tournaments to APK

This project is configured to be easily converted into an Android APK.

## Option 1: Using Capacitor (Recommended)

1. **Build the web project**:
   ```bash
   npm run build
   ```
2. **Sync with Android**:
   ```bash
   npx cap sync
   ```
3. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```
4. **Build APK**: In Android Studio, go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

## Option 2: Zip to APK (Simple)

If you want to use a "Website to APK" converter:

1. **Run the build**:
   ```bash
   npm run build
   ```
2. **Zip the `dist` folder**:
   - Go to the `dist` directory.
   - Select all files inside `dist` and compress them into a `.zip` file.
3. **Upload to Converter**:
   - Use a tool like [Website 2 APK Builder](https://websitetoapk.com/) or similar.
   - Point the tool to your `index.html` inside the zip.

## Important Configuration

- **API URL**: Since the APK runs locally, it needs to know where your backend (OTP service) is hosted.
- Update the `VITE_API_URL` in your `.env` file with your deployed Netlify/Server URL (e.g., `https://your-app.netlify.app`) before running `npm run build`.
- If you don't set this, OTP and System Notifications will not work in the APK.
