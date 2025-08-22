# AFK Coding Monitor - Frontend

A beautiful, modern frontend for tracking and analyzing your coding activity across VS Code and Cursor IDEs.

## Features

- 🎨 **Modern UI**: Beautiful interface built with React, TypeScript, and TailwindCSS
- 📊 **Rich Visualizations**: Interactive charts and graphs using Recharts
- 🔐 **GitHub Authentication**: Secure OAuth login with GitHub
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- ⚡ **Real-time Updates**: Live connection status with your IDE extensions
- 🎭 **Smooth Animations**: Powered by Framer Motion
- 🌙 **Dark/Light Mode**: Toggle between themes
- 📈 **Comprehensive Analytics**: 
  - Daily, weekly, and monthly coding patterns
  - Language distribution and usage
  - Project breakdown and statistics
  - Productivity metrics and trends

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Zustand** - State management
- **React Query** - Data fetching
- **React Router** - Navigation
- **Shadcn/ui** - UI components
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Running AFK Coding Monitor backend

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
VITE_API_BASE_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
   - Application name: AFK Coding Monitor
   - Homepage URL: http://localhost:5173
   - Authorization callback URL: http://localhost:5173/auth/github/callback
3. Copy the Client ID to your `.env` file

**Important**: The callback URL must be exactly `http://localhost:5173/auth/github/callback` for the OAuth flow to work properly. If you deploy to production, update it to your domain (e.g., `https://yourdomain.com/auth/github/callback`).

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard and analytics
│   ├── layout/         # Layout components (Header, Sidebar)
│   └── ui/             # Reusable UI components (shadcn/ui)
├── lib/                # Utilities and helpers
│   ├── api.ts          # API client
│   └── utils.ts        # Helper functions
├── store/              # State management
│   └── authStore.ts    # Authentication store
├── types/              # TypeScript type definitions
│   └── api.ts          # API types
└── App.tsx             # Main application component
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend integrates with the AFK Coding Monitor backend API:

- **Authentication**: GitHub OAuth flow
- **Sessions**: CRUD operations for coding sessions
- **Statistics**: Various analytics endpoints
- **Real-time**: WebSocket connection for live updates

## Key Components

### Dashboard
- Overview statistics cards
- Interactive charts and visualizations
- Real-time activity tracking
- Productivity insights

### Authentication
- GitHub OAuth integration
- Token management
- Protected routes
- User profile

### Analytics
- Language distribution
- Project breakdown
- Daily/weekly/monthly trends
- Productivity metrics

## Customization

### Themes
The application supports light and dark themes. Customize colors in `src/index.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  /* ... more variables */
}
```

### Charts
Customize chart appearance in the respective dashboard components. All charts use Recharts with consistent theming.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API integration guide
