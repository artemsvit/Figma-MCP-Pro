import type { ContextRules } from '../rules.js';

export const nwjsRules: Partial<ContextRules> = {
  aiOptimization: {
    enableCSSGeneration: true, // NW.js uses web technologies
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
      generateMainProcess: false,
      generateRendererProcess: false,
      useIPC: false,
      useWebSecurity: false,
      generateMenus: false,
      useNativeDialogs: false,
      generateUpdater: false,
      useContextIsolation: false,
      componentNamingConvention: 'PascalCase',
      generateNotifications: false,
      useCrashReporter: false,
      generateTrayIcon: false,
      useProtocolHandlers: false
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
      generateNodeBackend: true,
      generateWebFrontend: true,
      useChromiumAPI: true,
      generateMenus: true,
      useNativeModules: true,
      generateManifest: true,
      useClipboard: true,
      componentNamingConvention: 'PascalCase',
      generateFileAccess: true,
      useShell: true,
      generateScreenCapture: false, // Advanced feature
      useTrayIcon: false, // Optional feature
      implementationRules: {
        unifiedContext: {
          rule: "Unified Node.js and DOM context",
          description: "Leverage NW.js unique ability to access Node.js APIs directly from DOM",
          priority: "critical",
          example: "const fs = require('fs'); // directly in browser context"
        },
        manifestConfiguration: {
          rule: "Package.json manifest",
          description: "Configure app properties, permissions, and window settings in package.json",
          priority: "critical",
          example: "{ 'main': 'index.html', 'window': { 'width': 800, 'height': 600 } }"
        },
        nodeIntegration: {
          rule: "Node.js integration",
          description: "Use Node.js modules and APIs directly in web pages",
          priority: "high",
          example: "const path = require('path'); const os = require('os');"
        },
        chromiumFeatures: {
          rule: "Chromium features",
          description: "Access Chromium-specific APIs and features",
          priority: "high",
          example: "nw.Window.get().showDevTools(); // Chromium DevTools"
        },
        nativeMenus: {
          rule: "Native menus",
          description: "Create native application menus using NW.js Menu API",
          priority: "medium",
          example: "var menu = new nw.Menu({ type: 'menubar' });"
        },
        fileSystemAccess: {
          rule: "File system access",
          description: "Direct file system access without additional permissions",
          priority: "medium",
          example: "const data = fs.readFileSync('file.txt', 'utf8');"
        },
        windowManagement: {
          rule: "Window management",
          description: "Control window properties and lifecycle using NW.js Window API",
          priority: "medium",
          example: "nw.Window.get().maximize(); nw.Window.get().close();"
        },
        packageOptimization: {
          rule: "Package optimization",
          description: "Optimize app packaging and distribution",
          priority: "low",
          example: "Use nwjs-builder for creating distributable packages"
        }
      }
    }
  }
}; 