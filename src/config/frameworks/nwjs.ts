import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const nwjsRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.DESKTOP_BASE,
    enableCSSGeneration: true,
    enableResponsiveBreakpoints: false
  },
  
  frameworkOptimizations: {
    nwjs: {
      generateNodeBackend: true,
      generateWebFrontend: true,
      useChromiumAPI: true,
      generateMenus: true,
      useNativeModules: true,
      generateManifest: true,
      useClipboard: true,
      componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE,
      generateFileAccess: true,
      useShell: true,
      generateScreenCapture: false,
      useTrayIcon: false,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Unified Node.js and DOM context",
          checks: ["Node.js modules in browser", "Direct file system access", "Chromium APIs"]
        },
        manifestConfiguration: {
          rule: "Package.json manifest configuration",
          description: "App properties and window settings",
          priority: "critical" as const,
          checks: ["package.json setup", "Window configuration", "App permissions"]
        },
        nodeIntegration: {
          rule: "Node.js API integration",
          description: "Direct Node.js module access in web pages",
          priority: "high" as const,
          checks: ["require() in browser", "File system APIs", "OS modules"]
        },
        chromiumFeatures: {
          rule: "Chromium-specific features",
          description: "Native browser capabilities and DevTools",
          priority: "high" as const,
          checks: ["DevTools access", "Window management", "Native dialogs"]
        },
        nativeIntegration: {
          rule: "Native system integration",
          description: "Menus, clipboard, and shell access",
          priority: "medium" as const,
          checks: ["Native menus", "Clipboard API", "Shell commands"]
        },
        performance: {
          ...BASE_RULES.PERFORMANCE,
          rule: "NW.js performance optimization",
          checks: ["Package optimization", "Memory management", "Startup performance"]
        },
        testing: {
          ...BASE_RULES.TESTING,
          rule: "NW.js testing strategy",
          checks: ["Node.js testing", "Browser testing", "Integration tests"]
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
    tauri: { generateRustBackend: false, generateWebFrontend: false, useSystemWebView: false, generateCommands: false, useEventSystem: false, generatePlugins: false, useSidecar: false, componentNamingConvention: NAMING_CONVENTIONS.SNAKE_CASE, generateUpdater: false, useFilesystem: false, generateNotifications: false, useSystemTray: false, generateMenus: false }
  }
}; 