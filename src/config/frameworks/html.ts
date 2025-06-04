import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const htmlRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.WEB_BASE,
    enableComponentVariants: false,
    enableInteractionStates: true,
    enableDesignTokens: true
  },
  
  frameworkOptimizations: {
    html: {
      generateSemanticHTML: true,
      useCSS: true,
      useTailwindCSS: true,
      generateAccessibleMarkup: true,
      useModernCSS: true,
      implementationRules: {
        metadataFidelity: {
          rule: "Use exact metadata values",
          description: "Apply padding, margins, font-sizes, colors, and dimensions directly from Figma data without modification",
          priority: "critical" as const,
          checks: ["Exact padding values", "Exact margins", "Exact font-sizes", "Exact colors", "Exact dimensions"]
        },
        cssVariables: {
          rule: "CSS custom properties system",
          description: "Convert Figma design tokens to CSS variables with semantic naming and systematic organization",
          priority: "critical" as const,
          checks: [
            "CSS custom properties for colors: --color-primary, --color-secondary",
            "Typography variables: --font-size-base, --line-height-normal",
            "Spacing tokens: --space-xs, --space-sm, --space-md, --space-lg",
            "Border radius: --radius-sm, --radius-md, --radius-lg",
            "Shadow tokens: --shadow-sm, --shadow-md, --shadow-lg",
            "Semantic color naming: --text-primary, --bg-surface, --border-default"
          ]
        },
        flexibleContainers: {
          rule: "Flexible containers",
          description: "Set child elements to width: 100% or flex: 1 instead of fixed widths; use max-width on containers",
          priority: "high" as const,
          checks: ["Children use 100% width", "Containers use max-width", "Flexible layouts"]
        },
        borderTechnique: {
          rule: "Box-shadow over border",
          description: "Use box-shadow: 0 0 0 1px color instead of border for pixel-perfect rendering",
          priority: "medium" as const,
          checks: ["Box-shadow for 1px borders", "Consistent border rendering", "Pixel-perfect edges"]
        },
        marginConflicts: {
          rule: "Margin conflicts",
          description: "Remove conflicting margins when using flexbox/grid; let container handle spacing",
          priority: "high" as const,
          checks: ["Zero margins on flex children", "Container gap properties", "Clean spacing system"]
        },
        typographyPrecision: {
          rule: "Typography precision",
          description: "Use exact font-size, line-height, and letter-spacing from metadata with CSS variables",
          priority: "critical" as const,
          checks: ["Exact font-size values", "Exact line-height", "Exact letter-spacing", "CSS variable usage"]
        },
        colorAccuracy: {
          rule: "Color accuracy with variables",
          description: "Apply exact hex/rgba values from design tokens using CSS custom properties",
          priority: "critical" as const,
          checks: ["Exact color values", "CSS variable references", "Consistent color system"]
        },
        responsiveDefault: {
          rule: "Responsive by default",
          description: "Implement mobile-first with proper breakpoints using CSS variables for consistent sizing",
          priority: "high" as const,
          checks: ["Mobile-first approach", "Proper breakpoints", "Responsive variables"]
        },
        semanticHTML: {
          rule: "Semantic HTML",
          description: "Use proper semantic tags (<section>, <article>, <header>) combined with BEM class names",
          priority: "high" as const,
          checks: ["Semantic HTML5 tags", "BEM methodology", "Meaningful structure", "Accessibility"]
        },
        animationIntegration: {
          rule: "Animation integration",
          description: "Add hover effects and transitions using CSS variables for consistent timing and easing",
          priority: "medium" as const,
          checks: ["CSS variable transitions", "Hover effects", "Consistent timing", "Smooth animations"]
        },
        noInlineStyles: {
          rule: "No inline CSS styles",
          description: "Use only external CSS files and class names; avoid inline style attributes",
          priority: "high" as const,
          checks: ["External CSS only", "Class-based styling", "No inline styles", "Maintainable code"]
        },
        bemMethodology: {
          rule: "BEM methodology",
          description: "Use BEM (Block Element Modifier) naming: block-name, block__element, block--modifier",
          priority: "high" as const,
          checks: ["Block naming", "Element naming", "Modifier naming", "Consistent methodology"]
        },
        modernCSS: {
          rule: "Modern CSS features",
          description: "Use CSS Grid, Flexbox, custom properties, logical properties, and container queries",
          priority: "high" as const,
          checks: ["CSS Grid layouts", "Flexbox patterns", "Logical properties", "Container queries", "Modern selectors"]
        },
        darkModeSupport: {
          rule: "Dark mode with CSS variables",
          description: "Implement dark mode using CSS custom properties and prefers-color-scheme",
          priority: "medium" as const,
          checks: ["CSS variable theming", "prefers-color-scheme", "Consistent dark mode", "Theme switching"]
        },
        validationChecklist: {
          rule: "Validation checklist",
          description: "Verify container containment, responsive behavior, and visual accuracy before completion",
          priority: "critical" as const,
          checks: [
            "✓ All dimensions match Figma metadata exactly",
            "✓ Colors use CSS variables with exact hex/rgba values",
            "✓ Typography matches font-size, line-height, letter-spacing",
            "✓ CSS variables defined in :root for design tokens",
            "✓ Responsive behavior works on mobile, tablet, desktop",
            "✓ Container containment prevents overflow",
            "✓ Semantic HTML structure is meaningful",
            "✓ Accessibility attributes are present",
            "✓ Hover states and animations work as designed",
            "✓ No inline CSS styles used - all styles in external CSS files",
            "✓ BEM methodology applied for class naming",
            "✓ CSS variables used for colors, spacing, typography",
            "✓ Dark mode support implemented with CSS variables",
            "✓ Modern CSS features used appropriately"
          ]
        }
      }
    },
    // Disable other frameworks
    react: { generateJSX: false, useStyledComponents: false, useTailwindCSS: false, generateHooks: false, generatePropTypes: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateStorybook: false },
    vue: { generateSFC: false, useCompositionAPI: false, useScoped: false, generateProps: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    angular: { generateComponent: false, useStandalone: false, generateModule: false, useSignals: false, useTypeScript: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    svelte: { generateSvelteComponent: false, useTypeScript: false, useStores: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE },
    swiftui: { generateViews: false, useViewBuilder: false, generateModifiers: false, useObservableObject: false, useStateManagement: false, generatePreviewProvider: false, useEnvironmentObjects: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateSFSymbols: false, useNativeColors: false, generateAdaptiveLayouts: false, useAsyncImage: false, generateNavigationViews: false, useToolbarModifiers: false, generateAnimations: false, useGeometryReader: false, generateDarkModeSupport: false, useTabViews: false, generateListViews: false, useScrollViews: false, generateFormViews: false },
    uikit: { generateViewControllers: false, useStoryboards: false, useProgrammaticLayout: false, useAutoLayout: false, generateXIBFiles: false, useStackViews: false, generateConstraints: false, useSwiftUIInterop: false, componentNamingConvention: NAMING_CONVENTIONS.PASCAL_CASE, generateDelegatePatterns: false, useModernConcurrency: false, generateAccessibilitySupport: false },
    electron: { generateMainProcess: false, generateRendererProcess: false, useIPC: false, useWebSecurity: false, generateMenus: false, useNativeDialogs: false, generateUpdater: false, useContextIsolation: false, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateNotifications: false, useCrashReporter: false, generateTrayIcon: false, useProtocolHandlers: false },
    tauri: { generateRustBackend: false, generateWebFrontend: false, useSystemWebView: false, generateCommands: false, useEventSystem: false, generatePlugins: false, useSidecar: false, componentNamingConvention: NAMING_CONVENTIONS.SNAKE_CASE, generateUpdater: false, useFilesystem: false, generateNotifications: false, useSystemTray: false, generateMenus: false },
    nwjs: { generateNodeBackend: false, generateWebFrontend: false, useChromiumAPI: false, generateMenus: false, useNativeModules: false, generateManifest: false, useClipboard: false, componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE, generateFileAccess: false, useShell: false, generateScreenCapture: false, useTrayIcon: false }
  }
}; 