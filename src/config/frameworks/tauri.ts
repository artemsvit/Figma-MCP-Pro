import type { ContextRules } from '../rules.js';

export const tauriRules: Partial<ContextRules> = {
  aiOptimization: {
    enableCSSGeneration: true, // Tauri uses web technologies for frontend
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
      generateRustBackend: true,
      generateWebFrontend: true,
      useSystemWebView: true,
      generateCommands: true,
      useEventSystem: true,
      generatePlugins: false, // Advanced feature
      useSidecar: false, // Advanced feature
      componentNamingConvention: 'PascalCase',
      generateUpdater: true,
      useFilesystem: true,
      generateNotifications: true,
      useSystemTray: false, // Optional feature
      generateMenus: true,
      implementationRules: {
        rustBackendStructure: {
          rule: "Rust backend commands",
          description: "Structure backend functionality as Tauri commands in Rust",
          priority: "critical",
          example: "#[tauri::command] fn get_data() -> String { /* Rust logic */ }"
        },
        webviewSecurity: {
          rule: "WebView security",
          description: "Configure secure WebView with proper CSP and allowlist",
          priority: "critical",
          example: "tauri.conf.json: { 'security': { 'csp': 'default-src 'self'' } }"
        },
        frontendBackendCommunication: {
          rule: "Frontend-backend communication",
          description: "Use Tauri's invoke API for frontend-backend communication",
          priority: "high",
          example: "await invoke('get_data') // from frontend to Rust backend"
        },
        eventSystem: {
          rule: "Event system",
          description: "Use Tauri's event system for real-time communication",
          priority: "high",
          example: "emit('data-updated', payload) // backend to frontend"
        },
        bundleOptimization: {
          rule: "Bundle optimization",
          description: "Optimize bundle size using system WebView instead of Chromium",
          priority: "medium",
          example: "Tauri uses system WebView, resulting in smaller bundles"
        },
        nativeIntegration: {
          rule: "Native OS integration",
          description: "Leverage Tauri plugins for native OS functionality",
          priority: "medium",
          example: "use tauri_plugin_filesystem for file operations"
        },
        configurationManagement: {
          rule: "Configuration management",
          description: "Use tauri.conf.json for comprehensive app configuration",
          priority: "medium",
          example: "Configure window properties, security, and features in tauri.conf.json"
        },
        autoUpdater: {
          rule: "Auto updater",
          description: "Implement Tauri's built-in updater for seamless updates",
          priority: "low",
          example: "await install() // update and restart app"
        }
      }
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