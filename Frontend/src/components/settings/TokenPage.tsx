import { useState } from 'react';
import { Copy, Check, Shield, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const TokenPage = () => {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const copyToken = async () => {
    const token = user?.extension_token || 'dev-token-123';
    
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success('Token copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy token');
    }
  };

  const extensionToken = user?.extension_token || 'dev-token-123';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Extension Token</h1>
        <p className="text-muted-foreground mt-2">
          Use this token to connect your VS Code or Cursor extension
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Your Extension Token
          </CardTitle>
          <CardDescription>
            This token allows the AFK Monitor extension to send your coding data to the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg font-mono text-sm break-all">
            {extensionToken}
          </div>
          
          <Button 
            onClick={copyToken}
            className="w-full sm:w-auto"
            variant="outline"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Token
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
          <CardDescription>
            Follow these steps to connect your editor extension
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Install the Extension</p>
                <p className="text-sm text-muted-foreground">
                  Install the AFK Monitor extension in VS Code or Cursor
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Configure the Token</p>
                <p className="text-sm text-muted-foreground">
                  Copy the token above and paste it in the extension settings
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Start Coding</p>
                <p className="text-sm text-muted-foreground">
                  Your coding activity will automatically appear in the dashboard
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Important information about your token security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <Shield className="w-4 h-4 mt-0.5 text-green-500" />
            <p>This token is unique to your account and should be kept private</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Shield className="w-4 h-4 mt-0.5 text-green-500" />
            <p>Only share this token with trusted development tools</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Shield className="w-4 h-4 mt-0.5 text-green-500" />
            <p>The token only allows reading your coding activity data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenPage; 