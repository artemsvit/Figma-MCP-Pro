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
    }
  }
}; 