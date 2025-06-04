import { FigmaNodeType } from '../types/figma.js';

// Context Enhancement Rules Configuration
export interface ContextRules {
  // General settings
  maxDepth: number;
  includeHiddenNodes: boolean;
  includeLockedNodes: boolean;
  
  // Content filtering
  nodeTypeFilters: {
    include: FigmaNodeType[];
    exclude: FigmaNodeType[];
    prioritize: FigmaNodeType[];
  };
  
  // AI optimization settings
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
  
  // Content enhancement rules
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
  
  // Context reduction rules
  contextReduction: {
    removeRedundantProperties: boolean;
    simplifyNestedStructures: boolean;
    aggregateSimilarNodes: boolean;
    removeEmptyContainers: boolean;
    limitTextLength: number;
    compressLargeArrays: boolean;
  };
  
  // Framework-specific optimizations
  frameworkOptimizations: {
    react: ReactOptimizations;
    vue: VueOptimizations;
    angular: AngularOptimizations;
    svelte: SvelteOptimizations;
    html: HTMLOptimizations;
    swiftui: SwiftUIOptimizations;
    uikit: UIKitOptimizations;
    electron: ElectronOptimizations;
    tauri: TauriOptimizations;
    nwjs: NWJSOptimizations;
  };
  
  // Custom rules
  customRules: CustomRule[];
}

export interface ReactOptimizations {
  generateJSX: boolean;
  useStyledComponents: boolean;
  useTailwindCSS: boolean;
  generateHooks: boolean;
  generatePropTypes: boolean;
  useTypeScript: boolean;
  componentNamingConvention: 'PascalCase' | 'camelCase';
  generateStorybook: boolean;
  implementationRules?: {
    [key: string]: {
      rule: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      example?: string;
      checks?: string[];
    };
  };
}

export interface VueOptimizations {
  generateSFC: boolean;
  useCompositionAPI: boolean;
  useScoped: boolean;
  generateProps: boolean;
  useTypeScript: boolean;
  componentNamingConvention: 'PascalCase' | 'kebab-case';
  implementationRules?: {
    [key: string]: {
      rule: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      example?: string;
      checks?: string[];
    };
  };
}

export interface AngularOptimizations {
  generateComponent: boolean;
  useStandalone: boolean;
  generateModule: boolean;
  useSignals: boolean;
  useTypeScript: boolean;
  componentNamingConvention: 'PascalCase' | 'kebab-case';
  implementationRules?: {
    [key: string]: {
      rule: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      example?: string;
      checks?: string[];
    };
  };
}

export interface SvelteOptimizations {
  generateSvelteComponent: boolean;
  useTypeScript: boolean;
  useStores: boolean;
  componentNamingConvention: 'PascalCase' | 'kebab-case';
  implementationRules?: {
    [key: string]: {
      rule: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      example?: string;
      checks?: string[];
    };
  };
}

export interface HTMLOptimizations {
  generateSemanticHTML: boolean;
  useCSS: boolean;
  useTailwindCSS: boolean;
  generateAccessibleMarkup: boolean;
  useModernCSS: boolean;
  implementationRules?: {
    [key: string]: {
      rule: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      example?: string;
      checks?: string[];
    };
  };
}

export interface SwiftUIOptimizations {
  generateViews: boolean;
  useViewBuilder: boolean;
  generateModifiers: boolean;
  useObservableObject: boolean;
  useStateManagement: boolean;
  generatePreviewProvider: boolean;
  useEnvironmentObjects: boolean;
  componentNamingConvention: 'PascalCase' | 'camelCase';
  generateSFSymbols: boolean;
  useNativeColors: boolean;
  generateAdaptiveLayouts: boolean;
  useAsyncImage: boolean;
  generateNavigationViews: boolean;
  useToolbarModifiers: boolean;
  generateAnimations: boolean;
  useGeometryReader: boolean;
  generateDarkModeSupport: boolean;
  useTabViews: boolean;
  generateListViews: boolean;
  useScrollViews: boolean;
  generateFormViews: boolean;
  implementationRules?: {
    [key: string]: {
      rule: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      example?: string;
      checks?: string[];
    };
  };
}

export interface UIKitOptimizations {
  generateViewControllers: boolean;
  useStoryboards: boolean;
  useProgrammaticLayout: boolean;
  useAutoLayout: boolean;
  generateXIBFiles: boolean;
  useStackViews: boolean;
  generateConstraints: boolean;
  useSwiftUIInterop: boolean;
  componentNamingConvention: 'PascalCase' | 'camelCase';
  generateDelegatePatterns: boolean;
  useModernConcurrency: boolean;
  generateAccessibilitySupport: boolean;
  implementationRules?: {
    [key: string]: {
      rule: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      example?: string;
      checks?: string[];
    };
  };
}

