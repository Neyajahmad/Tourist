# Google Maps API Troubleshooting Guide

## Current Issue
The Google Maps API is failing to load with the error: "Oops! Something went wrong. This page didn't load Google Maps correctly"

## API Key Information
- **Current API Key**: `AIzaSyAABImcnCQJvcX4u0Vesivu7A8`
- **Script URL**: `https://maps.googleapis.com/maps/api/js?key=AIzaSyAABImcnCQJvcX4u0Vesivu7A8&callback=initMap&v=weekly`

## Common Causes & Solutions

### 1. Billing Not Enabled (Most Common)
**Symptom**: Error message in console about billing

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "Billing" in the left menu
4. Enable billing for the project
5. Link a valid payment method

**Note**: Google Maps requires billing to be enabled even for free tier usage.

### 2. Maps JavaScript API Not Enabled
**Symptom**: Error about API not being enabled

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Library"
3. Search for "Maps JavaScript API"
4. Click on it and press "Enable"

### 3. API Key Restrictions
**Symptom**: Error about referer restrictions

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Click on your API key
4. Under "Application restrictions":
   - For development: Select "None" (temporarily)
   - For production: Select "HTTP referrers" and add:
     - `http://localhost:*`
     - `http://localhost:5173/*`
     - `https://yourdomain.com/*`
5. Under "API restrictions":
   - Select "Restrict key"
   - Enable: "Maps JavaScript API"
   - Enable: "Places API" (if using places features)
   - Enable: "Geocoding API" (if using geocoding)

### 4. Invalid or Expired API Key
**Symptom**: Authentication error

**Solution**:
1. Verify the API key is correct
2. Create a new API key if needed:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the new key
   - Update `client/index.html` with the new key

### 5. Quota Exceeded
**Symptom**: Error about quota limits

**Solution**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Dashboard"
3. Click on "Maps JavaScript API"
4. Check the quota usage
5. Request quota increase if needed

## Testing the API Key

### Quick Test in Browser Console
Open your browser console and run:
```javascript
fetch('https://maps.googleapis.com/maps/api/js?key=AIzaSyAABImcnCQJvcX4u0Vesivu7A8&callback=test')
  .then(response => {
    console.log('API Key Status:', response.status);
    if (response.status === 200) {
      console.log('✓ API key is valid and accessible');
    } else {
      console.error('✗ API key issue detected');
    }
  })
  .catch(error => console.error('Error:', error));
```

### Check Browser Console for Specific Errors
Look for error messages that contain:
- "RefererNotAllowedMapError" → Fix API key restrictions
- "ApiNotActivatedMapError" → Enable Maps JavaScript API
- "BillingNotEnabledMapError" → Enable billing
- "InvalidKeyMapError" → API key is invalid

## Implementation Changes Made

### 1. Updated `client/index.html`
- Removed `libraries=marker` parameter (not needed for basic markers)
- Added `callback=initMap` for proper initialization
- Added `v=weekly` for stable API version
- Added global error handler `gm_authFailure` to catch authentication errors

### 2. Updated `client/src/components/GoogleMapWrapper.jsx`
- Improved API loading detection
- Added callback-based initialization
- Extended timeout to 15 seconds
- Added detailed error logging
- Better error messages for users

## Next Steps

1. **Check Browser Console**: Open DevTools (F12) and look for specific error messages
2. **Verify API Key**: Go to Google Cloud Console and verify the key exists and is active
3. **Enable Billing**: This is required even for free tier usage
4. **Enable APIs**: Ensure Maps JavaScript API is enabled
5. **Check Restrictions**: Temporarily remove all restrictions to test
6. **Test with New Key**: If all else fails, create a new API key

## Alternative: Use a Test API Key

For development/testing, you can use Google's test API key (limited functionality):
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_NEW_KEY_HERE&callback=initMap&v=weekly"></script>
```

## Contact Information

If the issue persists after trying all solutions:
1. Check the [Google Maps Platform Status](https://status.cloud.google.com/)
2. Review [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
3. Contact Google Cloud Support

## Current Status

✓ Script tag updated with callback and error handling
✓ Component updated with better loading detection
✓ Error messages improved for debugging
⚠ **Action Required**: Verify API key configuration in Google Cloud Console
