import { FigmaNodeType } from '../types/figma.js';
import { COMMON_OPTIMIZATIONS, NAMING_CONVENTIONS, BaseRule } from './base.js';

// Simplified framework interfaces
export interface FrameworkOptimization {
  generateJSX?: boolean;
  useStyledComponents?: boolean;
  useTailwindCSS?: boolean;
  generateHooks?: boolean;
  generatePropTypes?: boolean;
  useTypeScript?: boolean;
  componentNamingConvention?: string;
  generateStorybook?: boolean;
  generateSFC?: boolean;
  useCompositionAPI?: boolean;
  useScoped?: boolean;
  generateProps?: boolean;
  generateComponent?: boolean;
  useStandalone?: boolean;
  generateModule?: boolean;
  useSignals?: boolean;
  generateSvelteComponent?: boolean;
  useStores?: boolean;
  generateSemanticHTML?: boolean;
  useCSS?: boolean;
  generateAccessibleMarkup?: boolean;
  useModernCSS?: boolean;
  generateViews?: boolean;
  useViewBuilder?: boolean;
  generateModifiers?: boolean;
  useObservableObject?: boolean;
  useStateManagement?: boolean;
  generatePreviewProvider?: boolean;
  useEnvironmentObjects?: boolean;
  generateSFSymbols?: boolean;
  useNativeColors?: boolean;
  generateAdaptiveLayouts?: boolean;
  useAsyncImage?: boolean;
  generateNavigationViews?: boolean;
  useToolbarModifiers?: boolean;
  generateAnimations?: boolean;
  useGeometryReader?: boolean;
  generateDarkModeSupport?: boolean;
  useTabViews?: boolean;
  generateListViews?: boolean;
  useScrollViews?: boolean;
  generateFormViews?: boolean;
  generateViewControllers?: boolean;
  useStoryboards?: boolean;
  useProgrammaticLayout?: boolean;
  useAutoLayout?: boolean;
  generateXIBFiles?: boolean;
  useStackViews?: boolean;
  generateConstraints?: boolean;
  useSwiftUIInterop?: boolean;
  generateDelegatePatterns?: boolean;
  useModernConcurrency?: boolean;
  generateAccessibilitySupport?: boolean;
  generateMainProcess?: boolean;
  generateRendererProcess?: boolean;
  useIPC?: boolean;
  useWebSecurity?: boolean;
  generateMenus?: boolean;
  useNativeDialogs?: boolean;
  generateUpdater?: boolean;
  useContextIsolation?: boolean;
  generateNotifications?: boolean;
  useCrashReporter?: boolean;
  generateTrayIcon?: boolean;
  useProtocolHandlers?: boolean;
  generateRustBackend?: boolean;
  generateWebFrontend?: boolean;
  useSystemWebView?: boolean;
  generateCommands?: boolean;
  useEventSystem?: boolean;
  generatePlugins?: boolean;
  useSidecar?: boolean;
  useFilesystem?: boolean;
  useSystemTray?: boolean;
  generateNodeBackend?: boolean;
  useChromiumAPI?: boolean;
  useNativeModules?: boolean;
  generateManifest?: boolean;
  useClipboard?: boolean;
  generateFileAccess?: boolean;
  useShell?: boolean;
  generateScreenCapture?: boolean;
  useTrayIcon?: boolean;
  implementationRules?: Record<string, BaseRule>;
}

// Main context rules interface
export interface ContextRules {
  maxDepth: number;
  includeHiddenNodes: boolean;
  includeLockedNodes: boolean;
  
  nodeTypeFilters: {
    include: FigmaNodeType[];
    exclude: FigmaNodeType[];
    prioritize: FigmaNodeType[];
  };
  
  aiOptimization: {
    enableCSSGeneration: boolean;
    enableSemanticAnalysis: boolean;
    enableAccessibilityInfo: boolean;
    enableResponsiveBreakpoints: boolean;
    enableDesignTokens: boolean;
    enableComponentVariants: boolean;
    enableInteractionStates: boolean;
    simplifyComplexPaths: boolean;
    optimizeForCodeGeneration: boolean;
  };
  
  contentEnhancement: {
    extractTextContent: boolean;
    analyzeImageContent: boolean;
    detectUIPatterns: boolean;
    identifyComponentHierarchy: boolean;
    extractLayoutConstraints: boolean;
    analyzeColorPalettes: boolean;
    extractTypographyStyles: boolean;
    detectSpacingPatterns: boolean;
  };
  
  contextReduction: {
    removeRedundantProperties: boolean;
    simplifyNestedStructures: boolean;
    aggregateSimilarNodes: boolean;
    removeEmptyContainers: boolean;
    limitTextLength: number;
    compressLargeArrays: boolean;
  };
  
