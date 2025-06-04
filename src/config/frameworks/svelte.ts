import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const svelteRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.WEB_BASE,
    enableComponentVariants: true,
    enableInteractionStates: true
  },
  
  frameworkOptimizations: {
    svelte: {
      generateSvelteComponent: true,
      useTypeScript: true,
      useStores: false,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Svelte 5+ with runes",
          checks: ["$state runes", "Reactive declarations", "Component composition"]
        },
        typeScript: BASE_RULES.TYPESCRIPT,
        performance: {
          ...BASE_RULES.PERFORMANCE,
          rule: "Svelte compilation optimization",
          checks: ["Reactive updates", "Tree shaking", "Bundle optimization"]
        },
        stateManagement: {
          rule: "Svelte stores and context",
          description: "Writable stores and context API",
          priority: "medium" as const,
          checks: ["Writable stores", "Context API", "Reactive stores"]
        },
        accessibility: BASE_RULES.ACCESSIBILITY,
        testing: {
          ...BASE_RULES.TESTING,
          rule: "Svelte testing library",
          checks: ["Component testing", "Store testing", "User interactions"]
        }
      }
    }
  }
}; 