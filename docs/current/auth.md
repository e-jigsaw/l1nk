# l1nk Authentication Implementation Details

## Overview

Authentication is implemented using **OAuth 2.0** with the **Arctic** library. Session management is handled via **Cloudflare KV** and **HttpOnly Cookies** to ensure security and compatibility with the Cloudflare Edge runtime.

## Technology Choice: Arctic

[Arctic](https://arcticjs.dev/) is chosen for the following reasons:

- **Edge Compatible**: Built on standard Web APIs (Fetch, Crypto), making it perfect for Cloudflare Workers.
- **Lightweight**: Zero-dependency OAuth 2.0 client collection.
- **Developer Control**: Handles only the OAuth handshake, leaving session and user management to our application logic.

## Authentication Flow

### 1. Initiation (Login)

When a user clicks "Login with Google/GitHub":

- Generate a `state` and `code_verifier` (for PKCE).
- Store these values in a temporary cookie (short TTL, e.g., 10 mins).
- Use Arctic to generate the Authorization URL and redirect the user.

### 2. Callback & Verification

Upon redirect back from the provider:

- Retrieve `state` and `code_verifier` from the temporary cookie.
- Use Arctic's `validateAuthorizationCode` to exchange the `code` for an `accessToken`.
- Fetch user profile data (email, name, photo) from the provider's API using the `accessToken`.

### 3. Session Management (Cloudflare KV)

Once the user identity is verified:

- **User Sync**: Check if the user exists in **D1**. If not, create a new record. If yes, update their profile info.
- **Session Creation**:
  - Generate a cryptographically secure `sessionId`.
  - Store `session:{sessionId}` -> `{userId}` in **Cloudflare KV** with an expiration (e.g., 30 days).
- **Cookie Issue**: Set a cookie `l1nk_session={sessionId}`:
  - `HttpOnly`: Prevent XSS from stealing the session.
  - `Secure`: Ensure it's only sent over HTTPS.
  - `SameSite=Lax`: Balance between security and usability for redirects.

### 4. Middleware Protection (Hono)

A Hono middleware validates sessions for protected routes:

- Check for the `l1nk_session` cookie.
- Lookup the `sessionId` in KV.
- If valid, fetch user details from D1 (or cache in KV) and set them in the Hono context (`c.set('user', user)`).
- If invalid or missing, return `401 Unauthorized`.

## Supported Providers

- **Google**: Primary provider.
- **GitHub**: Secondary provider for developers.

## Security Considerations

- **CSRF Protection**: Handled by Arctic's `state` validation.
- **PKCE**: Used for all supported providers to prevent authorization code injection.
- **KV Expiration**: Sessions automatically expire via KV TTL, reducing manual cleanup overhead.
