# Deploying to Fly.io

## Prerequisites
1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Create free Fly.io account
3. Login: `flyctl auth login`

## Step 1: Deploy Backend

```bash
cd /home/unknown/Desktop/shoppin-assistant

# Launch backend on Fly.io
flyctl launch --name shopping-assistant-backend --region pdx --no-deploy

# Set environment variables (secrets)
flyctl secrets set \
  MONGODB_URI="mongodb+srv://yahyashahzadanees_db_user:ZIOYBQrolvly7r5Z@shoppingassistant.adspbes.mongodb.net/shopping_assistant?retryWrites=true&w=majority&appName=shoppingassistant" \
  JWT_SECRET="your-secret-key-here"

# Deploy
flyctl deploy
```

Get the backend URL from the output (e.g., `shopping-assistant-backend.fly.dev`)

## Step 2: Deploy Frontend

```bash
cd frontend

# Create fly.toml for frontend
flyctl launch --name shopping-assistant-frontend --region pdx --no-deploy

# Build and deploy with environment variables
flyctl deploy \
  --build-arg VUE_APP_API_URL="https://shopping-assistant-backend.fly.dev/api" \
  --build-arg VUE_APP_SOCKET_URL="https://shopping-assistant-backend.fly.dev"
```

## Access Your App

- **Frontend**: https://shopping-assistant-frontend.fly.dev
- **Backend API**: https://shopping-assistant-backend.fly.dev/api
- **Works on mobile**: ✅ Yes!

## Useful Commands

```bash
# View logs
flyctl logs

# SSH into app
flyctl ssh console

# Scale (free tier: 3 shared-cpu-1x 256MB apps)
flyctl scale count 1

# Redeploy
flyctl deploy
```

## Notes
- Free tier includes: 3 shared-cpu apps, 3GB storage, 160 GB data transfer/month
- Apps auto-scale to 0 when idle (cold start ~30s on first request)
- Perfect for demos and testing!
