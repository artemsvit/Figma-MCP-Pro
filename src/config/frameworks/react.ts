import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const reactRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.WEB_BASE,
    enableComponentVariants: true,
    enableInteractionStates: true
  },
  
  frameworkOptimizations: {
    react: {
      generateJSX: true,
      useStyledComponents: false,
      useTailwindCSS: true,
      generateHooks: true,
      generatePropTypes: false,
      useTypeScript: true,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE,
      generateStorybook: false,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Function components with hooks",
          checks: ["useState/useEffect", "Custom hooks", "No class components"]
        },
        typeScript: {
          ...BASE_RULES.TYPESCRIPT,
          checks: ["Interface props", "Typed state", "Event handlers typed"]
        },
        performance: {
          ...BASE_RULES.PERFORMANCE,
          rule: "React.memo + useCallback optimization",
          checks: ["React.memo wrapping", "useCallback functions", "useMemo calculations"]
        },
        stateManagement: {
          rule: "Context API for global state",
          description: "React Context + useReducer for complex state",
          priority: "medium" as const,
          checks: ["Context providers", "useReducer complex state", "Custom hooks"]
        },
        accessibility: {
          ...BASE_RULES.ACCESSIBILITY,
          checks: ["ARIA labels", "useId hook", "Keyboard support", "Screen readers"]
        },
        testing: {
          ...BASE_RULES.TESTING,
          rule: "React Testing Library approach",
          checks: ["User-focused tests", "Accessibility queries", "Async testing"]
        },
        react19: {
          rule: "React 19 features",
          description: "Server Components + useOptimistic",
          priority: "medium" as const,
          checks: ["Server Components", "use() hook", "useOptimistic UI"]
        }
      }
    },
    // Disable other frameworks
    vue: { generateSFC: false, useCompositionAPI: false, useScoped: false, generateProps: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    angular: { generateComponent: false, useStandalone: false, generateModule: false, useSignals: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    svelte: { generateSvelteComponent: false, useTypeScript: false, useStores: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    html: { generateSemanticHTML: true, useCSS: true, useTailwindCSS: true, generateAccessibleMarkup: true, useModernCSS: true },
    swiftui: { generateViews: true, useViewBuilder: true, generateModifiers: true, useObservableObject: true, useStateManagement: true, generatePreviewProvider: true, useEnvironmentObjects: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateSFSymbols: true, useNativeColors: true, generateAdaptiveLayouts: true, useAsyncImage: true, generateNavigationViews: true, useToolbarModifiers: true, generateAnimations: true, useGeometryReader: false, generateDarkModeSupport: true, useTabViews: true, generateListViews: true, useScrollViews: true, generateFormViews: true },
    uikit: { generateViewControllers: true, useStoryboards: false, useProgrammaticLayout: true, useAutoLayout: true, generateXIBFiles: false, useStackViews: true, generateConstraints: true, useSwiftUIInterop: true, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateDelegatePatterns: true, useModernConcurrency: true, generateAccessibilitySupport: true },
    electron: { generateMainProcess: true, generateRendererProcess: true, useIPC: true, useWebSecurity: true, generateMenus: true, useNativeDialogs: true, generateUpdater: true, useContextIsolation: true, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateNotifications: true, useCrashReporter: false, generateTrayIcon: false, useProtocolHandlers: false },
    tauri: { generateRustBackend: true, generateWebFrontend: true, useSystemWebView: true, generateCommands: true, useEventSystem: true, generatePlugins: false, useSidecar: false, componentNamingConvention: NAMING_CONVENTIONS.SNAKE_CASE, generateUpdater: true, useFilesystem: true, generateNotifications: true, useSystemTray: false, generateMenus: true },
    nwjs: { generateNodeBackend: true, generateWebFrontend: true, useChromiumAPI: true, generateMenus: true, useNativeModules: true, generateManifest: true, useClipboard: true, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateFileAccess: true, useShell: true, generateScreenCapture: false, useTrayIcon: false }
  }
}; 