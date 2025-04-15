# Unified Authentication System Implementation Guide

## Implementation Steps

1. **Create the main files**
   - Copy `authService.ts` into `src/services/`
   - Copy `AuthProvider.tsx` into `src/services/`
   - Copy `axiosAuthInterceptor.ts` into `src/services/`

3. **Update the _app.tsx or layout.tsx file**
   ```tsx
   // In your root application file
   import { AuthProvider } from '@/services/AuthProvider';

   function MyApp({ Component, pageProps }) {
     return (
       <AuthProvider>
         <Component {...pageProps} />
       </AuthProvider>
     );
   }
   ```

4. **Check environment variables**
   Ensure the following Auth0 variables are defined in your `.env.local` file:
   ```
   NEXT_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
   NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
   NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-identifier
   NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

## Key Points to Check

### 1. Verify protected routes
For routes requiring authentication, add this code at the beginning of your component or in your layout:

```tsx
const { isAuthenticated, isLoading } = useAuthContext();
const router = useRouter();

useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    const returnTo = window.location.pathname;
    router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
}, [isAuthenticated, isLoading, router]);
```

### 2. Configure the Auth0 callback
Ensure your callback page is correctly set up to handle redirection after authentication:

```tsx
// pages/callback.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/services/AuthProvider';

export default function Callback() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect to destination page or home page
        const returnTo = router.query.state
          ? JSON.parse(router.query.state as string)?.returnTo
          : '/';
        router.replace(returnTo || '/');
      } else {
        // Authentication issue
        router.replace('/login?error=authentication_failed');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return <div>Loading...</div>;
}
```

### 3. Update API services
Replace all your API calls to use `apiClient`:

```ts
// Before
const response = await fetch('api/endpoint', {
  headers: { Authorization: `Bearer ${token}` }
});

// After
import apiClient from '@/services/axiosAuthInterceptor';
const response = await apiClient.get('/api/endpoint');
```

## Troubleshooting

### Issue: Authentication does not persist between pages

1. **Check local storage**: Open the browser console, go to the Application tab -> Local Storage, and ensure the `auth_state` key exists and contains a valid token.

2. **Check cookies**: In the Application tab -> Cookies, ensure the `access_token` cookie exists.

3. **Disable third-party cookie blocking**: Some browsers block third-party cookies. Ensure cookies are allowed for your domain.

4. **Check logs**: Enable debug logs in dev and check for `[Auth]` messages in the console.

### Issue: Persistent 401 errors

1. **Check token expiration**: The token may have expired. Ensure Auth0 is configured with `useRefreshTokens: true`.

2. **Check CORS configuration**: The backend must allow requests from the frontend with authentication headers.

3. **Check token audience**: Ensure the audience configured in Auth0 matches the one expected by the backend.

### Issue: "Invalid State" errors during authentication

This can occur when Auth0 state is not correctly handled. Ensure `cacheLocation: "localstorage"` is used in the Auth0 configuration.

## Tests to Perform

1. **Login test**: Log in and verify you are correctly redirected.
2. **Navigation test**: Navigate between several protected pages without being logged out.
3. **Reload test**: Reload the page and ensure you remain logged in.
4. **Logout test**: Log out and verify you are redirected to the home page.
5. **Expiration test**: Wait for the token to expire and ensure it is automatically renewed.

