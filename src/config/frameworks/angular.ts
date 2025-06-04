import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const angularRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.WEB_BASE,
    enableComponentVariants: true,
    enableInteractionStates: true
  },
  
  frameworkOptimizations: {
    angular: {
      generateComponent: true,
      useStandalone: true,
      generateModule: false,
      useSignals: true,
      useTypeScript: true,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Standalone components with signals",
          checks: ["Standalone components", "Signals API", "Control flow syntax"]
        },
        typeScript: BASE_RULES.TYPESCRIPT,
        performance: {
          ...BASE_RULES.PERFORMANCE,
          rule: "OnPush strategy and signals",
          checks: ["OnPush change detection", "Signals", "TrackBy functions"]
        },
        stateManagement: {
          rule: "NgRx with signals",
          description: "NgRx store with signals integration",
          priority: "medium" as const,
          checks: ["NgRx store", "Effects", "Signal store"]
        },
        accessibility: BASE_RULES.ACCESSIBILITY,
        testing: {
          ...BASE_RULES.TESTING,
          rule: "Angular testing utilities",
          checks: ["TestBed setup", "Component testing", "Service testing"]
        }
      }
    }
  }
}; 