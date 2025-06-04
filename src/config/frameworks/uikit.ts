import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const uikitRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.MOBILE_BASE,
    enableCSSGeneration: false
  },
  
  frameworkOptimizations: {
    uikit: {
      generateViewControllers: true,
      useStoryboards: false,
      useProgrammaticLayout: true,
      useAutoLayout: true,
      generateXIBFiles: false,
      useStackViews: true,
      generateConstraints: true,
      useSwiftUIInterop: true,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE,
      generateDelegatePatterns: true,
      useModernConcurrency: true,
      generateAccessibilitySupport: true,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Modern UIKit with Swift concurrency",
          checks: ["async/await", "@MainActor", "Structured concurrency"]
        },
        programmaticLayout: {
          rule: "Programmatic Auto Layout",
          description: "NSLayoutConstraint and UIStackView patterns",
          priority: "critical" as const,
          checks: ["Auto Layout", "UIStackView", "Constraint activation"]
        },
        swiftuiInterop: {
          rule: "SwiftUI-UIKit integration",
          description: "UIHostingController and UIViewRepresentable",
          priority: "high" as const,
          checks: ["UIHostingController", "UIViewRepresentable", "Coordinator pattern"]
        },
        delegatePatterns: {
          rule: "Modern delegate patterns",
          description: "Protocol-oriented delegates with weak references",
          priority: "high" as const,
          checks: ["Weak delegates", "Protocol design", "Table view patterns"]
        },
        accessibility: {
          ...BASE_RULES.ACCESSIBILITY,
          checks: ["VoiceOver", "Dynamic Type", "Accessibility traits", "Custom actions"]
        },
        performance: {
          ...BASE_RULES.PERFORMANCE,
          rule: "UIKit performance optimization",
          checks: ["Table prefetching", "Image caching", "Memory management"]
        },
        testing: {
          ...BASE_RULES.TESTING,
          rule: "UIKit testing strategy",
          checks: ["XCTest", "UI testing", "Mock delegates"]
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
    electron: { generateMainProcess: false, generateRendererProcess: false, useIPC: false, useWebSecurity: false, generateMenus: false, useNativeDialogs: false, generateUpdater: false, useContextIsolation: false, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateNotifications: false, useCrashReporter: false, generateTrayIcon: false, useProtocolHandlers: false },
    tauri: { generateRustBackend: false, generateWebFrontend: false, useSystemWebView: false, generateCommands: false, useEventSystem: false, generatePlugins: false, useSidecar: false, componentNamingConvention: NAMING_CONVENTIONS.SNAKE_CASE, generateUpdater: false, useFilesystem: false, generateNotifications: false, useSystemTray: false, generateMenus: false },
    nwjs: { generateNodeBackend: false, generateWebFrontend: false, useChromiumAPI: false, generateMenus: false, useNativeModules: false, generateManifest: false, useClipboard: false, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateFileAccess: false, useShell: false, generateScreenCapture: false, useTrayIcon: false }
  }
}; 