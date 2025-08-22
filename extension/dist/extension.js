"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode4 = __toESM(require("vscode"));

// src/monitor.ts
var vscode3 = __toESM(require("vscode"));

// src/tracker.ts
var vscode = __toESM(require("vscode"));
var path = __toESM(require("path"));
var Tracker = class {
  currentSession = null;
  disposables = [];
  isMonitoring = false;
  lastDocumentContent = "";
  onSessionComplete = new vscode.EventEmitter();
  onSessionCompleted = this.onSessionComplete.event;
  constructor() {
    this.setupEventListeners();
  }
  /**
   * Start monitoring
   */
  startMonitoring() {
    this.isMonitoring = true;
    console.log("[AFK] Started monitoring file sessions");
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.scheme === "file") {
      this.startSession(activeEditor.document);
    }
  }
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    this.endCurrentSession();
    console.log("[AFK] Stopped monitoring file sessions");
  }
  /**
   * Get current session info
   */
  getCurrentSession() {
    return this.currentSession;
  }
  /**
   * Dispose resources
   */
  dispose() {
    this.stopMonitoring();
    this.disposables.forEach((d) => d.dispose());
    this.onSessionComplete.dispose();
  }
  /**
   * Setup VSCode event listeners
   */
  setupEventListeners() {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!this.isMonitoring) return;
        this.endCurrentSession();
        if (editor && editor.document.uri.scheme === "file") {
          this.startSession(editor.document);
        }
      })
    );
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (!this.isMonitoring || !this.currentSession) return;
        if (event.document.uri.toString() === this.currentSession.filePath) {
          this.handleFileEdit(event);
        }
      })
    );
    this.disposables.push(
      vscode.window.onDidChangeWindowState((state) => {
        if (!this.isMonitoring) return;
        if (!state.focused) {
          this.endCurrentSession();
        } else {
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document.uri.scheme === "file" && !this.currentSession) {
            this.startSession(activeEditor.document);
          }
        }
      })
    );
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (!this.isMonitoring || !this.currentSession) return;
        if (document.uri.toString() === this.currentSession.filePath) {
          console.log(`[AFK] File saved: ${this.currentSession.fileName}`);
        }
      })
    );
  }
  /**
   * Start a new session for a file
   */
  startSession(document) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const projectPath = workspaceFolder?.uri.fsPath || "";
    const projectName = workspaceFolder ? path.basename(projectPath) : "Unknown";
    this.currentSession = {
      id: this.generateId(),
      filePath: document.uri.toString(),
      fileName: path.basename(document.uri.fsPath),
      fileExtension: path.extname(document.uri.fsPath).slice(1),
      language: document.languageId,
      projectName,
      projectPath,
      sessionStartTime: /* @__PURE__ */ new Date(),
      totalDuration: 0,
      linesAdded: 0,
      linesDeleted: 0,
      linesModified: 0,
      charactersAdded: 0,
      charactersDeleted: 0,
      charactersModified: 0,
      totalEdits: 0,
      isActive: true
    };
    this.lastDocumentContent = document.getText();
    console.log(`[AFK] Started session: ${this.currentSession.fileName}`);
  }
  /**
   * End current session and send to server
   */
  endCurrentSession() {
    if (!this.currentSession) return;
    const now = /* @__PURE__ */ new Date();
    this.currentSession.sessionEndTime = now;
    this.currentSession.totalDuration = Math.floor(
      (now.getTime() - this.currentSession.sessionStartTime.getTime()) / 1e3
    );
    this.currentSession.isActive = false;
    if (this.currentSession.totalDuration >= 5) {
      const sessionData = {
        session: this.currentSession,
        systemInfo: {
          editor: this.detectEditor(),
          platform: process.platform
        }
      };
      console.log(`[AFK] Session completed: ${this.currentSession.fileName} - Duration: ${this.currentSession.totalDuration}s, Edits: ${this.currentSession.totalEdits}, Lines: +${this.currentSession.linesAdded}/-${this.currentSession.linesDeleted}/~${this.currentSession.linesModified}, Chars: +${this.currentSession.charactersAdded}/-${this.currentSession.charactersDeleted}/~${this.currentSession.charactersModified}`);
      this.onSessionComplete.fire(sessionData);
    }
    this.currentSession = null;
    this.lastDocumentContent = "";
  }
  /**
   * Handle file edits and calculate statistics
   */
  handleFileEdit(event) {
    if (!this.currentSession) return;
    this.currentSession.totalEdits++;
    for (const change of event.contentChanges) {
      const deletedText = this.lastDocumentContent.substring(
        change.rangeOffset,
        change.rangeOffset + change.rangeLength
      );
      const insertedText = change.text;
      const deletedLines = deletedText.split("\n").length - 1;
      const insertedLines = insertedText.split("\n").length - 1;
      const deletedChars = deletedText.length;
      const insertedChars = insertedText.length;
      if (deletedChars === 0 && insertedChars > 0) {
        this.currentSession.linesAdded += insertedLines;
        this.currentSession.charactersAdded += insertedChars;
      } else if (insertedChars === 0 && deletedChars > 0) {
        this.currentSession.linesDeleted += deletedLines;
        this.currentSession.charactersDeleted += deletedChars;
      } else if (deletedChars > 0 && insertedChars > 0) {
        this.currentSession.linesModified += Math.max(deletedLines, insertedLines);
        this.currentSession.charactersModified += Math.max(deletedChars, insertedChars);
      }
    }
    this.lastDocumentContent = event.document.getText();
  }
  /**
   * Detect if running in VSCode or Cursor
   */
  detectEditor() {
    return vscode.env.appName.toLowerCase().includes("cursor") ? "cursor" : "vscode";
  }
  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

