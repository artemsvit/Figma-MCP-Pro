import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const vueRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.WEB_BASE,
    enableComponentVariants: true,
    enableInteractionStates: true
  },
  
  frameworkOptimizations: {
    vue: {
      generateSFC: true,
      useCompositionAPI: true,
      useScoped: true,
      generateProps: true,
      useTypeScript: true,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Composition API with script setup",
          checks: ["<script setup>", "Composables", "Reactive refs"]
        },
        typeScript: {
          ...BASE_RULES.TYPESCRIPT,
          checks: ["defineProps types", "defineEmits types", "Reactive types"]
        },
        performance: {
          ...BASE_RULES.PERFORMANCE,
          rule: "Reactivity optimization",
          checks: ["computed values", "watch effects", "shallowRef"]
        },
        stateManagement: {
          rule: "Pinia for state management",
          description: "Pinia stores with composition API",
          priority: "medium" as const,
          checks: ["Pinia stores", "Store composition", "Action methods"]
        },
        accessibility: BASE_RULES.ACCESSIBILITY,
        testing: {
          ...BASE_RULES.TESTING,
          rule: "Vue Test Utils approach",
          checks: ["Component mounting", "Props testing", "Event testing"]
        }
      }
    },
    // Disable other frameworks
    react: { generateJSX: false, useStyledComponents: false, useTailwindCSS: false, generateHooks: false, generatePropTypes: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateStorybook: false },
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