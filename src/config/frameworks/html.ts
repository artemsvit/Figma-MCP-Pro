import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS } from '../base.js';

// HTML-specific rule templates
const CRITICAL_ACCURACY = {
  priority: "critical" as const,
  rule: "Exact Figma fidelity"
};

const HIGH_MODERN = {
  priority: "high" as const,
  rule: "Modern CSS patterns"
};

const MEDIUM_ENHANCEMENT = {
  priority: "medium" as const,
  rule: "UI enhancements"
};

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
        // CRITICAL: Figma Fidelity
        metadataFidelity: {
          ...CRITICAL_ACCURACY,
          description: "Apply exact Figma values: padding, margins, fonts, colors, dimensions",
          checks: ["Exact padding", "Exact margins", "Exact font-sizes", "Exact colors", "Exact dimensions"]
        },
        typographyPrecision: {
          ...CRITICAL_ACCURACY,
          description: "Exact typography with CSS variables",
          checks: ["Exact font-size", "Exact line-height", "Exact letter-spacing", "CSS variables"]
        },
        colorAccuracy: {
          ...CRITICAL_ACCURACY,
          description: "Exact colors with CSS custom properties",
          checks: ["Exact hex/rgba", "CSS variables", "Consistent system"]
        },

        // CRITICAL: CSS Variables System
        cssVariables: {
          ...CRITICAL_ACCURACY,
          rule: "CSS custom properties system",
          description: "Systematic design tokens with semantic naming",
          checks: [
            "Color tokens: --color-primary, --text-primary, --bg-surface",
            "Typography: --font-size-*, --line-height-*", 
            "Spacing: --space-xs/sm/md/lg, --radius-sm/md/lg",
            "Effects: --shadow-sm/md/lg, semantic naming"
          ]
        },

        // HIGH: Layout & Structure  
        flexibleContainers: {
          ...HIGH_MODERN,
          description: "Flexible layouts: children 100% width, containers max-width",
          checks: ["Children 100% width", "Container max-width", "Flex: 1 patterns"]
        },
        semanticHTML: {
          ...HIGH_MODERN,
          description: "Semantic HTML5 + BEM methodology",
          checks: ["<section>/<article>/<header>", "BEM: block__element--modifier", "Accessibility"]
        },
        responsiveDefault: {
          ...HIGH_MODERN,
          description: "Mobile-first responsive with CSS variables",
          checks: ["Mobile-first", "Breakpoint variables", "Responsive tokens"]
        },
        modernCSS: {
          ...HIGH_MODERN,
          description: "CSS Grid, Flexbox, logical properties, container queries",
          checks: ["CSS Grid 2D", "Flexbox 1D", "Logical properties", "Container queries"]
        },
        marginConflicts: {
          ...HIGH_MODERN,
          description: "Clean spacing: zero margins on flex children, container gaps",
          checks: ["Zero flex margins", "Container gaps", "Clean spacing"]
        },
        noInlineStyles: {
          ...HIGH_MODERN,
          description: "External CSS only, class-based styling",
          checks: ["External CSS", "Class names", "No inline styles", "Maintainable"]
        },

        // MEDIUM: Enhancements
        borderTechnique: {
          ...MEDIUM_ENHANCEMENT,
          description: "box-shadow: 0 0 0 1px for pixel-perfect borders",
          checks: ["Box-shadow borders", "Consistent rendering", "Pixel-perfect"]
        },
        animationIntegration: {
          ...MEDIUM_ENHANCEMENT,
          description: "Hover effects and transitions with CSS variables",
          checks: ["CSS variable transitions", "Hover effects", "Consistent timing"]
        },

        // CRITICAL: Validation
        validationChecklist: {
          ...CRITICAL_ACCURACY,
          rule: "Quality assurance checklist",
          description: "Verify fidelity, responsiveness, and modern practices",
          checks: [
            "✓ Dimensions match Figma exactly",
            "✓ Colors use CSS variables with exact values", 
            "✓ Typography exact + CSS variables in :root",
            "✓ Responsive: mobile/tablet/desktop",
            "✓ Container containment, no overflow",
            "✓ Semantic HTML + accessibility",
            "✓ Hover/animations work + external CSS",
            "✓ BEM methodology + modern CSS features"
          ]
        }
      }
    }
  }
}; 