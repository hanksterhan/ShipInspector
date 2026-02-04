# Ship Inspector
A utility to help track poker hands that have been played.

## Usage

### Build Common Library

```bash
cd common
npm run build
```

### Start up the server

```bash
cd server
npm run watch
```

### Start up the web app in a new terminal window

```bash
cd web
npm run start
```

## Deployment Configuration

### Clerk Authentication Setup

Ship Inspector uses Clerk for authentication. To deploy to Vercel (preview or production), you must configure Clerk to allow your deployment domains.

#### Step 1: Configure Clerk Dashboard (Required)

1. Navigate to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your Clerk application (e.g., `deciding-bunny-61`)
3. Go to **Configure → Paths**
4. Add the following to **"Authorized redirect URLs"**:
   - For Vercel previews: `https://*.vercel.app/*`
   - For production: `https://your-production-domain.com/*`
5. Add the following to **"Authorized origins"**:
   - For Vercel previews: `https://*.vercel.app`
   - For production: `https://your-production-domain.com`
6. Save changes

**Why this is required:** Vercel preview deployments generate unique URLs like `https://ship-inspector-git-{branch}-{project}.vercel.app`. Clerk requires these domains to be whitelisted before it will complete OAuth redirect flows. Without this configuration, users will experience an infinite auth loop.

#### Step 2: Set Vercel Environment Variables

In your Vercel project dashboard:

1. Go to **Settings → Environment Variables**
2. Add the following variables for the **Preview** environment:
   - `CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key (e.g., `pk_test_...`)
   - `CLERK_SECRET_KEY` - Your Clerk secret key
   - `API_URL` - (Optional) Defaults to empty string for relative requests
3. For **Production** environment, add the same variables with production values if different
4. Redeploy to apply the new environment variables

#### Step 3: Verify Configuration

After configuring Clerk and setting environment variables:

1. Trigger a new preview build (push to your branch)
2. Navigate to the preview URL
3. Click "Sign In"
4. Complete the Clerk sign-in flow
5. Verify you are redirected back to `/poker-hands` successfully
6. Verify API calls work with authentication

#### Troubleshooting Auth Loop

If you experience an infinite auth loop (continuously redirected to sign-in):

1. **Check Clerk Dashboard**: Verify your deployment domain is in "Authorized redirect URLs" and "Authorized origins"
2. **Check Vercel Environment Variables**: Ensure `CLERK_PUBLISHABLE_KEY` is set for the Preview environment
3. **Check Browser Console**: Look for Clerk-related errors that might indicate domain mismatch
4. **Verify Domain Pattern**: Ensure you're using wildcards (`*.vercel.app`) or have added the specific preview URL

#### Local Development

For local development, create a `web/.env` file:

```
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

The webpack configuration will use this for local development builds.

### Helpful commands

#### Lint
```bash
cd web
npm run lint
```

#### Test on Server
```bash
cd server
npm test -- hand.spec.ts
```