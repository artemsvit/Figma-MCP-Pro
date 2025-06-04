import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const tauriRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.DESKTOP_BASE,
    enableCSSGeneration: true,
    enableResponsiveBreakpoints: false
  },
  
  frameworkOptimizations: {
    tauri: {
      generateRustBackend: true,
      generateWebFrontend: true,
      useSystemWebView: true,
      generateCommands: true,
      useEventSystem: true,
      generatePlugins: false,
      useSidecar: false,
      componentNamingConvention: NAMING_CONVENTIONS.SNAKE_CASE,
      generateUpdater: true,
      useFilesystem: true,
      generateNotifications: true,
      useSystemTray: false,
      generateMenus: true,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Rust backend with web frontend",
          checks: ["Tauri commands", "System WebView", "Rust/JS interop"]
        },
        security: {
          rule: "WebView security configuration",
          description: "Secure WebView with CSP and allowlist",
          priority: "critical" as const,
          checks: ["Content Security Policy", "API allowlist", "Secure contexts"]
        },
        communication: {
          rule: "Frontend-backend communication",
          description: "Tauri invoke API and event system",
          priority: "high" as const,
          checks: ["Invoke API", "Event system", "Type-safe commands"]
        },
        nativeIntegration: {
          rule: "Native OS integration",
          description: "Tauri plugins for OS functionality",
          priority: "medium" as const,
          checks: ["Filesystem access", "Notifications", "System integration"]
        },
        performance: {
          ...BASE_RULES.PERFORMANCE,
          rule: "Bundle optimization",
          checks: ["System WebView", "Rust performance", "Small bundles"]
        },
        testing: {
          ...BASE_RULES.TESTING,
          rule: "Tauri testing strategy",
          checks: ["Rust unit tests", "WebView tests", "Integration tests"]
        }
      }
    },
    // Disable other frameworks
    react: { generateJSX: false, useStyledComponents: false, useTailwindCSS: false, generateHooks: false, generatePropTypes: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateStorybook: false },
    vue: { generateSFC: false, useCompositionAPI: false, useScoped: false, generateProps: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    angular: { generateComponent: false, useStandalone: false, generateModule: false, useSignals: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    svelte: { generateSvelteComponent: false, useTypeScript: false, useStores: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    html: { generateSemanticHTML: false, useCSS: false, useTailwindCSS: false, generateAccessibleMarkup: false, useModernCSS: false },
    swiftui: { generateViews: false, useViewBuilder: false, generateModifiers: false, useObservableObject: false, useStateManagement: false, generatePreviewProvider: false, useEnvironmentObjects: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateSFSymbols: false, useNativeColors: false, generateAdaptiveLayouts: false, useAsyncImage: false, generateNavigationViews: false, useToolbarModifiers: false, generateAnimations: false, useGeometryReader: false, generateDarkModeSupport: false, useTabViews: false, generateListViews: false, useScrollViews: false, generateFormViews: false },
    uikit: { generateViewControllers: false, useStoryboards: false, useProgrammaticLayout: false, useAutoLayout: false, generateXIBFiles: false, useStackViews: false, generateConstraints: false, useSwiftUIInterop: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateDelegatePatterns: false, useModernConcurrency: false, generateAccessibilitySupport: false },
    electron: { generateMainProcess: false, generateRendererProcess: false, useIPC: false, useWebSecurity: false, generateMenus: false, useNativeDialogs: false, generateUpdater: false, useContextIsolation: false, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateNotifications: false, useCrashReporter: false, generateTrayIcon: false, useProtocolHandlers: false },
    nwjs: { generateNodeBackend: false, generateWebFrontend: false, useChromiumAPI: false, generateMenus: false, useNativeModules: false, generateManifest: false, useClipboard: false, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateFileAccess: false, useShell: false, generateScreenCapture: false, useTrayIcon: false }
  }
}; 