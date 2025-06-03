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
  FigmaTypeStyle,
  FigmaComment,
  CommentInstruction,
  EnhancedFigmaNodeWithComments
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

    // Border radius - support individual corners and cornerSmoothing
    if (node.cornerRadius !== undefined) {
      css.borderRadius = `${node.cornerRadius}px`;
    } else if (node.rectangleCornerRadii) {
      // Support for individual corner radii
      const [topLeft, topRight, bottomRight, bottomLeft] = node.rectangleCornerRadii;
      css.borderRadius = `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
    }

    // Strokes (borders)
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0]; // Use first stroke
      if (stroke && stroke.type === 'SOLID' && stroke.color) {
        const strokeWeight = node.strokeWeight || 1;
        const strokeColor = this.colorToCSS(stroke.color);
        
        // Handle stroke alignment
        if (node.strokeAlign === 'INSIDE') {
          // Use box-shadow inset to simulate inside stroke
          css.boxShadow = `inset 0 0 0 ${strokeWeight}px ${strokeColor}`;
        } else if (node.strokeAlign === 'OUTSIDE') {
          // Use box-shadow to simulate outside stroke
          css.boxShadow = `0 0 0 ${strokeWeight}px ${strokeColor}`;
        } else {
          // CENTER (default) - use regular border
          css.border = `${strokeWeight}px solid ${strokeColor}`;
        }
      }
    }

    // Individual strokes per side
    if (node.individualStrokeWeights) {
      const { top, right, bottom, left } = node.individualStrokeWeights;
      if (node.strokes && node.strokes.length > 0) {
        const stroke = node.strokes[0];
        if (stroke && stroke.type === 'SOLID' && stroke.color) {
          const strokeColor = this.colorToCSS(stroke.color);
          css.borderTop = top > 0 ? `${top}px solid ${strokeColor}` : 'none';
          css.borderRight = right > 0 ? `${right}px solid ${strokeColor}` : 'none';
          css.borderBottom = bottom > 0 ? `${bottom}px solid ${strokeColor}` : 'none';
          css.borderLeft = left > 0 ? `${left}px solid ${strokeColor}` : 'none';
        }
      }
    }

    // Stroke dashes
    if (node.strokeDashes && node.strokeDashes.length > 0) {
      css.borderStyle = 'dashed';
      // Note: CSS doesn't support custom dash patterns like Figma
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

    // Effects (shadows and blurs)
    if (node.effects && node.effects.length > 0) {
      const dropShadows: string[] = [];
      const innerShadows: string[] = [];
      let layerBlur: number | undefined;
      let backgroundBlur: number | undefined;
      
      // Process all effects
      node.effects.forEach(effect => {
        if (effect.visible === false) return; // Skip invisible effects
        
        switch (effect.type) {
          case 'DROP_SHADOW':
            const x = effect.offset?.x || 0;
            const y = effect.offset?.y || 0;
            const blur = effect.radius || 0;
            const spread = effect.spread || 0;
            const color = effect.color ? this.colorToCSS(effect.color) : 'rgba(0,0,0,0.25)';
            dropShadows.push(`${x}px ${y}px ${blur}px ${spread}px ${color}`);
            break;
            
          case 'INNER_SHADOW':
            const ix = effect.offset?.x || 0;
            const iy = effect.offset?.y || 0;
            const iblur = effect.radius || 0;
            const ispread = effect.spread || 0;
            const icolor = effect.color ? this.colorToCSS(effect.color) : 'rgba(0,0,0,0.25)';
            innerShadows.push(`inset ${ix}px ${iy}px ${iblur}px ${ispread}px ${icolor}`);
            break;
            
          case 'LAYER_BLUR':
            layerBlur = effect.radius || 0;
            break;
            
          case 'BACKGROUND_BLUR':
            backgroundBlur = effect.radius || 0;
            break;
        }
      });
      
      // Combine all shadows into box-shadow
      const allShadows = [...innerShadows, ...dropShadows];
      if (allShadows.length > 0) {
        // Check if we already have stroke shadows
        if (css.boxShadow) {
          css.boxShadow = `${css.boxShadow}, ${allShadows.join(', ')}`;
        } else {
          css.boxShadow = allShadows.join(', ');
        }
      }
      
      // Apply blur effects
      if (layerBlur !== undefined || backgroundBlur !== undefined) {
        const filters: string[] = [];
        if (layerBlur !== undefined) {
          filters.push(`blur(${layerBlur}px)`);
        }
        if (backgroundBlur !== undefined) {
          // backdrop-filter for background blur
          css.backdropFilter = `blur(${backgroundBlur}px)`;
        }
        if (filters.length > 0) {
          css.filter = filters.join(' ');
        }
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
    
    // Shadow tokens
    if (node.effects && node.effects.length > 0) {
      const dropShadows = node.effects.filter(e => e.type === 'DROP_SHADOW' && e.visible !== false);
      const innerShadows = node.effects.filter(e => e.type === 'INNER_SHADOW' && e.visible !== false);
      
      dropShadows.forEach((shadow, index) => {
        const x = shadow.offset?.x || 0;
        const y = shadow.offset?.y || 0;
        const blur = shadow.radius || 0;
        const spread = shadow.spread || 0;
        const color = shadow.color ? this.colorToCSS(shadow.color) : 'rgba(0,0,0,0.25)';
        
        tokens.push({
          name: `${node.name}-drop-shadow-${index}`,
          value: `${x}px ${y}px ${blur}px ${spread}px ${color}`,
          type: 'shadow',
          category: 'drop-shadow'
        });
      });
      
      innerShadows.forEach((shadow, index) => {
        const x = shadow.offset?.x || 0;
        const y = shadow.offset?.y || 0;
        const blur = shadow.radius || 0;
        const spread = shadow.spread || 0;
        const color = shadow.color ? this.colorToCSS(shadow.color) : 'rgba(0,0,0,0.25)';
        
        tokens.push({
          name: `${node.name}-inner-shadow-${index}`,
          value: `inset ${x}px ${y}px ${blur}px ${spread}px ${color}`,
          type: 'shadow',
          category: 'inner-shadow'
        });
      });
    }
    
    // Border tokens
    if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
      const stroke = node.strokes[0];
      if (stroke && stroke.type === 'SOLID' && stroke.color) {
        tokens.push({
          name: `${node.name}-border`,
          value: `${node.strokeWeight}px solid ${this.colorToCSS(stroke.color)}`,
          type: 'border',
          category: 'stroke'
        });
      }
    }
    
    // Border radius tokens
    if (node.cornerRadius !== undefined) {
      tokens.push({
        name: `${node.name}-border-radius`,
        value: `${node.cornerRadius}px`,
        type: 'border',
        category: 'radius'
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

  /**
   * Process comments and associate them with nodes using coordinate matching
   */
  processCommentsForNode(
    node: EnhancedFigmaNode, 
    comments: FigmaComment[]
  ): EnhancedFigmaNodeWithComments {
    // Extract simplified comment instructions with coordinates
    const simplifiedInstructions = this.extractSimplifiedInstructions(comments);
    
    // Match instructions to this node and its children using coordinates
    const matchedInstructions = this.matchInstructionsToNode(node, simplifiedInstructions);

    if (matchedInstructions.length === 0) {
      // Process children recursively
      if (node.children) {
        const enhancedNodeWithComments: EnhancedFigmaNodeWithComments = {
          ...node,
          children: node.children.map(child => 
            this.processCommentsForNode(child as EnhancedFigmaNode, comments)
          )
        };
        return enhancedNodeWithComments;
      }
      return node as EnhancedFigmaNodeWithComments;
    }

    // Attach matched instructions directly to node
    const enhancedNodeWithComments: EnhancedFigmaNodeWithComments = {
      ...node,
      // Add instructions as direct properties for AI agents
      aiInstructions: matchedInstructions,
      // Also keep as commentInstructions for backward compatibility
      commentInstructions: matchedInstructions
    };

    // Process children recursively
    if (node.children) {
      enhancedNodeWithComments.children = node.children.map(child => 
        this.processCommentsForNode(child as EnhancedFigmaNode, comments)
      );
    }

    return enhancedNodeWithComments;
  }

  /**
   * Extract only essential data from comments: instruction + coordinates
   */
  private extractSimplifiedInstructions(comments: FigmaComment[]): Array<{
    instruction: string;
    coordinates: { x: number; y: number };
    nodeId?: string;
  }> {
    return comments
      .filter(comment => comment.message && comment.client_meta?.node_offset)
      .map(comment => ({
        instruction: comment.message,
        coordinates: {
          x: comment.client_meta!.node_offset!.x,
          y: comment.client_meta!.node_offset!.y
        },
        nodeId: comment.client_meta?.node_id
      }));
  }

  /**
   * Match instructions to nodes using coordinate proximity and node boundaries
   */
  private matchInstructionsToNode(
    node: EnhancedFigmaNode, 
    instructions: Array<{ instruction: string; coordinates: { x: number; y: number }; nodeId?: string }>
  ): CommentInstruction[] {
    const matchedInstructions: CommentInstruction[] = [];

    // Direct node ID match (highest priority)
    const directMatches = instructions.filter(inst => inst.nodeId === node.id);
    
    // Coordinate-based matching for nodes with bounds
    let coordinateMatches: typeof instructions = [];
    if (node.absoluteBoundingBox && instructions.length > directMatches.length) {
      const bounds = node.absoluteBoundingBox;
      coordinateMatches = instructions.filter(inst => 
        !inst.nodeId || inst.nodeId !== node.id // Don't double-count direct matches
      ).filter(inst => {
        const { x, y } = inst.coordinates;
        return x >= bounds.x && 
               x <= bounds.x + bounds.width &&
               y >= bounds.y && 
               y <= bounds.y + bounds.height;
      });
    }

    // Convert to CommentInstruction format
    [...directMatches, ...coordinateMatches].forEach(match => {
      const instructionType = this.categorizeInstruction(match.instruction);
      const confidence = match.nodeId === node.id ? 1.0 : 0.7; // Higher confidence for direct node matches
      
      matchedInstructions.push({
        type: instructionType,
        instruction: match.instruction,
        author: 'Designer', // Simplified - no need for full user data
        timestamp: new Date().toISOString(), // Simplified timestamp
        confidence,
        coordinates: match.coordinates // Keep coordinates for reference
      });
    });

    return matchedInstructions;
  }

  /**
   * Simplified instruction categorization
   */
  private categorizeInstruction(instruction: string): 'animation' | 'interaction' | 'behavior' | 'general' {
    const text = instruction.toLowerCase();
    
    if (text.includes('hover') || text.includes('click') || text.includes('tap') || text.includes('focus')) {
      return 'interaction';
    }
    
    if (text.includes('animate') || text.includes('animation') || text.includes('transition') || 
        text.includes('fade') || text.includes('slide') || text.includes('bounce')) {
      return 'animation';
    }
    
    if (text.includes('show') || text.includes('hide') || text.includes('toggle') || 
        text.includes('enable') || text.includes('disable')) {
      return 'behavior';
    }
    
    return 'general';
  }

  /**
   * Analyze comment for implementation instructions
   */
  private analyzeCommentForInstructions(comment: FigmaComment): CommentInstruction | null {
    const message = comment.message.toLowerCase();
    
    // Keywords that suggest implementation instructions
    const animationKeywords = [
      'animate', 'animation', 'transition', 'fade', 'slide', 'bounce', 'scale', 'rotate', 
      'duration', 'easing', 'timing', 'delay', 'spring', 'cubic-bezier', 'ease-in', 'ease-out',
      'transform', 'opacity', 'translate', 'zoom', 'flip', 'spin'
    ];
    
    const interactionKeywords = [
      'hover', 'click', 'tap', 'focus', 'active', 'disabled', 'press', 'interaction', 'state',
      'on-click', 'on-hover', 'on-focus', 'mouse', 'touch', 'gesture', 'trigger', 'event'
    ];
    
    const behaviorKeywords = [
      'behavior', 'behaviour', 'should', 'when', 'if', 'then', 'toggle', 'show', 'hide',
      'open', 'close', 'expand', 'collapse', 'reveal', 'display', 'visible', 'hidden',
      'enable', 'disable', 'activate', 'deactivate'
    ];
    
    const uiPatternKeywords = [
      'modal', 'dropdown', 'tooltip', 'accordion', 'tab', 'carousel', 'slider', 'sidebar',
      'menu', 'navigation', 'pagination', 'form', 'validation', 'loading', 'spinner'
    ];

    let type: 'animation' | 'interaction' | 'behavior' | 'general' = 'general';
    let confidence = 0.1; // Base confidence for any comment
    
    // Check for animation instructions
    const animationMatches = animationKeywords.filter(keyword => message.includes(keyword));
    if (animationMatches.length > 0) {
      type = 'animation';
      confidence += animationMatches.length * 0.15;
    }
    
    // Check for interaction instructions
    const interactionMatches = interactionKeywords.filter(keyword => message.includes(keyword));
    if (interactionMatches.length > 0) {
      type = 'interaction';
      confidence += interactionMatches.length * 0.15;
    }
    
    // Check for behavior instructions
    const behaviorMatches = behaviorKeywords.filter(keyword => message.includes(keyword));
    if (behaviorMatches.length > 0) {
      type = 'behavior';
      confidence += behaviorMatches.length * 0.12;
    }
    
    // Check for UI pattern keywords
    const patternMatches = uiPatternKeywords.filter(keyword => message.includes(keyword));
    if (patternMatches.length > 0) {
      confidence += patternMatches.length * 0.1;
    }
    
    // Boost confidence for imperative language
    const imperativeWords = ['should', 'must', 'need', 'add', 'create', 'implement', 'make', 'ensure'];
    const imperativeMatches = imperativeWords.filter(word => message.includes(word));
    if (imperativeMatches.length > 0) {
      confidence += 0.25;
    }
    
    // Boost confidence for specific measurements or values
    if (message.match(/\d+(px|ms|s|%|em|rem)/)) {
      confidence += 0.2;
    }
    
    // Boost confidence for code-like syntax
    if (message.includes('css') || message.includes('javascript') || message.includes('js') || message.includes('react')) {
      confidence += 0.15;
    }
    
    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);
    
    // Only return instruction if confidence is reasonable
    if (confidence < 0.25) {
      return null;
    }
    
    return {
      type,
      instruction: comment.message,
      author: comment.user.handle,
      timestamp: comment.created_at,
      confidence
    };
  }

  /**
   * Extract all node IDs from a node tree for comment filtering
   */
  extractAllNodeIds(node: FigmaNode): string[] {
    const nodeIds = [node.id];
    
    if (node.children) {
      node.children.forEach(child => {
        nodeIds.push(...this.extractAllNodeIds(child));
      });
    }
    
    return nodeIds;
  }
} 