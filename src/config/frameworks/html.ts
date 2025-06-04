import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const htmlRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.WEB_BASE,
    enableComponentVariants: false,
    enableInteractionStates: true
  },
  
  frameworkOptimizations: {
    html: {
      generateSemanticHTML: true,
      useCSS: true,
      useTailwindCSS: true,
      generateAccessibleMarkup: true,
      useModernCSS: true,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Modern CSS architecture",
          checks: ["CSS layers", "Logical properties", "Container queries"]
        },
        designTokens: {
          rule: "CSS custom properties system",
          description: "Design tokens with CSS variables",
          priority: "critical" as const,
          checks: ["CSS custom properties", "Semantic naming", "Design tokens"]
        },
        fluidDesign: {
          rule: "Fluid and intrinsic design",
          description: "clamp(), container-based sizing",
          priority: "high" as const,
          checks: ["Fluid typography", "Intrinsic layouts", "Container queries"]
        },
        colorSystems: {
          rule: "Advanced color systems",
          description: "Dark mode and modern color functions",
          priority: "high" as const,
          checks: ["Dark mode support", "Color schemes", "Modern color functions"]
        },
        accessibility: {
          ...BASE_RULES.ACCESSIBILITY,
          checks: ["Screen readers", "Keyboard navigation", "User preferences", "Skip links"]
        },
        performance: {
          ...BASE_RULES.PERFORMANCE,
          rule: "CSS performance optimization",
          checks: ["CSS containment", "Efficient selectors", "Will-change property"]
        },
        modernLayout: {
          rule: "Modern layout techniques",
          description: "CSS Grid and Flexbox patterns",
          priority: "high" as const,
          checks: ["CSS Grid 2D layouts", "Flexbox 1D layouts", "Responsive patterns"]
        }
      }
    },
    // Disable other frameworks
    react: { generateJSX: false, useStyledComponents: false, useTailwindCSS: false, generateHooks: false, generatePropTypes: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateStorybook: false },
    vue: { generateSFC: false, useCompositionAPI: false, useScoped: false, generateProps: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    angular: { generateComponent: false, useStandalone: false, generateModule: false, useSignals: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    svelte: { generateSvelteComponent: false, useTypeScript: false, useStores: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    swiftui: { generateViews: false, useViewBuilder: false, generateModifiers: false, useObservableObject: false, useStateManagement: false, generatePreviewProvider: false, useEnvironmentObjects: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateSFSymbols: false, useNativeColors: false, generateAdaptiveLayouts: false, useAsyncImage: false, generateNavigationViews: false, useToolbarModifiers: false, generateAnimations: false, useGeometryReader: false, generateDarkModeSupport: false, useTabViews: false, generateListViews: false, useScrollViews: false, generateFormViews: false },
    uikit: { generateViewControllers: false, useStoryboards: false, useProgrammaticLayout: false, useAutoLayout: false, generateXIBFiles: false, useStackViews: false, generateConstraints: false, useSwiftUIInterop: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateDelegatePatterns: false, useModernConcurrency: false, generateAccessibilitySupport: false },
    electron: { generateMainProcess: false, generateRendererProcess: false, useIPC: false, useWebSecurity: false, generateMenus: false, useNativeDialogs: false, generateUpdater: false, useContextIsolation: false, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateNotifications: false, useCrashReporter: false, generateTrayIcon: false, useProtocolHandlers: false },
    tauri: { generateRustBackend: false, generateWebFrontend: false, useSystemWebView: false, generateCommands: false, useEventSystem: false, generatePlugins: false, useSidecar: false, componentNamingConvention: NAMING_CONVENTIONS.SNAKE_CASE, generateUpdater: false, useFilesystem: false, generateNotifications: false, useSystemTray: false, generateMenus: false },
    nwjs: { generateNodeBackend: false, generateWebFrontend: false, useChromiumAPI: false, generateMenus: false, useNativeModules: false, generateManifest: false, useClipboard: false, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateFileAccess: false, useShell: false, generateScreenCapture: false, useTrayIcon: false }
  }
}; 