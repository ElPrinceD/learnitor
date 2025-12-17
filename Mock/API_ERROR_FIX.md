# API Error Fix - Device Registration

## Problem Identified

The API call to `https://api.elevay.online/api/register-device/` was failing with:
- **Error Code**: -1200 (NSURLErrorDomain)
- **SSL Error**: -9816 (TLS handshake failure)
- **Root Cause**: Network/TLS issues, likely on cellular networks

## Issues Found

1. ❌ **No timeout** - Request could hang indefinitely
2. ❌ **No retry logic** - Single failure = permanent failure
3. ❌ **Silent error handling** - No logging to debug issues
4. ❌ **No error differentiation** - Treated all errors the same

## Fix Applied

### ✅ Added Timeout
- 10-second timeout to prevent hanging requests
- Prevents indefinite waiting on network issues

### ✅ Added Retry Logic
- 3 retry attempts with exponential backoff
- Retries on network/TLS errors and 5xx server errors
- Skips retry on 4xx client errors (authentication, validation, etc.)

### ✅ Better Error Handling
- Logs error details for debugging
- Differentiates between error types
- Smart retry logic based on error type

### ✅ Improved Logging
- Logs warnings when registration fails
- Includes error code, message, and URL
- Helps identify network vs server issues

## Code Changes

**File**: `usePushNotifications.ts`
**Function**: `saveTokenToBackend()`

**Before**:
```typescript
async function saveTokenToBackend(tokenData: string, authToken: string) {
  try {
    const response = await axios.post(...);
  } catch (error) {
    // Silent token save failure
  }
}
```

**After**:
```typescript
async function saveTokenToBackend(tokenData: string, authToken: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(..., {
        timeout: 10000, // 10 second timeout
      });
      return; // Success
    } catch (error) {
      // Smart retry logic with exponential backoff
      // Logs errors for debugging
      // Differentiates error types
    }
  }
}
```

## Expected Behavior

### Success Case
- Device token registered successfully
- No errors logged

### Retry Case
- First attempt fails (TLS error)
- Waits 1 second, retries
- Second attempt fails
- Waits 2 seconds, retries
- Third attempt succeeds
- Device registered

### Failure Case
- All 3 attempts fail
- Warning logged with error details
- App continues normally (non-critical operation)

## Testing

To verify the fix works:

1. **Check logs** - Look for `[PushNotifications]` messages
2. **Test on cellular** - The error was occurring on cellular networks
3. **Test on WiFi** - Should work normally
4. **Monitor retries** - Should see retry attempts in logs

## Impact

- ✅ **Improved reliability** - Retries handle transient network issues
- ✅ **Better debugging** - Error logs help identify issues
- ✅ **No breaking changes** - Still handles errors gracefully
- ✅ **Better UX** - More likely to successfully register device

## Next Steps

1. **Test the fix** - Run the app and check logs
2. **Monitor errors** - Watch for `[PushNotifications]` warnings
3. **Verify registration** - Check if device tokens are being registered
4. **If issues persist** - Check logs for specific error codes

## Additional Notes

- The error was **non-critical** - app worked fine without device registration
- Push notifications might not work if registration fails
- The fix makes registration more reliable but doesn't guarantee 100% success
- Network issues (especially on cellular) can still cause failures


