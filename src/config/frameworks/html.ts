import type { ContextRules } from '../rules.js';

export const htmlRules: Partial<ContextRules> = {
  aiOptimization: {
    enableCSSGeneration: true,
    enableSemanticAnalysis: true,
    enableAccessibilityInfo: true,
    enableResponsiveBreakpoints: true,
    enableDesignTokens: true,
    enableComponentVariants: false,
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
      generateSemanticHTML: true,
      useCSS: true,
      useTailwindCSS: true,
      generateAccessibleMarkup: true,
      useModernCSS: true,
      implementationRules: {
        designTokensSystem: {
          rule: "Implement comprehensive design tokens system",
          description: "CSS custom properties for all design values with semantic naming",
          priority: "critical",
          example: `:root {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}

.button {
  background: var(--color-primary-500);
  color: var(--color-surface);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}`
        },

        modernCssArchitecture: {
          rule: "Use modern CSS architecture patterns",
          description: "CSS cascade layers, logical properties, and container queries",
          priority: "critical",
          example: `@layer reset, tokens, components, utilities;

@layer components {
  .card {
    container-type: inline-size;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    
    padding-block: var(--space-lg);
    padding-inline: var(--space-xl);
    margin-block-end: var(--space-lg);
  }
  
  .card__title {
    font-size: var(--text-lg);
    color: var(--color-text-primary);
    margin-block-end: var(--space-sm);
  }
  
  @container (min-width: 320px) {
    .card__content {
      display: flex;
      gap: var(--space-md);
    }
  }
  
  @container (min-width: 480px) {
    .card {
      padding-inline: var(--space-2xl);
    }
  }
}`
        },

        fluidDesignSystem: {
          rule: "Implement fluid and intrinsic design patterns",
          description: "clamp(), container-based sizing, and intrinsic web design",
          priority: "high", 
          example: `.container {
  width: min(100% - 2rem, 1200px);
  margin-inline: auto;
}

.hero__title {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
  line-height: 1.2;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}

.feature {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}`
        },

        advancedColorSystems: {
          rule: "Advanced color systems with dark mode support",
          description: "Color functions, design tokens, and automatic dark mode",
          priority: "high",
          example: `:root {
  color-scheme: light dark;
}

:root {
  --color-bg: oklch(98% 0.005 280);
  --color-text: oklch(20% 0.015 280);
  --color-primary: oklch(60% 0.15 220);
  --color-primary-hover: oklch(65% 0.15 220);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: oklch(15% 0.01 280);
    --color-text: oklch(85% 0.01 280);
    --color-primary: oklch(70% 0.15 220);
    --color-primary-hover: oklch(75% 0.15 220);
  }
}

.button {
  background: var(--color-primary);
  color: var(--color-bg);
  transition: background 0.2s ease;
}

.button:hover {
  background: var(--color-primary-hover);
}`
        },

        accessibilityFirst: {
          rule: "Accessibility-first development approach",
          description: "Screen readers, keyboard navigation, and user preferences",
          priority: "critical",
          example: `@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-contrast: high) {
  :root {
    --color-border: #000000;
    --color-text: #000000;
  }
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}

.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}`
        },

        performanceOptimization: {
          rule: "CSS performance optimization techniques",
          description: "CSS containment, will-change, and efficient selectors",
          priority: "high",
          example: `.card {
  contain: layout style paint;
}

.hero {
  contain: layout;
}

.button {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.button:hover {
  transform: translateY(-1px);
  will-change: transform;
}

.button:not(:hover) {
  will-change: auto;
}

.navigation__item {
  /* Avoid deep nesting and universal selectors */
}

@layer critical {
  .above-fold {
    /* Critical styles for above-the-fold content */
  }
}`
        },

        modernLayoutTechniques: {
          rule: "Modern layout with CSS Grid and Flexbox patterns",
          description: "CSS Grid for 2D layouts, Flexbox for 1D layouts",
          priority: "high",
          example: `.layout {
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
  gap: var(--space-lg);
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }

@media (max-width: 768px) {
  .layout {
    grid-template-areas:
      "header"
      "main"
      "footer";
    grid-template-columns: 1fr;
  }
}

.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.card {
  flex: 1 1 300px;
  min-width: 0;
}`
        },

        validationChecklist: {
          rule: "Modern CSS validation checklist",
          description: "Comprehensive validation for modern CSS implementation",
          priority: "critical",
          checks: [
            "Design tokens system with CSS custom properties",
            "CSS cascade layers for style organization",
            "Logical properties instead of physical",
            "Container queries for responsive components",
            "Fluid typography with clamp() functions",
            "Dark mode support with color schemes",
            "Accessibility preferences respected",
            "CSS containment for performance",
            "Modern color functions (oklch)",
            "Skip links and focus management",
            "Intrinsic web design patterns",
            "No hardcoded values - all design tokens"
          ]
        }
      }
    },
    swiftui: {
      generateViews: false,
      useViewBuilder: false,
      generateModifiers: false,
      useObservableObject: false,
      useStateManagement: false,
      generatePreviewProvider: false,
      useEnvironmentObjects: false,
      componentNamingConvention: 'PascalCase',
      generateSFSymbols: false,
      useNativeColors: false,
      generateAdaptiveLayouts: false,
      useAsyncImage: false,
      generateNavigationViews: false,
      useToolbarModifiers: false,
      generateAnimations: false,
      useGeometryReader: false,
      generateDarkModeSupport: false,
      useTabViews: false,
      generateListViews: false,
      useScrollViews: false,
      generateFormViews: false
    },
    uikit: {
      generateViewControllers: false,
      useStoryboards: false,
      useProgrammaticLayout: false,
      useAutoLayout: false,
      generateXIBFiles: false,
      useStackViews: false,
      generateConstraints: false,
      useSwiftUIInterop: false,
      componentNamingConvention: 'PascalCase',
      generateDelegatePatterns: false,
      useModernConcurrency: false,
      generateAccessibilitySupport: false
    },
    electron: {
      generateMainProcess: false,
      generateRendererProcess: false,
      useIPC: false,
      useWebSecurity: false,
      generateMenus: false,
      useNativeDialogs: false,
      generateUpdater: false,
      useContextIsolation: false,
      componentNamingConvention: 'camelCase',
      generateNotifications: false,
      useCrashReporter: false,
      generateTrayIcon: false,
      useProtocolHandlers: false
    },
    tauri: {
      generateRustBackend: false,
      generateWebFrontend: false,
      useSystemWebView: false,
      generateCommands: false,
      useEventSystem: false,
      generatePlugins: false,
      useSidecar: false,
      componentNamingConvention: 'snake_case',
      generateUpdater: false,
      useFilesystem: false,
      generateNotifications: false,
      useSystemTray: false,
      generateMenus: false
    },
    nwjs: {
      generateNodeBackend: false,
      generateWebFrontend: false,
      useChromiumAPI: false,
      generateMenus: false,
      useNativeModules: false,
      generateManifest: false,
      useClipboard: false,
      componentNamingConvention: 'camelCase',
      generateFileAccess: false,
      useShell: false,
      generateScreenCapture: false,
      useTrayIcon: false
    }
  }
}; 