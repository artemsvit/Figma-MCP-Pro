import {
  FigmaNode,
  EnhancedFigmaNode,
  CSSProperties,
  SemanticRole,
  AccessibilityInfo,
  DesignToken,
  ComponentVariant,
  InteractionState,
  LayoutContext,
  FigmaColor,
  FigmaTypeStyle
} from '../types/figma.js';
import {
  ContextRules,
  RuleCondition,
  RuleAction,
  DEFAULT_RULES,
  mergeRules,
  getEnvironmentRules
} from '../config/rules.js';

export interface ProcessingContext {
  fileKey: string;
  fileName?: string;
  parentNode?: EnhancedFigmaNode;
  depth: number;
  siblingIndex: number;
  totalSiblings: number;
  framework?: 'react' | 'vue' | 'angular' | 'svelte' | 'html' | undefined;
  designSystem?: DesignSystemContext;
}

export interface DesignSystemContext {
  colors: Map<string, string>;
  typography: Map<string, FigmaTypeStyle>;
  spacing: Map<string, number>;
  components: Map<string, ComponentVariant[]>;
  breakpoints: Map<string, number>;
}

export interface ProcessingStats {
  nodesProcessed: number;
  nodesEnhanced: number;
  rulesApplied: number;
  processingTime: number;
  errors: string[];
  warnings: string[];
}

export class ContextProcessor {
  private rules: ContextRules;
  private stats: ProcessingStats = {
    nodesProcessed: 0,
    nodesEnhanced: 0,
    rulesApplied: 0,
    processingTime: 0,
    errors: [],
    warnings: []
  };

  constructor(customRules?: Partial<ContextRules>) {
    const envRules = getEnvironmentRules();
    this.rules = mergeRules(DEFAULT_RULES, { ...envRules, ...customRules });
  }

  /**
   * Process a Figma node tree and enhance it with AI-optimized context
   */
  async processNode(
    node: FigmaNode,
    context: ProcessingContext
  ): Promise<EnhancedFigmaNode> {
    const startTime = Date.now();
    this.stats.nodesProcessed++;

    try {
      // Check depth limit
      if (context.depth > this.rules.maxDepth) {
        this.stats.warnings.push(`Max depth exceeded for node ${node.id}`);
        return this.createMinimalNode(node);
      }

      // Apply node type filters
      if (!this.shouldIncludeNode(node)) {
        return this.createMinimalNode(node);
      }

      // Create enhanced node
      const enhancedNode: EnhancedFigmaNode = {
        ...node,
        cssProperties: {},
        semanticRole: undefined,
        accessibilityInfo: {},
        designTokens: [],
        componentVariants: [],
        interactionStates: [],
        layoutContext: this.createLayoutContext(node, context)
      };

      // Apply AI optimizations
      if (this.rules.aiOptimization.enableCSSGeneration) {
        enhancedNode.cssProperties = this.generateCSSProperties(node, context);
      }

      if (this.rules.aiOptimization.enableSemanticAnalysis) {
        enhancedNode.semanticRole = this.analyzeSemanticRole(node, context);
      }

      if (this.rules.aiOptimization.enableAccessibilityInfo) {
        enhancedNode.accessibilityInfo = this.generateAccessibilityInfo(node, context);
      }

      if (this.rules.aiOptimization.enableDesignTokens) {
        enhancedNode.designTokens = this.extractDesignTokens(node, context);
      }

      if (this.rules.aiOptimization.enableComponentVariants) {
        enhancedNode.componentVariants = this.detectComponentVariants(node, context);
      }

      if (this.rules.aiOptimization.enableInteractionStates) {
        enhancedNode.interactionStates = this.generateInteractionStates(node, context);
      }

      // Apply custom rules
      await this.applyCustomRules(enhancedNode, context);

      // Process children recursively
      if (node.children && context.depth < this.rules.maxDepth) {
        enhancedNode.children = await Promise.all(
          node.children.map((child, index) =>
            this.processNode(child, {
              ...context,
              parentNode: enhancedNode,
              depth: context.depth + 1,
              siblingIndex: index,
              totalSiblings: node.children?.length || 0
            })
          )
        );
      }

      // Apply context reduction
      this.applyContextReduction(enhancedNode);

      this.stats.nodesEnhanced++;
      return enhancedNode;

    } catch (error) {
      this.stats.errors.push(`Error processing node ${node.id}: ${error}`);
      return this.createMinimalNode(node);
    } finally {
      this.stats.processingTime += Date.now() - startTime;
    }
  }