// src/api.ts
var ApiClient = class {
  baseUrl;
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }
  /**
   * Update server URL
   */
  updateUrl(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }
  /**
   * Send session data to server
   */
  async sendSession(sessionData) {
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      const response = await fetch(`${this.baseUrl}/api/sessions`, {
        method: "POST",
        headers,
        body: JSON.stringify(sessionData)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      console.log(`[AFK] Session sent successfully: ${sessionData.session.fileName}`);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`[AFK] Failed to send session: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  /**
   * Test server connection
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        return {
          success: false,
          message: `Server returned ${response.status}: ${response.statusText}`
        };
      }
      return {
        success: true,
        message: "Connected successfully"
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }
};

// src/config.ts
var vscode2 = __toESM(require("vscode"));
var Config = class _Config {
  static instance;
  configSection = "afk-coding-monitor";
  constructor() {
  }
  static getInstance() {
    if (!_Config.instance) {
      _Config.instance = new _Config();
    }
    return _Config.instance;
  }
  /**
   * Get current configuration
   */
  getConfig() {
    const config = vscode2.workspace.getConfiguration(this.configSection);
    return {
      enabled: config.get("enabled", true),
      serverUrl: config.get("serverUrl", "http://localhost:8000"),
      syncInterval: config.get("syncInterval", 10)
      // Send immediately after each session
    };
  }
  /**
   * Update configuration
   */
  async updateConfig(key, value) {
    const config = vscode2.workspace.getConfiguration(this.configSection);
    await config.update(key, value, vscode2.ConfigurationTarget.Global);
  }
  /**
   * Show simple configuration menu
   */
  async showConfigMenu() {
    const config = this.getConfig();
    const options = [
      {
        label: `$(${config.enabled ? "eye" : "eye-closed"}) Monitoring: ${config.enabled ? "Enabled" : "Disabled"}`,
        action: "toggle-enabled"
      },
      {
        label: `$(server) Server URL: ${config.serverUrl}`,
        action: "set-server-url"
      }
    ];
    const selected = await vscode2.window.showQuickPick(options, {
      placeHolder: "AFK Monitor Settings"
    });
    if (!selected) return;
    switch (selected.action) {
      case "toggle-enabled":
        await this.updateConfig("enabled", !config.enabled);
        vscode2.window.showInformationMessage(`AFK Monitor ${!config.enabled ? "enabled" : "disabled"}`);
        break;
      case "set-server-url":
        const newUrl = await vscode2.window.showInputBox({
          prompt: "Enter server URL",
          value: config.serverUrl,
          placeHolder: "http://localhost:8000"
        });
        if (newUrl) {
          await this.updateConfig("serverUrl", newUrl);
          vscode2.window.showInformationMessage("Server URL updated");
        }
        break;
    }
  }
  /**
   * Watch for config changes
   */
  onConfigChanged(callback) {
    return vscode2.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(this.configSection)) {
        callback(this.getConfig());
      }
    });
  }
};

// src/monitor.ts
var Monitor = class {
  tracker;
  apiClient;
  config;
  statusBar;
  disposables = [];
  pendingSessions = [];
  constructor(context) {
    this.config = Config.getInstance();
    const settings = this.config.getConfig();
    this.tracker = new Tracker();
    this.apiClient = new ApiClient(settings.serverUrl);
    this.statusBar = vscode3.window.createStatusBarItem(vscode3.StatusBarAlignment.Right, 100);
    this.statusBar.command = "afk-coding-monitor.status";
    this.statusBar.show();
    this.setupEventHandlers();
    this.updateStatusBar();
  }
  /**
   * Initialize and start monitoring if enabled
   */
  async initialize() {
    const settings = this.config.getConfig();
    if (settings.enabled) {
      await this.startMonitoring();
    } else {
      console.log("[AFK] Monitoring disabled in settings");
    }
  }
  /**
   * Start monitoring
   */
  async startMonitoring() {
    const settings = this.config.getConfig();
    const connectionTest = await this.apiClient.testConnection();
    if (!connectionTest.success) {
      vscode3.window.showErrorMessage(`AFK Monitor: Server connection failed - ${connectionTest.message}`);
      console.warn(`[AFK] Server connection failed: ${connectionTest.message}`);
      return;
    }
    this.tracker.startMonitoring();
    this.updateStatusBar();
    vscode3.window.showInformationMessage("AFK Monitor: Started tracking - your sessions will be saved to the server!");
  }
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.tracker.stopMonitoring();
    this.updateStatusBar();
    vscode3.window.showInformationMessage("AFK Monitor: Stopped tracking file sessions");
  }
  /**
   * Show status
   */
  async showStatus() {
    const currentSession = this.tracker.getCurrentSession();
    const settings = this.config.getConfig();
    let statusMessage = "**AFK Monitor Status**\n\n";
    statusMessage += `\u2022 Monitoring: ${currentSession ? "\u{1F7E2} Active" : "\u{1F534} Inactive"}
`;
    statusMessage += `\u2022 Server: ${settings.serverUrl}
`;
    statusMessage += `\u2022 Pending Sessions: ${this.pendingSessions.length}

`;
    if (currentSession) {
      const sessionTime = Math.floor((Date.now() - currentSession.sessionStartTime.getTime()) / 1e3);
      statusMessage += `**Current Session:**
`;
      statusMessage += `\u2022 File: ${currentSession.fileName}
`;
      statusMessage += `\u2022 Language: ${currentSession.language}
`;
      statusMessage += `\u2022 Project: ${currentSession.projectName}
`;
      statusMessage += `\u2022 Session Time: ${this.formatDuration(sessionTime)}
`;
      statusMessage += `\u2022 Total Edits: ${currentSession.totalEdits}
`;
      statusMessage += `\u2022 Lines: +${currentSession.linesAdded} -${currentSession.linesDeleted} ~${currentSession.linesModified}
`;
      statusMessage += `\u2022 Characters: +${currentSession.charactersAdded} -${currentSession.charactersDeleted} ~${currentSession.charactersModified}
`;
    }
    statusMessage += `
**Server Status:**
`;
    const connectionTest = await this.apiClient.testConnection();
    statusMessage += `\u2022 Connection: ${connectionTest.success ? "\u{1F7E2} Connected" : "\u{1F534} Disconnected"}
`;
    statusMessage += `\u2022 Message: ${connectionTest.message}`;
    vscode3.window.showInformationMessage(statusMessage, { modal: true });
  }
  /**
   * Show configuration
   */
  async showConfig() {
    await this.config.showConfigMenu();
  }
  /**
   * Dispose resources
   */
  dispose() {
    this.tracker.dispose();
    this.statusBar.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.disposables.push(
      this.tracker.onSessionCompleted((sessionData) => {
        this.handleSessionCompleted(sessionData);
      })
    );
    this.disposables.push(
      this.config.onConfigChanged((settings) => {
        this.apiClient.updateUrl(settings.serverUrl);
        if (settings.enabled && !this.tracker.getCurrentSession()) {
          this.startMonitoring();
        } else if (!settings.enabled && this.tracker.getCurrentSession()) {
          this.stopMonitoring();
        }
      })
    );
  }
  /**
   * Handle completed session
   */
  async handleSessionCompleted(sessionData) {
    this.pendingSessions.push(sessionData);
    this.updateStatusBar();
    const result = await this.apiClient.sendSession(sessionData);
    if (result.success) {
      const index = this.pendingSessions.indexOf(sessionData);
      if (index > -1) {
        this.pendingSessions.splice(index, 1);
      }
    } else {
      console.error(`[AFK] Failed to send session: ${result.error}`);
    }
    this.updateStatusBar();
  }
  /**
   * Update status bar
   */
  updateStatusBar() {
    const currentSession = this.tracker.getCurrentSession();
    const settings = this.config.getConfig();
    if (!settings.enabled) {
      this.statusBar.text = "$(eye-closed) AFK: Disabled";
      this.statusBar.tooltip = "AFK Monitor is disabled";
      return;
    }
    if (currentSession) {
      const sessionTime = Math.floor((Date.now() - currentSession.sessionStartTime.getTime()) / 1e3);
      this.statusBar.text = `$(eye) AFK: ${currentSession.fileName}`;
      this.statusBar.tooltip = `Tracking: ${currentSession.fileName}
Session Time: ${this.formatDuration(sessionTime)}
Edits: ${currentSession.totalEdits}
Lines: +${currentSession.linesAdded}/-${currentSession.linesDeleted}/~${currentSession.linesModified}
Characters: +${currentSession.charactersAdded}/-${currentSession.charactersDeleted}/~${currentSession.charactersModified}
Pending: ${this.pendingSessions.length} sessions`;
    } else {
      this.statusBar.text = "$(eye) AFK: Ready";
      this.statusBar.tooltip = `AFK Monitor is ready
Pending: ${this.pendingSessions.length} sessions
Click to view status`;
    }
  }
  /**
   * Format duration in human readable format
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
};

// src/extension.ts
var monitor = null;
async function activate(context) {
  try {
    console.log("[AFK] Activating AFK Coding Monitor...");
    monitor = new Monitor(context);
    registerCommands(context);
    await monitor.initialize();
    context.subscriptions.push(monitor);
    console.log("[AFK] AFK Coding Monitor activated successfully!");
  } catch (error) {
    console.error(`[AFK] Activation failed: ${error.message}`);
    vscode4.window.showErrorMessage(`AFK Monitor activation failed: ${error.message}`);
  }
}
function deactivate() {
  console.log("[AFK] Deactivating AFK Coding Monitor...");
  if (monitor) {
    monitor.dispose();
    monitor = null;
  }
}
function registerCommands(context) {
  const commands2 = [
    vscode4.commands.registerCommand("afk-coding-monitor.start", async () => {
      if (!monitor) return;
      const config = Config.getInstance().getConfig();
      if (!config.enabled) {
        const enable = await vscode4.window.showInformationMessage(
          "AFK Monitor is disabled. Enable it?",
          "Enable",
          "Cancel"
        );
        if (enable === "Enable") {
          await Config.getInstance().updateConfig("enabled", true);
        }
        return;
      }
      await monitor.startMonitoring();
    }),
    vscode4.commands.registerCommand("afk-coding-monitor.stop", () => {
      if (monitor) {
        monitor.stopMonitoring();
      }
    }),
    vscode4.commands.registerCommand("afk-coding-monitor.status", async () => {
      if (monitor) {
        await monitor.showStatus();
      }
    }),
    vscode4.commands.registerCommand("afk-coding-monitor.configure", async () => {
      await Config.getInstance().showConfigMenu();
    })
  ];
  commands2.forEach((cmd) => context.subscriptions.push(cmd));
  console.log("[AFK] Commands registered");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
