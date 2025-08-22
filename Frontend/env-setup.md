# Environment Setup for GitHub OAuth

## Frontend Environment Variables

Create a `.env` file in the `Frontend/` directory with the following content:

```env
# GitHub OAuth Configuration
VITE_GITHUB_CLIENT_ID=your_github_client_id_here

# Backend API URL (default: http://localhost:8000)
VITE_API_URL=http://localhost:8000
```

**Important:** Never include `VITE_GITHUB_CLIENT_SECRET` in your frontend environment variables! This would be a security vulnerability.

## Backend Environment Variables

Create a `.env` file in the `Backend/` directory or set these environment variables:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

## Getting GitHub OAuth Credentials

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: AFK Monitor
   - **Homepage URL**: `http://localhost:5173` (or your domain)
   - **Authorization callback URL**: `http://localhost:5173/auth/github/callback`
4. Click "Register application"
5. Copy the Client ID and Client Secret
6. Add them to your environment files

## Security Notes

- **Client Secret** should ONLY be in backend environment variables
- **Client ID** can be in frontend environment variables (it's public)
- Never commit environment files to version control
- Use different OAuth apps for development and production 