  private shouldIncludeNode(node: FigmaNode): boolean {
    // Check visibility
    if (!this.rules.includeHiddenNodes && node.visible === false) {
      return false;
    }

    // Check locked status
    if (!this.rules.includeLockedNodes && node.locked === true) {
      return false;
    }

    // Check node type filters
    const { include, exclude } = this.rules.nodeTypeFilters;
    
    if (exclude.includes(node.type)) {
      return false;
    }

    if (include.length > 0 && !include.includes(node.type)) {
      return false;
    }

    return true;
  }

  private createMinimalNode(node: FigmaNode): EnhancedFigmaNode {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible,
      locked: node.locked
    };
  }

  private createLayoutContext(node: FigmaNode, context: ProcessingContext): LayoutContext {
    const position = context.totalSiblings === 1 ? 'only' :
                    context.siblingIndex === 0 ? 'first' :
                    context.siblingIndex === context.totalSiblings - 1 ? 'last' : 'middle';

    return {
      parentType: context.parentNode?.type || 'DOCUMENT',
      siblingCount: context.totalSiblings,
      position,
      gridArea: this.detectGridArea(node, context),
      flexOrder: this.detectFlexOrder(node, context)
    };
  }

  private generateCSSProperties(node: FigmaNode, _context: ProcessingContext): CSSProperties {
    const css: CSSProperties = {};

    // Layout properties
    if (node.absoluteBoundingBox) {
      css.width = `${node.absoluteBoundingBox.width}px`;
      css.height = `${node.absoluteBoundingBox.height}px`;
    }

    // Auto layout properties
    if (node.layoutMode) {
      css.display = 'flex';
      css.flexDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
      
      if (node.primaryAxisAlignItems) {
        css.justifyContent = this.mapAxisAlign(node.primaryAxisAlignItems);
      }
      
      if (node.counterAxisAlignItems) {
        css.alignItems = this.mapAxisAlign(node.counterAxisAlignItems);
      }
      
      if (node.itemSpacing) {
        css.gap = `${node.itemSpacing}px`;
      }
    }

    // Padding
    if (node.paddingLeft || node.paddingRight || node.paddingTop || node.paddingBottom) {
      const top = node.paddingTop || 0;
      const right = node.paddingRight || 0;
      const bottom = node.paddingBottom || 0;
      const left = node.paddingLeft || 0;
      css.padding = `${top}px ${right}px ${bottom}px ${left}px`;
    }

    // Background
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill && fill.type === 'SOLID' && fill.color) {
        css.backgroundColor = this.colorToCSS(fill.color);
      }
    }

    // Border radius
    if (node.cornerRadius) {
      css.borderRadius = `${node.cornerRadius}px`;
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity < 1) {
      css.opacity = node.opacity.toString();
    }

    // Text properties
    if (node.type === 'TEXT' && node.style) {
      css.fontSize = `${node.style.fontSize}px`;
      css.fontFamily = node.style.fontFamily;
      css.lineHeight = `${node.style.lineHeightPx}px`;
      css.letterSpacing = `${node.style.letterSpacing}px`;
      
      if (node.style.fills && node.style.fills.length > 0) {
        const textFill = node.style.fills[0];
        if (textFill && textFill.type === 'SOLID' && textFill.color) {
          css.color = this.colorToCSS(textFill.color);
        }
      }
    }

    // Effects (shadows)
    if (node.effects && node.effects.length > 0) {
      const shadows = node.effects
        .filter(effect => effect.type === 'DROP_SHADOW' && effect.visible !== false)
        .map(effect => {
          const x = effect.offset?.x || 0;
          const y = effect.offset?.y || 0;
          const blur = effect.radius || 0;
          const spread = effect.spread || 0;
          const color = effect.color ? this.colorToCSS(effect.color) : 'rgba(0,0,0,0.25)';
          return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
        });
      
      if (shadows.length > 0) {
        css.boxShadow = shadows.join(', ');
      }
    }

    return css;
  }

  private analyzeSemanticRole(node: FigmaNode, _context: ProcessingContext): SemanticRole | undefined {
    const name = node.name.toLowerCase();
    
    // Button detection
    if (name.includes('button') || name.includes('btn')) {
      return { type: 'button', purpose: 'interactive' };
    }
    
    // Input detection
    if (name.includes('input') || name.includes('field') || name.includes('textbox')) {
      return { type: 'input', purpose: 'data-entry' };
    }
    
    // Navigation detection
    if (name.includes('nav') || name.includes('menu') || name.includes('header')) {
      return { type: 'navigation', purpose: 'navigation' };
    }
    
    // Text content
    if (node.type === 'TEXT') {
      const hierarchy = this.detectTextHierarchy(node);
      return { type: 'text', hierarchy };
    }
    
    // Container detection
    if (node.type === 'FRAME' && node.children && node.children.length > 0) {
      return { type: 'container', purpose: 'layout' };
    }
    
    return undefined;
  }

  private generateAccessibilityInfo(node: FigmaNode, context: ProcessingContext): AccessibilityInfo {
    const info: AccessibilityInfo = {};
    
    // Generate aria-label from node name
    if (node.name && !node.name.startsWith('Rectangle') && !node.name.startsWith('Ellipse')) {
      info.ariaLabel = node.name;
    }
    
    // Set focusable for interactive elements
    const semanticRole = this.analyzeSemanticRole(node, context);
    if (semanticRole?.type === 'button' || semanticRole?.type === 'input') {
      info.focusable = true;
      info.tabIndex = 0;
    }
    
    // Set appropriate ARIA roles
    switch (semanticRole?.type) {
      case 'button':
        info.ariaRole = 'button';
        break;
      case 'input':
        info.ariaRole = 'textbox';
        break;
      case 'navigation':
        info.ariaRole = 'navigation';
        break;
      case 'image':
        info.ariaRole = 'img';
        info.altText = node.name;
        break;
    }
    
    return info;
  }

  private extractDesignTokens(node: FigmaNode, _context: ProcessingContext): DesignToken[] {
    const tokens: DesignToken[] = [];
    
    // Color tokens
    if (node.fills && node.fills.length > 0) {
      node.fills.forEach((fill, index) => {
        if (fill.type === 'SOLID' && fill.color) {
          tokens.push({
            name: `${node.name}-fill-${index}`,
            value: this.colorToCSS(fill.color),
            type: 'color',
            category: 'background'
          });
        }
      });
    }
    
    // Typography tokens
    if (node.type === 'TEXT' && node.style) {
      tokens.push({
        name: `${node.name}-font-size`,
        value: `${node.style.fontSize}px`,
        type: 'typography',
        category: 'font-size'
      });
      
      tokens.push({
        name: `${node.name}-line-height`,
        value: `${node.style.lineHeightPx}px`,
        type: 'typography',
        category: 'line-height'
      });
    }
    
    // Spacing tokens
    if (node.paddingLeft || node.paddingRight || node.paddingTop || node.paddingBottom) {
      const padding = [
        node.paddingTop || 0,
        node.paddingRight || 0,
        node.paddingBottom || 0,
        node.paddingLeft || 0
      ];
      
      tokens.push({
        name: `${node.name}-padding`,
        value: padding.map(p => `${p}px`).join(' '),
        type: 'spacing',
        category: 'padding'
      });
    }
    
    return tokens;
  }

  private detectComponentVariants(node: FigmaNode, _context: ProcessingContext): ComponentVariant[] {
    const variants: ComponentVariant[] = [];
    
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      // Default variant
      variants.push({
        name: 'default',
        properties: {},
        state: 'default'
      });
      
      // Detect hover state based on naming
      if (node.name.toLowerCase().includes('hover')) {
        variants.push({
          name: 'hover',
          properties: { state: 'hover' },
          state: 'hover'
        });
      }
      
      // Detect disabled state
      if (node.name.toLowerCase().includes('disabled')) {
        variants.push({
          name: 'disabled',
          properties: { state: 'disabled' },
          state: 'disabled'
        });
      }
    }
    
    return variants;
  }

  private generateInteractionStates(node: FigmaNode, context: ProcessingContext): InteractionState[] {
    const states: InteractionState[] = [];
    
    const semanticRole = this.analyzeSemanticRole(node, context);
    
    if (semanticRole?.type === 'button') {
      states.push({
        trigger: 'hover',
        changes: { opacity: '0.8' },
        animation: { duration: '0.2s', easing: 'ease-in-out' }
      });
      
      states.push({
        trigger: 'click',
        changes: { transform: 'scale(0.95)' },
        animation: { duration: '0.1s', easing: 'ease-in-out' }
      });
    }
    
    if (semanticRole?.type === 'input') {
      states.push({
        trigger: 'focus',
        changes: {
          borderColor: '#007AFF',
          boxShadow: '0 0 0 2px rgba(0, 122, 255, 0.2)'
        },
        animation: { duration: '0.2s', easing: 'ease-in-out' }
      });
    }
    
    return states;
  }

  private async applyCustomRules(node: EnhancedFigmaNode, context: ProcessingContext): Promise<void> {
    const applicableRules = this.rules.customRules
      .filter(rule => rule.enabled)
      .filter(rule => this.evaluateRuleCondition(rule.condition, node, context))
      .sort((a, b) => b.priority - a.priority);

    for (const rule of applicableRules) {
      try {
        await this.applyRuleAction(rule.action, node, context);
        this.stats.rulesApplied++;
      } catch (error) {
        this.stats.errors.push(`Error applying rule "${rule.name}": ${error}`);
      }
    }
  }

  private evaluateRuleCondition(condition: RuleCondition, node: EnhancedFigmaNode, _context: ProcessingContext): boolean {
    // Check node type
    if (condition.nodeType) {
      const types = Array.isArray(condition.nodeType) ? condition.nodeType : [condition.nodeType];
      if (!types.includes(node.type)) {
        return false;
      }
    }
    
    // Check node name
    if (condition.nodeName) {
      if (condition.nodeName instanceof RegExp) {
        if (!condition.nodeName.test(node.name)) {
          return false;
        }
      } else {
        if (!node.name.toLowerCase().includes(condition.nodeName.toLowerCase())) {
          return false;
        }
      }
    }
    
    // Check has children
    if (condition.hasChildren !== undefined) {
      const hasChildren = node.children && node.children.length > 0;
      if (condition.hasChildren !== hasChildren) {
        return false;
      }
    }
    
    // Check has text
    if (condition.hasText !== undefined) {
      const hasText = node.type === 'TEXT' || 
                    (node.children && node.children.some(child => child.type === 'TEXT'));
      if (condition.hasText !== hasText) {
        return false;
      }
    }
    
    // Check is component
    if (condition.isComponent !== undefined) {
      const isComponent = node.type === 'COMPONENT' || node.type === 'INSTANCE';
      if (condition.isComponent !== isComponent) {
        return false;
      }
    }
    
    // Check has auto layout
    if (condition.hasAutoLayout !== undefined) {
      const hasAutoLayout = node.layoutMode !== undefined && node.layoutMode !== 'NONE';
      if (condition.hasAutoLayout !== hasAutoLayout) {
        return false;
      }
    }
    
    // Custom condition
    if (condition.customCondition) {
      return condition.customCondition(node);
    }
    
    return true;
  }

  private async applyRuleAction(action: RuleAction, node: EnhancedFigmaNode, context: ProcessingContext): Promise<void> {
    switch (action.type) {
      case 'enhance':
        Object.assign(node, action.parameters);
        break;
      case 'transform':
        // Apply transformations based on parameters
        break;
      case 'custom':
        if (action.customAction) {
          await action.customAction(node, context);
        }
        break;
    }
  }

  private applyContextReduction(node: EnhancedFigmaNode): void {
    if (!this.rules.contextReduction.removeRedundantProperties) {
      return;
    }

    // Remove empty arrays and objects
    Object.keys(node).forEach(key => {
      const value = (node as any)[key];
      if (Array.isArray(value) && value.length === 0) {
        delete (node as any)[key];
      } else if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
        delete (node as any)[key];
      }
    });

    // Limit text length
    if (node.characters && node.characters.length > this.rules.contextReduction.limitTextLength) {
      node.characters = node.characters.substring(0, this.rules.contextReduction.limitTextLength) + '...';
    }
  }

  // Helper methods
  private colorToCSS(color: FigmaColor): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = color.a;
    
    if (a === 1) {
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }

  private mapAxisAlign(align: string): string {
    switch (align) {
      case 'MIN': return 'flex-start';
      case 'CENTER': return 'center';
      case 'MAX': return 'flex-end';
      case 'SPACE_BETWEEN': return 'space-between';
      default: return 'flex-start';
    }
  }

  private detectTextHierarchy(node: FigmaNode): number {
    if (node.type !== 'TEXT' || !node.style) {
      return 0;
    }
    
    const fontSize = node.style.fontSize;
    if (fontSize >= 32) return 1; // h1
    if (fontSize >= 24) return 2; // h2
    if (fontSize >= 20) return 3; // h3
    if (fontSize >= 18) return 4; // h4
    if (fontSize >= 16) return 5; // h5
    return 6; // h6 or body
  }

  private detectGridArea(_node: FigmaNode, _context: ProcessingContext): string | undefined {
    // Implementation for detecting CSS Grid area
    return undefined;
  }

  private detectFlexOrder(_node: FigmaNode, _context: ProcessingContext): number | undefined {
    // Implementation for detecting flex order
    return undefined;
  }

  /**
   * Get processing statistics
   */
  getStats(): ProcessingStats {
    return { ...this.stats };
  }

  /**
   * Reset processing statistics
   */
  resetStats(): void {
    this.stats = {
      nodesProcessed: 0,
      nodesEnhanced: 0,
      rulesApplied: 0,
      processingTime: 0,
      errors: [],
      warnings: []
    };
  }

  /**
   * Update rules configuration
   */
  updateRules(newRules: Partial<ContextRules>): void {
    this.rules = mergeRules(this.rules, newRules);
  }
} 