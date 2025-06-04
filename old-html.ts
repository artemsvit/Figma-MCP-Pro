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
        metadataFidelity: {
          rule: "Use exact metadata values",
          description: "Apply padding, margins, font-sizes, colors, and dimensions directly from Figma data without modification",
          priority: "critical",
          example: "padding: 16px; /* exact from Figma metadata */"
        },
        flexibleContainers: {
          rule: "Flexible containers",
          description: "Set child elements to width: 100% or flex: 1 instead of fixed widths; use max-width on containers",
          priority: "high",
          example: ".child { width: 100%; } .container { max-width: 1200px; }"
        },
        borderTechnique: {
          rule: "Box-shadow over border",
          description: "Use box-shadow: 0 0 0 1px color instead of border for pixel-perfect rendering",
          priority: "medium",
          example: "box-shadow: 0 0 0 1px #e5e7eb; /* instead of border: 1px solid #e5e7eb */"
        },
        marginConflicts: {
          rule: "Margin conflicts",
          description: "Remove conflicting margins when using flexbox/grid; let container handle spacing",
          priority: "high",
          example: ".flex-container > * { margin: 0; } .flex-container { gap: 16px; }"
        },
        typographyPrecision: {
          rule: "Typography precision",
          description: "Use exact font-size, line-height, and letter-spacing from metadata",
          priority: "critical",
          example: "font-size: 16px; line-height: 1.5; letter-spacing: -0.01em;"
        },
        colorAccuracy: {
          rule: "Color accuracy",
          description: "Apply exact hex/rgba values from design tokens",
          priority: "critical",
          example: "color: #1f2937; background: rgba(59, 130, 246, 0.1);"
        },
        responsiveDefault: {
          rule: "Responsive by default",
          description: "Implement mobile-first with proper breakpoints",
          priority: "high",
          example: "@media (min-width: 768px) { /* tablet+ styles */ }"
        },
        semanticHTML: {
          rule: "Semantic HTML",
          description: "Use proper semantic tags (<section>, <article>, <header>) combined with BEM class names for clear structure",
          priority: "high",
          example: "<section class='hero'><article class='hero__content'><header class='hero__header'></header></article></section>"
        },
        animationIntegration: {
          rule: "Animation integration",
          description: "Add hover effects and transitions as specified in design requirements",
          priority: "medium",
          example: "transition: all 0.2s ease; &:hover { transform: translateY(-2px); }"
        },
        noInlineStyles: {
          rule: "No inline CSS styles",
          description: "Use only external CSS files and class names; avoid inline style attributes for maintainability and separation of concerns",
          priority: "high",
          example: "<!-- Good: --> <div class='hero-section'> <!-- Bad: --> <div style='padding: 16px; color: #1f2937;'>"
        },
        bemMethodology: {
          rule: "BEM methodology",
          description: "Use BEM (Block Element Modifier) naming convention: block-name, block__element, block--modifier, block__element--modifier",
          priority: "high",
          example: `<!-- Block --> <article class='product-card'>
  <!-- Elements --> <h2 class='product-card__title'>Product Name</h2>
  <p class='product-card__description'>Description</p>
  <button class='product-card__button'>Add to Cart</button>
</article>
<!-- Block with Modifier --> <article class='product-card product-card--featured'>
  <!-- Element with Modifier --> <button class='product-card__button product-card__button--large'>Buy Now</button>
</article>`
        },
        noReadmeGeneration: {
          rule: "No README.md generation",
          description: "Do not generate README.md files for HTML/CSS/JS projects - focus on clean code structure and comments instead",
          priority: "medium",
          example: "<!-- Focus on clear HTML structure and CSS organization rather than documentation files -->"
        },
        validationChecklist: {
          rule: "Validation checklist",
          description: "Verify container containment, responsive behavior, and visual accuracy before completion",
          priority: "critical",
          checks: [
            "✓ All dimensions match Figma metadata exactly",
            "✓ Colors use exact hex/rgba values",
            "✓ Typography matches font-size, line-height, letter-spacing",
            "✓ Responsive behavior works on mobile, tablet, desktop",
            "✓ Container containment prevents overflow",
            "✓ Semantic HTML structure is meaningful",
            "✓ Accessibility attributes are present",
            "✓ Hover states and animations work as designed",
            "✓ No inline CSS styles used - all styles in external CSS files",
            "✓ BEM methodology applied for class naming (block__element--modifier)",
            "✓ No README.md file generated - focus on code quality and structure"
          ]
        }
      }
    }
  }
}; 