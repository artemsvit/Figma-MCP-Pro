export interface BaseRule {
  rule: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  checks: string[];
}

export interface FrameworkConfig {
  name: string;
  type: 'web' | 'mobile' | 'desktop';
  language: 'typescript' | 'javascript' | 'swift' | 'rust' | 'mixed';
  features: string[];
  rules: Record<string, BaseRule>;
}

// Common optimization flags
export const COMMON_OPTIMIZATIONS = {
  WEB_BASE: {
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
  MOBILE_BASE: {
    enableCSSGeneration: false,
    enableSemanticAnalysis: true,
    enableAccessibilityInfo: true,
    enableResponsiveBreakpoints: true,
    enableDesignTokens: true,
    enableComponentVariants: true,
    enableInteractionStates: true,
    simplifyComplexPaths: true,
    optimizeForCodeGeneration: true,
    generateAdaptiveLayouts: true,
    generateDarkModeSupport: true
  },
  DESKTOP_BASE: {
    enableCSSGeneration: true,
    enableSemanticAnalysis: true,
    enableAccessibilityInfo: true,
    enableResponsiveBreakpoints: false,
    enableDesignTokens: true,
    enableComponentVariants: true,
    enableInteractionStates: true,
    simplifyComplexPaths: true,
    optimizeForCodeGeneration: true,
    generateMenus: true,
    generateNotifications: true
  }
};

// Common rule patterns
export const BASE_RULES = {
  MODERN_PATTERNS: {
    rule: "Use modern framework patterns",
    description: "Follow current best practices for the framework",
    priority: "critical" as const,
    checks: ["Modern syntax", "Best practices", "Performance optimized"]
  },
  TYPESCRIPT: {
    rule: "TypeScript-first development", 
    description: "Use TypeScript for type safety and better IDE support",
    priority: "critical" as const,
    checks: ["Proper typing", "Interface definitions", "Type safety"]
  },
  ACCESSIBILITY: {
    rule: "Accessibility-first approach",
    description: "Ensure components are accessible by default",
    priority: "high" as const,
    checks: ["ARIA labels", "Keyboard navigation", "Screen reader support"]
  },
  PERFORMANCE: {
    rule: "Optimize for performance",
    description: "Implement performance best practices",
    priority: "high" as const,
    checks: ["Optimized rendering", "Memory efficient", "Fast interactions"]
  },
  TESTING: {
    rule: "Comprehensive testing strategy",
    description: "Test components and functionality thoroughly",
    priority: "medium" as const,
    checks: ["Unit tests", "Integration tests", "User interaction tests"]
  }
};

export const NAMING_CONVENTIONS = {
  PASCAL_CASE: 'PascalCase' as const,
  CAMEL_CASE: 'camelCase' as const,
  KEBAB_CASE: 'kebab-case' as const,
  SNAKE_CASE: 'snake_case' as const
}; 