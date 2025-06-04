import { FigmaNodeType } from '../types/figma.js';
import { COMMON_OPTIMIZATIONS, NAMING_CONVENTIONS, BaseRule } from './base.js';

// Base framework optimization interface
interface BaseFrameworkOptimization {
  useTypeScript?: boolean;
  componentNamingConvention?: string;
  implementationRules?: Record<string, BaseRule>;
}

// Framework-specific interfaces extending base
interface WebFrameworkOptimization extends BaseFrameworkOptimization {
  generateJSX?: boolean;
  useStyledComponents?: boolean;
  useTailwindCSS?: boolean;
  generateHooks?: boolean;
  generatePropTypes?: boolean;
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
}

interface MobileFrameworkOptimization extends BaseFrameworkOptimization {
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
}

interface DesktopFrameworkOptimization extends BaseFrameworkOptimization {
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
}

// Unified framework optimization type
export type FrameworkOptimization = WebFrameworkOptimization & MobileFrameworkOptimization & DesktopFrameworkOptimization;

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
  
  frameworkOptimizations: Partial<{
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
  }>;
  
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

// Base framework configurations
const WEB_FRAMEWORK_BASE: Partial<WebFrameworkOptimization> = {
  useTypeScript: true,
  componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE,
  useTailwindCSS: true
};

const MOBILE_FRAMEWORK_BASE: Partial<MobileFrameworkOptimization> = {
  useTypeScript: true,
  componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE,
  generateAccessibilitySupport: true
};

const DESKTOP_FRAMEWORK_BASE: Partial<DesktopFrameworkOptimization> = {
  generateMenus: true,
  generateNotifications: true
};

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
    react: { ...WEB_FRAMEWORK_BASE, generateJSX: true, generateHooks: true },
    vue: { ...WEB_FRAMEWORK_BASE, generateSFC: true, useCompositionAPI: true },
    angular: { ...WEB_FRAMEWORK_BASE, generateComponent: true, useStandalone: true, useSignals: true },
    svelte: { ...WEB_FRAMEWORK_BASE, generateSvelteComponent: true },
    html: { ...WEB_FRAMEWORK_BASE, generateSemanticHTML: true, useCSS: true, generateAccessibleMarkup: true, useModernCSS: true },
    swiftui: { ...MOBILE_FRAMEWORK_BASE, generateViews: true, useViewBuilder: true, generateModifiers: true, useStateManagement: true, generateAdaptiveLayouts: true, generateDarkModeSupport: true },
    uikit: { ...MOBILE_FRAMEWORK_BASE, generateViewControllers: true, useProgrammaticLayout: true, useAutoLayout: true },
    electron: { ...DESKTOP_FRAMEWORK_BASE, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateMainProcess: true, generateRendererProcess: true, useIPC: true, useContextIsolation: true },
    tauri: { ...DESKTOP_FRAMEWORK_BASE, componentNamingConvention: NAMING_CONVENTIONS.SNAKE_CASE, generateRustBackend: true, generateWebFrontend: true, useSystemWebView: true },
    nwjs: { ...DESKTOP_FRAMEWORK_BASE, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateNodeBackend: true, generateWebFrontend: true, useChromiumAPI: true }
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