export interface ElectronOptimizations {
  generateMainProcess: boolean;
  generateRendererProcess: boolean;
  useIPC: boolean;
  useWebSecurity: boolean;
  generateMenus: boolean;
  useNativeDialogs: boolean;
  generateUpdater: boolean;
  useContextIsolation: boolean;
  componentNamingConvention: 'PascalCase' | 'camelCase';
  generateNotifications: boolean;
  useCrashReporter: boolean;
  generateTrayIcon: boolean;
  useProtocolHandlers: boolean;
  implementationRules?: {
    [key: string]: {
      rule: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      example?: string;
      checks?: string[];
    };
  };
}

export interface TauriOptimizations {
  generateRustBackend: boolean;
  generateWebFrontend: boolean;
  useSystemWebView: boolean;
  generateCommands: boolean;
  useEventSystem: boolean;
  generatePlugins: boolean;
  useSidecar: boolean;
  componentNamingConvention: 'PascalCase' | 'camelCase' | 'snake_case';
  generateUpdater: boolean;
  useFilesystem: boolean;
  generateNotifications: boolean;
  useSystemTray: boolean;
  generateMenus: boolean;
  implementationRules?: {
    [key: string]: {
      rule: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      example?: string;
      checks?: string[];
    };
  };
}

export interface NWJSOptimizations {
  generateNodeBackend: boolean;
  generateWebFrontend: boolean;
  useChromiumAPI: boolean;
  generateMenus: boolean;
  useNativeModules: boolean;
  generateManifest: boolean;
  useClipboard: boolean;
  componentNamingConvention: 'PascalCase' | 'camelCase';
  generateFileAccess: boolean;
  useShell: boolean;
  generateScreenCapture: boolean;
  useTrayIcon: boolean;
  implementationRules?: {
    [key: string]: {
      rule: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      example?: string;
      checks?: string[];
    };
  };
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

// Default rules configuration
export const DEFAULT_RULES: ContextRules = {
  maxDepth: 10,
  includeHiddenNodes: false,
  includeLockedNodes: true,
  
  nodeTypeFilters: {
    include: [
      'DOCUMENT',
      'CANVAS',
      'FRAME',
      'GROUP',
      'TEXT',
      'RECTANGLE',
      'ELLIPSE',
      'VECTOR',
      'COMPONENT',
      'INSTANCE',
      'BOOLEAN_OPERATION',
      'STAR',
      'LINE',
      'REGULAR_POLYGON'
    ],
    exclude: [
      'SLICE',
      'STICKY'
    ],
    prioritize: [
      'DOCUMENT',
      'CANVAS', 
      'FRAME',
      'COMPONENT',
      'INSTANCE',
      'TEXT'
    ]
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
      useStores: false,
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
      generateUpdater: false,
      useContextIsolation: true,
      componentNamingConvention: 'PascalCase',
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
      componentNamingConvention: 'PascalCase',
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
      componentNamingConvention: 'PascalCase',
      generateFileAccess: true,
      useShell: true,
      generateScreenCapture: false,
      useTrayIcon: false
    }
  },
  
