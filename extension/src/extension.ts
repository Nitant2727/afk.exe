// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Monitor } from './monitor';
import { Config } from './config';

let monitor: Monitor | null = null;

/**
 * Extension activation - simplified version
 */
export async function activate(context: vscode.ExtensionContext) {
	try {
		console.log('[AFK] Activating AFK Coding Monitor...');
		
		// Initialize monitor
		monitor = new Monitor(context);
		
		// Register commands
		registerCommands(context);
		
		// Initialize monitoring
		await monitor.initialize();
		
		context.subscriptions.push(monitor);
		
		console.log('[AFK] AFK Coding Monitor activated successfully!');
		
	} catch (error: any) {
		console.error(`[AFK] Activation failed: ${error.message}`);
		vscode.window.showErrorMessage(`AFK Monitor activation failed: ${error.message}`);
	}
}

/**
 * Extension deactivation
 */
export function deactivate() {
	console.log('[AFK] Deactivating AFK Coding Monitor...');
	
	if (monitor) {
		monitor.dispose();
		monitor = null;
	}
}

/**
 * Register extension commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
	const commands = [
		vscode.commands.registerCommand('afk-coding-monitor.start', async () => {
			if (!monitor) return;
			
			const config = Config.getInstance().getConfig();
			if (!config.enabled) {
				const enable = await vscode.window.showInformationMessage(
					'AFK Monitor is disabled. Enable it?',
					'Enable', 'Cancel'
				);
				if (enable === 'Enable') {
					await Config.getInstance().updateConfig('enabled', true);
				}
				return;
			}
			
			await monitor.startMonitoring();
		}),

		vscode.commands.registerCommand('afk-coding-monitor.stop', () => {
			if (monitor) {
				monitor.stopMonitoring();
			}
		}),

		vscode.commands.registerCommand('afk-coding-monitor.status', async () => {
			if (monitor) {
				await monitor.showStatus();
			}
		}),

		vscode.commands.registerCommand('afk-coding-monitor.configure', async () => {
			await Config.getInstance().showConfigMenu();
		})
	];

	commands.forEach(cmd => context.subscriptions.push(cmd));
	console.log('[AFK] Commands registered');
}
