import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const electronRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.DESKTOP_BASE,
    enableCSSGeneration: true,
    enableResponsiveBreakpoints: true
  },
  
  frameworkOptimizations: {
    electron: {
      generateMainProcess: true,
      generateRendererProcess: true,
      useIPC: true,
      useWebSecurity: true,
      generateMenus: true,
      useNativeDialogs: true,
      generateUpdater: true,
      useContextIsolation: true,
      componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE,
      generateNotifications: true,
      useCrashReporter: false,
      generateTrayIcon: false,
      useProtocolHandlers: false,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Main/Renderer process separation",
          checks: ["Context isolation", "Preload scripts", "Secure IPC"]
        },
        security: {
          rule: "Electron security best practices",
          description: "Context isolation, CSP, and secure defaults",
          priority: "critical" as const,
          checks: ["Context isolation", "Node integration disabled", "CSP headers"]
        },
        ipcCommunication: {
          rule: "Secure IPC patterns",
          description: "Type-safe IPC with proper validation",
          priority: "high" as const,
          checks: ["Typed IPC channels", "Input validation", "Error handling"]
        },
        nativeIntegration: {
          rule: "Native OS integration",
          description: "Menus, notifications, and system dialogs",
          priority: "medium" as const,
          checks: ["Application menus", "System notifications", "File dialogs"]
        },
        performance: {
          ...BASE_RULES.PERFORMANCE,
          checks: ["Memory management", "Process optimization", "Resource loading"]
        },
        testing: {
          ...BASE_RULES.TESTING,
          rule: "Electron testing strategy",
          checks: ["Spectron tests", "Unit tests", "Main process tests"]
        }
      }
    },
    // Disable other frameworks
    react: { generateJSX: false, useStyledComponents: false, useTailwindCSS: false, generateHooks: false, generatePropTypes: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateStorybook: false },
    vue: { generateSFC: false, useCompositionAPI: false, useScoped: false, generateProps: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    angular: { generateComponent: false, useStandalone: false, generateModule: false, useSignals: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    svelte: { generateSvelteComponent: false, useTypeScript: false, useStores: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    html: { generateSemanticHTML: true, useCSS: true, useTailwindCSS: true, generateAccessibleMarkup: true, useModernCSS: true },
    swiftui: { generateViews: true, useViewBuilder: true, generateModifiers: true, useObservableObject: true, useStateManagement: true, generatePreviewProvider: true, useEnvironmentObjects: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateSFSymbols: true, useNativeColors: true, generateAdaptiveLayouts: true, useAsyncImage: true, generateNavigationViews: true, useToolbarModifiers: true, generateAnimations: true, useGeometryReader: false, generateDarkModeSupport: true, useTabViews: true, generateListViews: true, useScrollViews: true, generateFormViews: true },
    uikit: { generateViewControllers: true, useStoryboards: false, useProgrammaticLayout: true, useAutoLayout: true, generateXIBFiles: false, useStackViews: true, generateConstraints: true, useSwiftUIInterop: true, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateDelegatePatterns: true, useModernConcurrency: true, generateAccessibilitySupport: true },
    tauri: { generateRustBackend: true, generateWebFrontend: true, useSystemWebView: true, generateCommands: true, useEventSystem: true, generatePlugins: false, useSidecar: false, componentNamingConvention: NAMING_CONVENTIONS.SNAKE_CASE, generateUpdater: true, useFilesystem: true, generateNotifications: true, useSystemTray: false, generateMenus: true },
    nwjs: { generateNodeBackend: true, generateWebFrontend: true, useChromiumAPI: true, generateMenus: true, useNativeModules: true, generateManifest: true, useClipboard: true, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateFileAccess: true, useShell: true, generateScreenCapture: false, useTrayIcon: false }
  }
}; 