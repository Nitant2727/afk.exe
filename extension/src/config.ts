import * as vscode from 'vscode';
import { ExtensionConfig } from './types';

/**
 * Configuration manager
 */
export class Config {
  private static instance: Config;
  private readonly configSection = 'afk-coding-monitor';

  private constructor() {}

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * Get current configuration
   */
  public getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration(this.configSection);
    
    return {
      enabled: config.get<boolean>('enabled', true),
      serverUrl: config.get<string>('serverUrl', 'http://localhost:8000'),
      syncInterval: config.get<number>('syncInterval', 10) // Send immediately after each session
    };
  }

  /**
   * Update configuration
   */
  public async updateConfig<K extends keyof ExtensionConfig>(
    key: K,
    value: ExtensionConfig[K]
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.configSection);
    await config.update(key, value, vscode.ConfigurationTarget.Global);
  }

  /**
   * Show simple configuration menu
   */
  public async showConfigMenu(): Promise<void> {
    const config = this.getConfig();
    
    const options = [
      {
        label: `$(${config.enabled ? 'eye' : 'eye-closed'}) Monitoring: ${config.enabled ? 'Enabled' : 'Disabled'}`,
        action: 'toggle-enabled'
      },
      {
        label: `$(server) Server URL: ${config.serverUrl}`,
        action: 'set-server-url'
      }
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: 'AFK Monitor Settings'
    });

    if (!selected) return;

    switch (selected.action) {
      case 'toggle-enabled':
        await this.updateConfig('enabled', !config.enabled);
        vscode.window.showInformationMessage(`AFK Monitor ${!config.enabled ? 'enabled' : 'disabled'}`);
        break;

      case 'set-server-url':
        const newUrl = await vscode.window.showInputBox({
          prompt: 'Enter server URL',
          value: config.serverUrl,
          placeHolder: 'http://localhost:8000'
        });
        if (newUrl) {
          await this.updateConfig('serverUrl', newUrl);
          vscode.window.showInformationMessage('Server URL updated');
        }
        break;
    }
  }

  /**
   * Watch for config changes
   */
  public onConfigChanged(callback: (config: ExtensionConfig) => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration(this.configSection)) {
        callback(this.getConfig());
      }
    });
  }
} 