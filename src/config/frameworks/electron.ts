import type { ContextRules } from '../rules.js';

export const electronRules: Partial<ContextRules> = {
  aiOptimization: {
    enableCSSGeneration: true, // Electron uses web technologies
    enableSemanticAnalysis: true,
    enableAccessibilityInfo: true,
    enableResponsiveBreakpoints: false, // Desktop apps usually have fixed windows
    enableDesignTokens: true,
    enableComponentVariants: true,
    enableInteractionStates: true,
    simplifyComplexPaths: true,
    optimizeForCodeGeneration: true
  },
  
  frameworkOptimizations: {
    react: {
      generateJSX: false,
      useStyledComponents: false,
      useTailwindCSS: false,
      generateHooks: false,
      generatePropTypes: false,
      useTypeScript: false,
      componentNamingConvention: 'PascalCase',
      generateStorybook: false
    },
    vue: {
      generateSFC: false,
      useCompositionAPI: false,
      useScoped: false,
      generateProps: false,
      useTypeScript: false,
      componentNamingConvention: 'PascalCase'
    },
    angular: {
      generateComponent: false,
      useStandalone: false,
      generateModule: false,
      useSignals: false,
      useTypeScript: false,
      componentNamingConvention: 'PascalCase'
    },
    svelte: {
      generateSvelteComponent: false,
      useTypeScript: false,
      useStores: false,
      componentNamingConvention: 'PascalCase'
    },
    html: {
      generateSemanticHTML: false,
      useCSS: false,
      useTailwindCSS: false,
      generateAccessibleMarkup: false,
      useModernCSS: false
    },
    swiftui: {
      generateViews: false,
      useViewBuilder: false,
      generateModifiers: false,
      useObservableObject: false,
      useStateManagement: false,
      generatePreviewProvider: false,
      useEnvironmentObjects: false,
      componentNamingConvention: 'PascalCase',
      generateSFSymbols: false,
      useNativeColors: false,
      generateAdaptiveLayouts: false,
      useAsyncImage: false,
      generateNavigationViews: false,
      useToolbarModifiers: false,
      generateAnimations: false,
      useGeometryReader: false,
      generateDarkModeSupport: false,
      useTabViews: false,
      generateListViews: false,
      useScrollViews: false,
      generateFormViews: false
    },
    uikit: {
      generateViewControllers: false,
      useStoryboards: false,
      useProgrammaticLayout: false,
      useAutoLayout: false,
      generateXIBFiles: false,
      useStackViews: false,
      generateConstraints: false,
      useSwiftUIInterop: false,
      componentNamingConvention: 'PascalCase',
      generateDelegatePatterns: false,
      useModernConcurrency: false,
      generateAccessibilitySupport: false
    },
    electron: {
      generateMainProcess: true,
      generateRendererProcess: true,
      useIPC: true,
      useWebSecurity: true,
      generateMenus: true,
      useNativeDialogs: true,
      generateUpdater: false, // Optional feature
      useContextIsolation: true,
      componentNamingConvention: 'PascalCase',
      generateNotifications: true,
      useCrashReporter: false, // Optional feature
      generateTrayIcon: false, // Optional feature
      useProtocolHandlers: false, // Optional feature
              implementationRules: {
          securityHardening: {
            rule: "Implement comprehensive security measures",
            description: "Enable context isolation, disable node integration, use sandboxing, and implement CSP for maximum security",
            priority: "critical",
            example: `// ✅ Good: Secure Electron configuration
// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Security best practices
      contextIsolation: true,          // Isolate contexts
      nodeIntegration: false,          // Disable node in renderer
      enableRemoteModule: false,       // Disable remote module
      sandbox: true,                   // Enable sandbox
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,               // Enable web security
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    show: false // Don't show until ready
  });

  // Load app with CSP
  mainWindow.loadFile('index.html');
  
  // Show when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links securely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// preload.js - Safe API exposure
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Secure IPC methods
  getData: () => ipcRenderer.invoke('get-data'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  showNotification: (message) => ipcRenderer.invoke('show-notification', message),
  
  // Event listeners with validation
  onWindowResize: (callback) => {
    ipcRenderer.on('window-resize', (event, ...args) => {
      callback(...args);
    });
  }
});

// index.html with CSP
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https:;
  ">
  <title>Secure Electron App</title>
</head>
<body>
  <div id="app"></div>
  <script src="renderer.js"></script>
</body>
</html>`,
            checks: [
              "✓ Context isolation enabled",
              "✓ Node integration disabled in renderer",
              "✓ Sandbox mode enabled",
              "✓ Content Security Policy implemented",
              "✓ External link handling secured",
              "✓ Preload script for safe API exposure"
            ]
          },

          modernIpcPatterns: {
            rule: "Use modern IPC patterns with type safety",
            description: "Implement type-safe IPC communication with proper error handling and validation",
            priority: "critical",
            example: `// ✅ Good: Modern IPC patterns
// types.ts - Shared types
interface IpcRequest<T = any> {
  id: string;
  type: string;
  payload: T;
}

interface IpcResponse<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

// main.js - IPC handlers
const { ipcMain } = require('electron');

// Type-safe IPC handler
class IpcHandler {
  constructor() {
    this.setupHandlers();
  }

  setupHandlers() {
    // User data operations
    ipcMain.handle('user:get', async (event, userId: string): Promise<UserData | null> => {
      try {
        const user = await this.getUserById(userId);
        return user;
      } catch (error) {
        console.error('Error fetching user:', error);
        throw new Error('Failed to fetch user data');
      }
    });

    ipcMain.handle('user:save', async (event, userData: UserData): Promise<boolean> => {
      try {
        // Validate user data
        if (!this.validateUserData(userData)) {
          throw new Error('Invalid user data');
        }
        
        await this.saveUser(userData);
        return true;
      } catch (error) {
        console.error('Error saving user:', error);
        throw new Error('Failed to save user data');
      }
    });

    // File operations with progress
    ipcMain.handle('file:process', async (event, filePath: string) => {
      try {
        const totalSteps = 100;
        
        for (let i = 0; i <= totalSteps; i++) {
          // Send progress updates
          event.sender.send('file:progress', {
            percent: (i / totalSteps) * 100,
            step: \`Processing step \${i}/\${totalSteps}\`
          });
          
          // Simulate processing
          await this.delay(50);
        }
        
        return { success: true, result: 'File processed successfully' };
      } catch (error) {
        throw new Error(\`Failed to process file: \${error.message}\`);
      }
    });
  }

  private validateUserData(userData: UserData): boolean {
    return userData.id && userData.name && userData.email.includes('@');
  }

  private async getUserById(id: string): Promise<UserData | null> {
    // Simulate database call
    return { id, name: 'John Doe', email: 'john@example.com' };
  }

  private async saveUser(userData: UserData): Promise<void> {
    // Simulate save operation
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

new IpcHandler();

// preload.js - Type-safe API
const { contextBridge, ipcRenderer } = require('electron');

interface ElectronAPI {
  user: {
    get(id: string): Promise<UserData | null>;
    save(userData: UserData): Promise<boolean>;
  };
  file: {
    process(filePath: string): Promise<any>;
    onProgress(callback: (progress: { percent: number; step: string }) => void): void;
  };
}

const electronAPI: ElectronAPI = {
  user: {
    get: (id: string) => ipcRenderer.invoke('user:get', id),
    save: (userData: UserData) => ipcRenderer.invoke('user:save', userData)
  },
  file: {
    process: (filePath: string) => ipcRenderer.invoke('file:process', filePath),
    onProgress: (callback) => {
      ipcRenderer.on('file:progress', (event, progress) => callback(progress));
    }
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// renderer.js - Usage
async function loadUser(userId: string) {
  try {
    const user = await window.electronAPI.user.get(userId);
    if (user) {
      displayUser(user);
    } else {
      showError('User not found');
    }
  } catch (error) {
    showError(\`Failed to load user: \${error.message}\`);
  }
}

async function processFile(filePath: string) {
  // Set up progress listener
  window.electronAPI.file.onProgress((progress) => {
    updateProgressBar(progress.percent);
    updateStatusText(progress.step);
  });

  try {
    const result = await window.electronAPI.file.process(filePath);
    showSuccess('File processed successfully');
  } catch (error) {
    showError(\`Processing failed: \${error.message}\`);
  }
}`,
            checks: [
              "✓ Type-safe IPC interfaces",
              "✓ Proper error handling and validation",
              "✓ Progress reporting for long operations",
              "✓ Namespace organization for API methods",
              "✓ Input validation in main process"
            ]
          },

          performanceOptimization: {
            rule: "Optimize application performance and resource usage",
            description: "Implement efficient memory management, lazy loading, and resource optimization strategies",
            priority: "high",
            example: `// ✅ Good: Performance optimization
// main.js - Optimized main process
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

class AppManager {
  constructor() {
    this.windows = new Map();
    this.isQuitting = false;
    
    this.setupAppEvents();
    this.optimizeMemory();
  }

  setupAppEvents() {
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupMenu();
      
      // Optimize for single instance
      if (!app.requestSingleInstanceLock()) {
        app.quit();
        return;
      }
      
      app.on('second-instance', () => {
        const mainWindow = this.windows.get('main');
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      });
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  createMainWindow() {
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.js'),
        // Performance optimizations
        enableRemoteModule: false,
        backgroundThrottling: false,  // Keep background tabs active
        offscreen: false,             // Disable offscreen rendering if not needed
      },
      show: false,
      // GPU acceleration
      webgl: true,
      experimentalCanvasFeatures: true
    });

    // Load with performance optimizations
    mainWindow.loadFile('index.html', {
      extraHeaders: 'Cache-Control: max-age=3600'
    });

    // Optimize window showing
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      
      // Focus optimizations
      if (process.platform === 'darwin') {
        app.dock.show();
      }
    });

    // Memory management
    mainWindow.on('closed', () => {
      this.windows.delete('main');
      if (global.gc) {
        global.gc(); // Force garbage collection if --expose-gc flag is set
      }
    });

    this.windows.set('main', mainWindow);
    return mainWindow;
  }

  optimizeMemory() {
    // Periodic memory cleanup
    setInterval(() => {
      if (global.gc && this.windows.size === 0) {
        global.gc();
      }
    }, 300000); // Every 5 minutes

    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
        console.warn('High memory usage detected:', memUsage);
        this.optimizeWindowResources();
      }
    }, 60000); // Every minute
  }

  optimizeWindowResources() {
    for (const window of this.windows.values()) {
      if (window && !window.isDestroyed()) {
        // Clear cache
        window.webContents.session.clearCache();
        
        // Minimize if not focused
        if (!window.isFocused()) {
          window.minimize();
        }
      }
    }
  }
}

new AppManager();

// renderer.js - Optimized renderer
class RendererOptimizer {
  constructor() {
    this.setupPerformanceMonitoring();
    this.optimizeImageLoading();
    this.setupVirtualScrolling();
  }

  setupPerformanceMonitoring() {
    // Monitor FPS
    let lastTime = performance.now();
    let frameCount = 0;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        if (fps < 30) {
          console.warn(\`Low FPS detected: \${fps}\`);
          this.reducePerfImpact();
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    measureFPS();
  }

  optimizeImageLoading() {
    // Intersection Observer for lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px'
    });

    // Observe all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  setupVirtualScrolling() {
    // Virtual scrolling for large lists
    class VirtualList {
      constructor(container, items, itemHeight = 50) {
        this.container = container;
        this.items = items;
        this.itemHeight = itemHeight;
        this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
        this.startIndex = 0;
        
        this.render();
        this.setupScrollListener();
      }

      render() {
        const visibleItems = this.items.slice(
          this.startIndex,
          this.startIndex + this.visibleCount
        );

        this.container.innerHTML = visibleItems.map((item, index) => 
          \`<div class="list-item" style="height: \${this.itemHeight}px;">
            \${this.renderItem(item, this.startIndex + index)}
          </div>\`
        ).join('');

        // Set container height
        this.container.style.height = \`\${this.items.length * this.itemHeight}px\`;
      }

      setupScrollListener() {
        let ticking = false;
        
        this.container.addEventListener('scroll', () => {
          if (!ticking) {
            requestAnimationFrame(() => {
              const newStartIndex = Math.floor(this.container.scrollTop / this.itemHeight);
              
              if (newStartIndex !== this.startIndex) {
                this.startIndex = newStartIndex;
                this.render();
              }
              
              ticking = false;
            });
            ticking = true;
          }
        });
      }

      renderItem(item, index) {
        return \`<span>Item \${index}: \${item.name}</span>\`;
      }
    }
  }

  reducePerfImpact() {
    // Reduce animations
    document.body.classList.add('reduce-motion');
    
    // Throttle expensive operations
    this.throttleResizeEvents();
    
    // Reduce image quality
    this.optimizeImageQuality();
  }

  throttleResizeEvents() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Handle resize
        this.handleResize();
      }, 250);
    });
  }

  optimizeImageQuality() {
    document.querySelectorAll('img').forEach(img => {
      if (img.style.filter !== 'blur(0.5px)') {
        img.style.filter = 'blur(0.5px)'; // Slight blur to reduce processing
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RendererOptimizer();
});`,
            checks: [
              "✓ Single instance application pattern",
              "✓ Memory usage monitoring and cleanup",
              "✓ FPS monitoring and performance adaptation",
              "✓ Lazy loading for images and content",
              "✓ Virtual scrolling for large datasets",
              "✓ Resource optimization based on performance metrics"
            ]
          },

          nativeIntegration: {
            rule: "Integrate with native operating system features",
            description: "Leverage native menus, notifications, system tray, and OS-specific features for authentic desktop experience",
            priority: "high",
            example: `// ✅ Good: Native OS integration
// main.js - Native features
const { app, BrowserWindow, Menu, Tray, nativeImage, Notification, shell, dialog } = require('electron');
const path = require('path');

class NativeIntegration {
  constructor() {
    this.tray = null;
    this.mainWindow = null;
    
    this.setupNativeMenu();
    this.setupNotifications();
    this.setupSystemTray();
    this.setupFileAssociations();
  }

  setupNativeMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.createNewDocument()
          },
          {
            label: 'Open...',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openFile'],
                filters: [
                  { name: 'Documents', extensions: ['txt', 'md', 'json'] },
                  { name: 'All Files', extensions: ['*'] }
                ]
              });
              
              if (!result.canceled) {
                this.openFile(result.filePaths[0]);
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Recent Files',
            submenu: this.getRecentFilesMenu()
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
          ...(process.platform === 'darwin' ? [
            { type: 'separator' },
            { role: 'front' }
          ] : [])
        ]
      }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services', submenu: [] },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupNotifications() {
    // Check notification permissions
    if (Notification.isSupported()) {
      // Send welcome notification
      const notification = new Notification({
        title: 'App Ready',
        body: 'Your application is ready to use!',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        silent: false,
        urgency: 'normal'
      });

      notification.on('click', () => {
        this.mainWindow?.show();
        this.mainWindow?.focus();
      });

      notification.show();
    }
  }

  setupSystemTray() {
    // Create tray icon
    const trayIcon = nativeImage.createFromPath(
      path.join(__dirname, 'assets', 'tray-icon.png')
    );
    
    this.tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
    
    // Tray context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          this.mainWindow?.show();
          this.mainWindow?.focus();
        }
      },
      {
        label: 'Quick Action',
        click: () => this.performQuickAction()
      },
      { type: 'separator' },
      {
        label: 'Preferences',
        click: () => this.openPreferences()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => app.quit()
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('My Electron App');

    // Tray click behavior
    this.tray.on('click', () => {
      if (this.mainWindow?.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow?.show();
        this.mainWindow?.focus();
      }
    });

    // Update tray based on app state
    this.updateTrayStatus('ready');
  }

  setupFileAssociations() {
    // Register protocol handler
    app.setAsDefaultProtocolClient('myapp');

    // Handle protocol URLs
    app.on('open-url', (event, url) => {
      event.preventDefault();
      this.handleProtocolUrl(url);
    });

    // Handle file opening (Windows/Linux)
    app.on('open-file', (event, filePath) => {
      event.preventDefault();
      this.openFile(filePath);
    });
  }

  updateTrayStatus(status) {
    if (!this.tray) return;

    const statusIcons = {
      ready: 'tray-icon.png',
      busy: 'tray-icon-busy.png',
      error: 'tray-icon-error.png'
    };

    const iconPath = path.join(__dirname, 'assets', statusIcons[status] || statusIcons.ready);
    const icon = nativeImage.createFromPath(iconPath);
    this.tray.setImage(icon.resize({ width: 16, height: 16 }));
  }

  createNewDocument() {
    this.mainWindow?.webContents.send('menu:new-document');
  }

  openFile(filePath) {
    this.mainWindow?.webContents.send('menu:open-file', filePath);
  }

  getRecentFilesMenu() {
    // Get recent files from storage
    const recentFiles = this.getRecentFiles();
    
    return recentFiles.map(file => ({
      label: path.basename(file),
      click: () => this.openFile(file)
    }));
  }

  performQuickAction() {
    // Send notification for quick action
    const notification = new Notification({
      title: 'Quick Action',
      body: 'Quick action performed from system tray',
      urgency: 'low'
    });
    notification.show();
  }

  openPreferences() {
    this.mainWindow?.webContents.send('menu:open-preferences');
  }

  handleProtocolUrl(url) {
    // Parse and handle custom protocol URLs
    console.log('Protocol URL received:', url);
    this.mainWindow?.webContents.send('protocol:handle', url);
  }

  getRecentFiles() {
    // Mock recent files - implement with actual storage
    return [
      '/Users/example/Documents/file1.txt',
      '/Users/example/Documents/file2.md'
    ];
  }
}

// Initialize native integration
app.whenReady().then(() => {
  new NativeIntegration();
});`,
            checks: [
              "✓ Native menu with platform-specific adjustments",
              "✓ System tray integration with context menu",
              "✓ Native notifications with proper permissions",
              "✓ File association and protocol handling",
              "✓ Keyboard shortcuts and accelerators",
              "✓ Platform-specific UI patterns (macOS/Windows/Linux)"
            ]
          },

          updateDeployment: {
            rule: "Implement robust update and deployment strategy",
            description: "Use electron-updater for auto-updates with proper signing and distribution",
            priority: "medium",
            example: `// ✅ Good: Update and deployment setup
// main.js - Auto updater integration
const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

class UpdateManager {
  constructor() {
    this.setupLogging();
    this.setupAutoUpdater();
  }

  setupLogging() {
    // Configure logging
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
  }

  setupAutoUpdater() {
    // Auto updater configuration
    autoUpdater.checkForUpdatesAndNotify();

    // Update events
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.sendStatusToWindow('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.sendStatusToWindow('Update available');
      this.showUpdateDialog(info);
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
      this.sendStatusToWindow('Update not available');
    });

    autoUpdater.on('error', (err) => {
      log.error('Update error:', err);
      this.sendStatusToWindow(\`Update error: \${err.message}\`);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      let logMessage = \`Download speed: \${progressObj.bytesPerSecond}\`;
      logMessage += \` - Downloaded \${progressObj.percent}%\`;
      logMessage += \` (\${progressObj.transferred}/\${progressObj.total})\`;
      
      log.info(logMessage);
      this.sendStatusToWindow(logMessage);
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.sendStatusToWindow('Update downloaded');
      this.showRestartDialog();
    });

    // Check for updates on app start
    app.on('ready', () => {
      // Check for updates after a delay to ensure app is fully loaded
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
      }, 5000);
    });

    // Periodic update checks (every 4 hours)
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 4 * 60 * 60 * 1000);
  }

  sendStatusToWindow(text) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('update-status', text);
    }
  }

  async showUpdateDialog(info) {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: \`Version \${info.version} is available\`,
      detail: info.releaseNotes || 'A new version is available. Would you like to download it now?',
      buttons: ['Download', 'Later'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  }

  async showRestartDialog() {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully',
      detail: 'The application will restart to apply the update.',
      buttons: ['Restart Now', 'Restart Later'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  }

  // Manual update check
  checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// package.json - Build configuration
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:mac": "electron-builder --mac",
    "build:win": "electron-builder --win",
    "build:linux": "electron-builder --linux",
    "publish": "electron-builder --publish=always"
  },
  "build": {
    "appId": "com.example.myapp",
    "productName": "My Electron App",
    "directories": {
      "output": "dist"
    },
    "files": [
      "**/*",
      "!node_modules/**/*",
      "!src/**/*",
      "!docs/**/*",
      "!*.md"
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "hardenedRuntime": true,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "notarize": {
        "teamId": "TEAM_ID"
      }
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "ia32"]
        }
      ],
      "certificateFile": "certificates/windows.p12",
      "certificatePassword": "password"
    },
    "linux": {
      "target": [
        "AppImage",
        "deb",
        "rpm"
      ],
      "category": "Office"
    },
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "your-repo"
    }
  }
}

// renderer.js - Update UI handling
class UpdateUI {
  constructor() {
    this.updateStatus = document.getElementById('update-status');
    this.updateButton = document.getElementById('check-updates');
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for update status from main process
    window.electronAPI.onUpdateStatus((status) => {
      this.updateStatus.textContent = status;
      
      if (status.includes('available') && !status.includes('not')) {
        this.showUpdateNotification();
      }
    });

    // Manual update check button
    this.updateButton?.addEventListener('click', () => {
      window.electronAPI.checkForUpdates();
    });
  }

  showUpdateNotification() {
    // Show in-app notification
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = \`
      <div class="notification-content">
        <h3>Update Available</h3>
        <p>A new version is available for download.</p>
        <button onclick="window.electronAPI.checkForUpdates()">Download</button>
        <button onclick="this.parentElement.parentElement.remove()">Dismiss</button>
      </div>
    \`;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new UpdateUI();
});

// build/entitlements.mac.plist - macOS entitlements
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.debugger</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.network.server</key>
  <true/>
</dict>
</plist>`,
            checks: [
              "✓ Automated update checking and downloading",
              "✓ User-friendly update dialogs",
              "✓ Progress reporting during downloads",
              "✓ Code signing for security",
              "✓ Multi-platform build configuration",
              "✓ Proper entitlements for macOS notarization"
            ]
          }
        }
    },
    tauri: {
      generateRustBackend: false,
      generateWebFrontend: false,
      useSystemWebView: false,
      generateCommands: false,
      useEventSystem: false,
      generatePlugins: false,
      useSidecar: false,
      componentNamingConvention: 'PascalCase',
      generateUpdater: false,
      useFilesystem: false,
      generateNotifications: false,
      useSystemTray: false,
      generateMenus: false
    },
    nwjs: {
      generateNodeBackend: false,
      generateWebFrontend: false,
      useChromiumAPI: false,
      generateMenus: false,
      useNativeModules: false,
      generateManifest: false,
      useClipboard: false,
      componentNamingConvention: 'PascalCase',
      generateFileAccess: false,
      useShell: false,
      generateScreenCapture: false,
      useTrayIcon: false
    }
  }
}; 