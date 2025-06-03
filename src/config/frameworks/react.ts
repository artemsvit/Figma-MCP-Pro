import type { ContextRules } from '../rules.js';

export const reactRules: Partial<ContextRules> = {
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
      generateJSX: true,
      useStyledComponents: false,
      useTailwindCSS: true,
      generateHooks: true,
      generatePropTypes: false,
      useTypeScript: true,
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
      generateComponent: false,
      useStandalone: false,
      generateModule: false,
      useSignals: false,
      useTypeScript: false,
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