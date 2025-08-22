import { useEffect } from 'react';

const GitHubCallback = () => {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const error_description = urlParams.get('error_description');

        if (error) {
          // Handle OAuth error
          const errorMessage = error_description || error;
          if (window.opener && window.opener.github_oauth_callback) {
            window.opener.github_oauth_callback({ error: errorMessage });
          }
          window.close();
          return;
        }

        if (!code) {
          // No code received
          if (window.opener && window.opener.github_oauth_callback) {
            window.opener.github_oauth_callback({ error: 'No authorization code received from GitHub' });
          }
          window.close();
          return;
        }

        // Send the code to our backend to handle the token exchange securely
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/auth/github/callback`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error occurred' }));
          if (window.opener && window.opener.github_oauth_callback) {
            window.opener.github_oauth_callback({ 
              error: errorData.error || `Authentication failed with status ${response.status}` 
            });
          }
          window.close();
          return;
        }

        const result = await response.json();

        if (!result.success) {
          if (window.opener && window.opener.github_oauth_callback) {
            window.opener.github_oauth_callback({ 
              error: result.error || 'Authentication failed. Please try again.' 
            });
          }
          window.close();
          return;
        }

        // Authentication successful
        if (window.opener && window.opener.github_oauth_callback) {
          window.opener.github_oauth_callback({
            success: true,
            user: result.data.user,
            access_token: result.data.access_token,
            is_new_user: result.data.user.is_new_user
          });
        }

        // Close the popup
        window.close();

      } catch (error) {
        console.error('OAuth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
        if (window.opener && window.opener.github_oauth_callback) {
          window.opener.github_oauth_callback({ error: errorMessage });
        }
        window.close();
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="loading-spinner w-8 h-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Completing authentication...</p>
        <p className="text-sm text-muted-foreground mt-2">This window will close automatically</p>
      </div>
    </div>
  );
};

export default GitHubCallback; 