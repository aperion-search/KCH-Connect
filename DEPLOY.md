# Deploying KCH Connect on Render

Follow these simple steps to deploy your KCH Connect application on [Render](https://render.com):

## Step 1: Push your code to GitHub
Make sure your repository is pushed to GitHub (including `render.yaml`, `package.json`, `server.js`, `sync.js`, and the `frontend` folder).

## Step 2: Create a Web Service on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click on **New +** and select **Web Service**.
3. Connect your GitHub repository (`KCH_Connect`).

## Step 3: Configure Service Settings
Render will automatically detect settings from `render.yaml`, but verify the following settings:
- **Name**: `kch-connect`
- **Environment**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

## Step 4: Add Environment Variables
In the Render dashboard under **Environment Variables**, add your Mega credentials:
- `MEGA_EMAIL` = `your-mega-email@gmail.com`
- `MEGA_PASSWORD` = `your-mega-password`
- `NODE_ENV` = `production`

## Step 5: Deploy
Click **Create Web Service**. Render will automatically install root and frontend dependencies, build the React frontend, start the Node.js server, and sync your data with Mega cloud storage!
