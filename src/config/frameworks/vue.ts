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
    }
  }
}; 