import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const swiftuiRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.MOBILE_BASE,
    enableCSSGeneration: false
  },
  
  frameworkOptimizations: {
    swiftui: {
      generateViews: true,
      useViewBuilder: true,
      generateModifiers: true,
      useObservableObject: true,
      useStateManagement: true,
      generatePreviewProvider: true,
      useEnvironmentObjects: false,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE,
      generateSFSymbols: true,
      useNativeColors: true,
      generateAdaptiveLayouts: true,
      useAsyncImage: true,
      generateNavigationViews: true,
      useToolbarModifiers: true,
      generateAnimations: true,
      useGeometryReader: false,
      generateDarkModeSupport: true,
      useTabViews: true,
      generateListViews: true,
      useScrollViews: true,
      generateFormViews: true,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "SwiftUI 5.0+ patterns",
          checks: ["@State/@Observable", "ViewBuilder", "Modifiers"]
        },
        stateManagement: {
          rule: "SwiftUI state management",
          description: "@State, @Binding, @Observable for state",
          priority: "critical" as const,
          checks: ["@State local", "@Binding shared", "@Observable data"]
        },
        layout: {
          rule: "Adaptive layout system",
          description: "HStack/VStack, LazyGrid, adaptive sizing",
          priority: "high" as const,
          checks: ["Flexible layouts", "Device adaptation", "Safe areas"]
        },
        navigation: {
          rule: "Modern navigation patterns",
          description: "NavigationStack, TabView, Sheet presentation",
          priority: "high" as const,
          checks: ["NavigationStack", "Programmatic navigation", "Modal presentation"]
        },
        accessibility: {
          ...BASE_RULES.ACCESSIBILITY,
          checks: ["VoiceOver support", "Dynamic Type", "Accessibility modifiers"]
        },
        performance: {
          ...BASE_RULES.PERFORMANCE,
          rule: "SwiftUI performance optimization",
          checks: ["LazyLoading", "Identity tracking", "View updates"]
        },
        testing: {
          ...BASE_RULES.TESTING,
          rule: "SwiftUI testing strategy",
          checks: ["Preview testing", "UI tests", "Unit tests"]
        }
      }
    }
  }
}; 