  customRules: [
    {
      name: 'Button Detection',
      description: 'Detect and enhance button-like components',
      condition: {
        nodeType: ['FRAME', 'COMPONENT', 'INSTANCE'],
        customCondition: (node) => {
          const name = node.name?.toLowerCase() || '';
          return name.includes('button') || name.includes('btn') || 
                 (node.children?.some((child: any) => child.type === 'TEXT') && 
                  node.fills?.length > 0);
        }
      },
      action: {
        type: 'enhance',
        parameters: {
          semanticRole: { type: 'button' },
          accessibilityInfo: { ariaRole: 'button', focusable: true },
          interactionStates: [
            { trigger: 'hover', changes: { opacity: '0.8' } },
            { trigger: 'active', changes: { transform: 'scale(0.95)' } }
          ]
        }
      },
      priority: 10,
      enabled: true
    },
    {
      name: 'Input Field Detection',
      description: 'Detect and enhance input field components',
      condition: {
        nodeType: ['FRAME', 'COMPONENT', 'INSTANCE'],
        customCondition: (node) => {
          const name = node.name?.toLowerCase() || '';
          return name.includes('input') || name.includes('field') || 
                 name.includes('textbox') || name.includes('search');
        }
      },
      action: {
        type: 'enhance',
        parameters: {
          semanticRole: { type: 'input' },
          accessibilityInfo: { ariaRole: 'textbox', focusable: true },
          interactionStates: [
            { trigger: 'focus', changes: { borderColor: '#007AFF', boxShadow: '0 0 0 2px rgba(0, 122, 255, 0.2)' } }
          ]
        }
      },
      priority: 9,
      enabled: true
    },
    {
      name: 'Navigation Detection',
      description: 'Detect and enhance navigation components',
      condition: {
        nodeType: ['FRAME', 'GROUP'],
        customCondition: (node) => {
          const name = node.name?.toLowerCase() || '';
          return name.includes('nav') || name.includes('menu') || 
                 name.includes('header') || name.includes('sidebar');
        }
      },
      action: {
        type: 'enhance',
        parameters: {
          semanticRole: { type: 'navigation' },
          accessibilityInfo: { ariaRole: 'navigation' },
          layoutContext: { purpose: 'navigation' }
        }
      },
      priority: 8,
      enabled: true
    },
    {
      name: 'Card Component Detection',
      description: 'Detect and enhance card-like components',
      condition: {
        nodeType: ['FRAME', 'COMPONENT', 'INSTANCE'],
        customCondition: (node) => {
          const name = node.name?.toLowerCase() || '';
          const hasBackground = node.fills?.length > 0;
          const hasRoundedCorners = node.cornerRadius && node.cornerRadius > 0;
          const hasShadow = node.effects?.some((effect: any) => effect.type === 'DROP_SHADOW');
          
          return name.includes('card') || 
                 (hasBackground && hasRoundedCorners && hasShadow);
        }
      },
      action: {
        type: 'enhance',
        parameters: {
          semanticRole: { type: 'article' },
          cssProperties: {
            display: 'block',
            borderRadius: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-sm)',
            backgroundColor: 'var(--color-surface)',
            padding: 'var(--spacing-md)'
          }
        }
      },
      priority: 7,
      enabled: true
    },
    {
      name: 'Icon Detection',
      description: 'Detect and enhance icon components',
      condition: {
        nodeType: ['VECTOR', 'GROUP', 'BOOLEAN_OPERATION'],
        customCondition: (node) => {
          const name = node.name?.toLowerCase() || '';
          const isSmall = node.absoluteBoundingBox && 
                         node.absoluteBoundingBox.width <= 32 && 
                         node.absoluteBoundingBox.height <= 32;
          
          return name.includes('icon') || name.includes('ico') || isSmall;
        }
      },
      action: {
        type: 'enhance',
        parameters: {
          semanticRole: { type: 'image' },
          accessibilityInfo: { ariaRole: 'img' },
          cssProperties: {
            display: 'inline-block',
            width: '1em',
            height: '1em',
            fill: 'currentColor'
          }
        }
      },
      priority: 6,
      enabled: true
    }
  ]
};

// Environment-based rule overrides
export const getEnvironmentRules = (): Partial<ContextRules> => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        maxDepth: 8,
        contextReduction: {
          removeRedundantProperties: true,
          simplifyNestedStructures: true,
          aggregateSimilarNodes: true,
          removeEmptyContainers: true,
          limitTextLength: 500,
          compressLargeArrays: true
        }
      };
    
    case 'development':
      return {
        maxDepth: 15,
        includeHiddenNodes: true,
        contextReduction: {
          removeRedundantProperties: false,
          simplifyNestedStructures: false,
          aggregateSimilarNodes: false,
          removeEmptyContainers: false,
          limitTextLength: 2000,
          compressLargeArrays: false
        }
      };
    
    default:
      return {};
  }
};

// Rule validation
export const validateRules = (rules: ContextRules): string[] => {
  const errors: string[] = [];
  
  if (rules.maxDepth < 1 || rules.maxDepth > 50) {
    errors.push('maxDepth must be between 1 and 50');
  }
  
  if (rules.contextReduction.limitTextLength < 0) {
    errors.push('limitTextLength must be non-negative');
  }
  
  // Validate custom rules
  rules.customRules.forEach((rule, index) => {
    if (!rule.name || rule.name.trim() === '') {
      errors.push(`Custom rule at index ${index} must have a name`);
    }
    
    if (rule.priority < 0 || rule.priority > 100) {
      errors.push(`Custom rule "${rule.name}" priority must be between 0 and 100`);
    }
  });
  
  return errors;
};

// Rule merging utility
export const mergeRules = (base: ContextRules, override: Partial<ContextRules>): ContextRules => {
  return {
    ...base,
    ...override,
    nodeTypeFilters: {
      ...base.nodeTypeFilters,
      ...override.nodeTypeFilters
    },
    aiOptimization: {
      ...base.aiOptimization,
      ...override.aiOptimization
    },
    contentEnhancement: {
      ...base.contentEnhancement,
      ...override.contentEnhancement
    },
    contextReduction: {
      ...base.contextReduction,
      ...override.contextReduction
    },
    frameworkOptimizations: {
      ...base.frameworkOptimizations,
      ...override.frameworkOptimizations
    },
    customRules: [
      ...base.customRules,
      ...(override.customRules || [])
    ]
  };
}; 