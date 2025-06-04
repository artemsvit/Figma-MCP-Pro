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
    }
  }
}; 