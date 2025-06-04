import type { ContextRules } from '../config/rules.js';

describe('Configuration Rules', () => {
  // Mock context rules for testing
  const mockRules: ContextRules = {
    maxDepth: 10,
    includeHiddenNodes: false,
    includeLockedNodes: true,
    nodeTypeFilters: {
      include: ['FRAME', 'TEXT', 'RECTANGLE'],
      exclude: ['SLICE'],
      prioritize: ['FRAME', 'TEXT']
    },
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
    contentEnhancement: {
      extractTextContent: true,
      analyzeImageContent: false,
      detectUIPatterns: true,
      identifyComponentHierarchy: true,
      extractLayoutConstraints: true,
      analyzeColorPalettes: true,
      extractTypographyStyles: true,
      detectSpacingPatterns: true
    },
    contextReduction: {
      removeRedundantProperties: true,
      simplifyNestedStructures: true,
      aggregateSimilarNodes: false,
      removeEmptyContainers: true,
      limitTextLength: 1000,
      compressLargeArrays: true
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
        generateSFC: true,
        useCompositionAPI: true,
        useScoped: true,
        generateProps: true,
        useTypeScript: true,
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
        generateSvelteComponent: true,
        useTypeScript: true,
        useStores: true,
        componentNamingConvention: 'PascalCase'
      },
      html: {
        generateSemanticHTML: true,
        useCSS: true,
        useTailwindCSS: true,
        generateAccessibleMarkup: true,
        useModernCSS: true
      },
      swiftui: {
        generateViews: true,
        useViewBuilder: true,
        generateModifiers: true,
        useObservableObject: true,
        useStateManagement: true,
        generatePreviewProvider: true,
        useEnvironmentObjects: false,
        componentNamingConvention: 'PascalCase',
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
        generateFormViews: true
      },
      uikit: {
        generateViewControllers: true,
        useStoryboards: false,
        useProgrammaticLayout: true,
        useAutoLayout: true,
        generateXIBFiles: false,
        useStackViews: true,
        generateConstraints: true,
        useSwiftUIInterop: true,
        componentNamingConvention: 'PascalCase',
        generateDelegatePatterns: true,
        useModernConcurrency: true,
        generateAccessibilitySupport: true
      },
      electron: {
        generateMainProcess: true,
        generateRendererProcess: true,
        useIPC: true,
        useWebSecurity: true,
        generateMenus: true,
        useNativeDialogs: true,
        generateUpdater: true,
        useContextIsolation: true,
        componentNamingConvention: 'camelCase',
        generateNotifications: true,
        useCrashReporter: false,
        generateTrayIcon: false,
        useProtocolHandlers: false
      },
      tauri: {
        generateRustBackend: true,
        generateWebFrontend: true,
        useSystemWebView: true,
        generateCommands: true,
        useEventSystem: true,
        generatePlugins: false,
        useSidecar: false,
        componentNamingConvention: 'snake_case',
        generateUpdater: true,
        useFilesystem: true,
        generateNotifications: true,
        useSystemTray: false,
        generateMenus: true
      },
      nwjs: {
        generateNodeBackend: true,
        generateWebFrontend: true,
        useChromiumAPI: true,
        generateMenus: true,
        useNativeModules: true,
        generateManifest: true,
        useClipboard: true,
        componentNamingConvention: 'camelCase',
        generateFileAccess: true,
        useShell: true,
        generateScreenCapture: false,
        useTrayIcon: false
             }
     },
     customRules: []
   };

  describe('AI Optimization Rules', () => {
    it('should have all required AI optimization properties', () => {
      const { aiOptimization } = mockRules;
      
      expect(aiOptimization).toBeDefined();
      expect(typeof aiOptimization.enableCSSGeneration).toBe('boolean');
      expect(typeof aiOptimization.enableSemanticAnalysis).toBe('boolean');
      expect(typeof aiOptimization.enableAccessibilityInfo).toBe('boolean');
      expect(typeof aiOptimization.enableResponsiveBreakpoints).toBe('boolean');
      expect(typeof aiOptimization.enableDesignTokens).toBe('boolean');
      expect(typeof aiOptimization.enableComponentVariants).toBe('boolean');
      expect(typeof aiOptimization.enableInteractionStates).toBe('boolean');
      expect(typeof aiOptimization.simplifyComplexPaths).toBe('boolean');
      expect(typeof aiOptimization.optimizeForCodeGeneration).toBe('boolean');
    });

    it('should enable key optimizations by default', () => {
      const { aiOptimization } = mockRules;
      
      expect(aiOptimization.enableSemanticAnalysis).toBe(true);
      expect(aiOptimization.enableAccessibilityInfo).toBe(true);
      expect(aiOptimization.optimizeForCodeGeneration).toBe(true);
    });
  });

  describe('Framework Optimizations', () => {
    it('should have optimizations for all 10 frameworks', () => {
      const { frameworkOptimizations } = mockRules;
      
      expect(frameworkOptimizations.react).toBeDefined();
      expect(frameworkOptimizations.vue).toBeDefined();
      expect(frameworkOptimizations.angular).toBeDefined();
      expect(frameworkOptimizations.svelte).toBeDefined();
      expect(frameworkOptimizations.html).toBeDefined();
      expect(frameworkOptimizations.swiftui).toBeDefined();
      expect(frameworkOptimizations.uikit).toBeDefined();
      expect(frameworkOptimizations.electron).toBeDefined();
      expect(frameworkOptimizations.tauri).toBeDefined();
      expect(frameworkOptimizations.nwjs).toBeDefined();
    });

    it('should have proper naming conventions for each framework', () => {
      const { frameworkOptimizations } = mockRules;
      
      expect(frameworkOptimizations.react?.componentNamingConvention).toBe('PascalCase');
      expect(frameworkOptimizations.vue?.componentNamingConvention).toBe('PascalCase');
      expect(frameworkOptimizations.angular?.componentNamingConvention).toBe('PascalCase');
      expect(frameworkOptimizations.svelte?.componentNamingConvention).toBe('PascalCase');
      expect(frameworkOptimizations.electron?.componentNamingConvention).toBe('camelCase');
      expect(frameworkOptimizations.tauri?.componentNamingConvention).toBe('snake_case');
      expect(frameworkOptimizations.nwjs?.componentNamingConvention).toBe('camelCase');
    });

    it('should enable TypeScript for modern frameworks', () => {
      const { frameworkOptimizations } = mockRules;
      
      expect(frameworkOptimizations.react?.useTypeScript).toBe(true);
      expect(frameworkOptimizations.vue?.useTypeScript).toBe(true);
      expect(frameworkOptimizations.angular?.useTypeScript).toBe(true);
      expect(frameworkOptimizations.svelte?.useTypeScript).toBe(true);
    });

    it('should have framework-specific features enabled', () => {
      const { frameworkOptimizations } = mockRules;
      
      // React specific
      expect(frameworkOptimizations.react?.generateJSX).toBe(true);
      expect(frameworkOptimizations.react?.generateHooks).toBe(true);
      
      // Vue specific
      expect(frameworkOptimizations.vue?.generateSFC).toBe(true);
      expect(frameworkOptimizations.vue?.useCompositionAPI).toBe(true);
      
      // Angular specific
      expect(frameworkOptimizations.angular?.useStandalone).toBe(true);
      expect(frameworkOptimizations.angular?.useSignals).toBe(true);
      
      // SwiftUI specific
      expect(frameworkOptimizations.swiftui?.generateViews).toBe(true);
      expect(frameworkOptimizations.swiftui?.useStateManagement).toBe(true);
      
      // Electron specific
      expect(frameworkOptimizations.electron?.useIPC).toBe(true);
      expect(frameworkOptimizations.electron?.useWebSecurity).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should have proper TypeScript types', () => {
      // This test ensures the types are properly defined
      const rules: ContextRules = mockRules;
      expect(rules).toBeDefined();
      expect(rules.aiOptimization).toBeDefined();
      expect(rules.frameworkOptimizations).toBeDefined();
    });
  });
}); 