  frameworkOptimizations: {
    react: FrameworkOptimization;
    vue: FrameworkOptimization;
    angular: FrameworkOptimization;
    svelte: FrameworkOptimization;
    html: FrameworkOptimization;
    swiftui: FrameworkOptimization;
    uikit: FrameworkOptimization;
    electron: FrameworkOptimization;
    tauri: FrameworkOptimization;
    nwjs: FrameworkOptimization;
  };
  
  customRules: CustomRule[];
}

export interface CustomRule {
  name: string;
  description: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
  enabled: boolean;
}

export interface RuleCondition {
  nodeType?: FigmaNodeType | FigmaNodeType[];
  nodeName?: string | RegExp;
  hasChildren?: boolean;
  hasText?: boolean;
  hasImages?: boolean;
  isComponent?: boolean;
  isInstance?: boolean;
  hasAutoLayout?: boolean;
  customCondition?: (node: any) => boolean;
}

export interface RuleAction {
  type: 'enhance' | 'transform' | 'filter' | 'aggregate' | 'custom';
  parameters: Record<string, any>;
  customAction?: (node: any, context: any) => any;
}

// Default rules configuration using base optimizations
export const DEFAULT_RULES: ContextRules = {
  maxDepth: 10,
  includeHiddenNodes: false,
  includeLockedNodes: true,
  
  nodeTypeFilters: {
    include: [
      'DOCUMENT', 'CANVAS', 'FRAME', 'GROUP', 'TEXT', 'RECTANGLE', 'ELLIPSE', 
      'VECTOR', 'COMPONENT', 'INSTANCE', 'BOOLEAN_OPERATION', 'STAR', 'LINE', 'REGULAR_POLYGON'
    ],
    exclude: ['SLICE', 'STICKY'],
    prioritize: ['DOCUMENT', 'CANVAS', 'FRAME', 'COMPONENT', 'INSTANCE', 'TEXT']
  },
  
  aiOptimization: COMMON_OPTIMIZATIONS.WEB_BASE,
  
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
      useTypeScript: true,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE,
      useTailwindCSS: true,
      generateHooks: true
    },
    vue: {
      generateSFC: true,
      useCompositionAPI: true,
      useTypeScript: true,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE
    },
    angular: {
      generateComponent: true,
      useStandalone: true,
      useSignals: true,
      useTypeScript: true,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE
    },
    svelte: {
      generateSvelteComponent: true,
      useTypeScript: true,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE
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
      useStateManagement: true,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE,
      generateAdaptiveLayouts: true,
      generateDarkModeSupport: true
    },
    uikit: {
      generateViewControllers: true,
      useProgrammaticLayout: true,
      useAutoLayout: true,
      componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE,
      generateAccessibilitySupport: true
    },
    electron: {
      generateMainProcess: true,
      generateRendererProcess: true,
      useIPC: true,
      useContextIsolation: true,
      componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE
    },
    tauri: {
      generateRustBackend: true,
      generateWebFrontend: true,
      useSystemWebView: true,
      componentNamingConvention: NAMING_CONVENTIONS.SNAKE_CASE
    },
    nwjs: {
      generateNodeBackend: true,
      generateWebFrontend: true,
      useChromiumAPI: true,
      componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE
    }
  },
  
  customRules: []
};

// Utility functions
export const getEnvironmentRules = (): Partial<ContextRules> => {
  const isDev = process.env.NODE_ENV === 'development';
  return {
    maxDepth: isDev ? 15 : 10,
    aiOptimization: {
      ...COMMON_OPTIMIZATIONS.WEB_BASE,
      enableComponentVariants: isDev,
      enableInteractionStates: isDev
    }
  };
};

export const validateRules = (rules: ContextRules): string[] => {
  const errors: string[] = [];
  if (rules.maxDepth < 1 || rules.maxDepth > 20) {
    errors.push('maxDepth must be between 1 and 20');
  }
  if (rules.contextReduction.limitTextLength < 0) {
    errors.push('limitTextLength must be non-negative');
  }
  return errors;
};

export const mergeRules = (base: ContextRules, override: Partial<ContextRules>): ContextRules => {
  return {
    ...base,
    ...override,
    aiOptimization: { ...base.aiOptimization, ...override.aiOptimization },
    contentEnhancement: { ...base.contentEnhancement, ...override.contentEnhancement },
    contextReduction: { ...base.contextReduction, ...override.contextReduction },
    frameworkOptimizations: { ...base.frameworkOptimizations, ...override.frameworkOptimizations }
  };
}; 