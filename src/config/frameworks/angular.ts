import type { ContextRules } from '../rules.js';

export const angularRules: Partial<ContextRules> = {
  aiOptimization: {
    enableCSSGeneration: true,
    enableSemanticAnalysis: true,
    enableAccessibilityInfo: true,
    enableResponsiveBreakpoints: true,
    enableDesignTokens: true,
    enableComponentVariants: true,
    enableInteractionStates: true,
    simplifyComplexPaths: true,
    optimizeForCodeGeneration: true
  },
  
  frameworkOptimizations: {
    react: {
      generateJSX: false,
      useStyledComponents: false,
      useTailwindCSS: false,
      generateHooks: false,
      generatePropTypes: false,
      useTypeScript: false,
      componentNamingConvention: 'PascalCase',
      generateStorybook: false
    },
    vue: {
      generateSFC: false,
      useCompositionAPI: false,
      useScoped: false,
      generateProps: false,
      useTypeScript: false,
      componentNamingConvention: 'PascalCase'
    },
    angular: {
      generateComponent: true,
      useStandalone: true,
      generateModule: false,
      useSignals: true,
      useTypeScript: true,
      componentNamingConvention: 'PascalCase'
    },
    svelte: {
      generateSvelteComponent: false,
      useTypeScript: false,
      useStores: false,
      componentNamingConvention: 'PascalCase'
    },
    html: {
      generateSemanticHTML: false,
      useCSS: false,
      useTailwindCSS: false,
      generateAccessibleMarkup: false,
      useModernCSS: false
    }
  }
}; 