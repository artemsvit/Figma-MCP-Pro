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
   * Uses bottom-up approach to find the most specific element for each comment
   */
  processCommentsForNode(
    node: EnhancedFigmaNode, 
    comments: FigmaComment[]
  ): EnhancedFigmaNodeWithComments {
    // Extract simplified comment instructions with coordinates
    const simplifiedInstructions = this.extractSimplifiedInstructions(comments);
    
    console.error(`[Context Processor] Processing comments for node: ${node.name} (${node.id})`);
    console.error(`  Available instructions: ${simplifiedInstructions.length}`);
    
    // COMPREHENSIVE COORDINATE DEBUG: Show all element bounds vs comment coordinates
    if (simplifiedInstructions.length > 0) {
      console.error(`[Context Processor] COORDINATE ANALYSIS:`);
      simplifiedInstructions.forEach((inst, instIndex) => {
        console.error(`  Comment ${instIndex}: "${inst.instruction}" at (${inst.coordinates.x}, ${inst.coordinates.y})`);
        this.debugElementCoordinates(node, inst.coordinates, `    `);
      });
    }
    
    // Process children first (bottom-up approach) - this is crucial for specificity
    const processedChildren: EnhancedFigmaNodeWithComments[] = [];
    const usedInstructions = new Set<number>(); // Track which instructions have been used
    
    if (node.children) {
      console.error(`  Processing ${node.children.length} children first...`);
      for (const child of node.children) {
        const processedChild = this.processCommentsForNode(child as EnhancedFigmaNode, comments);
        processedChildren.push(processedChild);
        
        // Mark instructions used by children - be more aggressive about tracking
        if (processedChild.aiInstructions && processedChild.aiInstructions.length > 0) {
          console.error(`    Child ${child.name} claimed ${processedChild.aiInstructions.length} instructions`);
          processedChild.aiInstructions.forEach(inst => {
            const index = simplifiedInstructions.findIndex(si => 
              si.instruction === inst.instruction && 
              si.coordinates &&
              si.coordinates.x === inst.coordinates!.x && 
              si.coordinates.y === inst.coordinates!.y
            );
            if (index >= 0) {
              usedInstructions.add(index);
              console.error(`      Marked instruction ${index} as used: "${inst.instruction}"`);
            }
          });
        }
        
        // Also recursively mark instructions from grandchildren
        this.markUsedInstructionsRecursively(processedChild, simplifiedInstructions, usedInstructions);
      }
    }

    console.error(`  Instructions used by children: ${usedInstructions.size}`);
    
    // Only match instructions to this node if they haven't been used by children
    const availableInstructions = simplifiedInstructions.filter((_, index) => !usedInstructions.has(index));
    console.error(`  Available instructions for this node: ${availableInstructions.length}`);
    
    // Use ONLY coordinate-based matching - no semantic override
    // Children have already claimed their instructions, now parent gets remaining ones that coordinate-match
    const matchedInstructions = this.matchInstructionsToNode(node, availableInstructions);

    // Create enhanced node with comments
    const enhancedNodeWithComments: EnhancedFigmaNodeWithComments = {
      ...node,
      children: processedChildren.length > 0 ? processedChildren : undefined
    };

    // Only attach instructions if there are any for this specific node
    if (matchedInstructions.length > 0) {
      console.error(`  Attaching ${matchedInstructions.length} instructions to ${node.name}`);
      enhancedNodeWithComments.aiInstructions = matchedInstructions;
      enhancedNodeWithComments.commentInstructions = matchedInstructions;
    }

    return enhancedNodeWithComments;
  }

  /**
   * Recursively mark instructions as used from all descendants
   */
  private markUsedInstructionsRecursively(
    node: EnhancedFigmaNodeWithComments,
    simplifiedInstructions: Array<{ instruction: string; coordinates: { x: number; y: number }; nodeId?: string }>,
    usedInstructions: Set<number>
  ): void {
    // Mark this node's instructions
    if (node.aiInstructions) {
      node.aiInstructions.forEach(inst => {
        const index = simplifiedInstructions.findIndex(si => 
          si.instruction === inst.instruction && 
          si.coordinates &&
          si.coordinates.x === inst.coordinates!.x && 
          si.coordinates.y === inst.coordinates!.y
        );
        if (index >= 0) {
          usedInstructions.add(index);
        }
      });
    }
    
    // Recursively mark children's instructions
    if (node.children) {
      node.children.forEach(child => {
        this.markUsedInstructionsRecursively(child as EnhancedFigmaNodeWithComments, simplifiedInstructions, usedInstructions);
      });
    }
  }



  /**
   * Extract only essential data from comments: instruction + coordinates
   */
  private extractSimplifiedInstructions(comments: FigmaComment[]): Array<{
    instruction: string;
    coordinates: { x: number; y: number };
    nodeId?: string;
  }> {
    console.error(`[Context Processor] FULL COMMENT DATA DEBUG:`);
    comments.forEach((comment, index) => {
      console.error(`  Comment ${index}:`);
      console.error(`    message: "${comment.message}"`);
      console.error(`    client_meta:`, JSON.stringify(comment.client_meta, null, 2));
      if (comment.client_meta?.node_offset) {
        console.error(`    coordinates: (${comment.client_meta.node_offset.x}, ${comment.client_meta.node_offset.y})`);
      }
      if (comment.client_meta?.node_id) {
        console.error(`    target_node_id: ${comment.client_meta.node_id}`);
      }
    });

    const instructions = comments
      .filter(comment => comment.message && comment.client_meta?.node_offset)
      .map(comment => ({
        instruction: comment.message,
        coordinates: {
          x: comment.client_meta!.node_offset!.x,
          y: comment.client_meta!.node_offset!.y
        },
        nodeId: comment.client_meta?.node_id
      }));

    // Enhanced debug logging for comment coordinates
    console.error(`[Context Processor] Extracted ${instructions.length} instructions with coordinates:`);
    instructions.forEach((inst, index) => {
      console.error(`  ${index}: "${inst.instruction}" at (${inst.coordinates.x}, ${inst.coordinates.y}) node_id: ${inst.nodeId || 'none'}`);
    });

    return instructions;
  }

  /**
   * Match instructions to nodes using precise coordinate matching with specificity priority
   */
  private matchInstructionsToNode(
    node: EnhancedFigmaNode, 
    instructions: Array<{ instruction: string; coordinates: { x: number; y: number }; nodeId?: string }>
  ): CommentInstruction[] {
    const matchedInstructions: CommentInstruction[] = [];

    // Debug logging for this node
    console.error(`[Context Processor] Matching instructions for node: ${node.name} (${node.id})`);
    if (node.absoluteBoundingBox) {
      const bounds = node.absoluteBoundingBox;
      console.error(`  Node bounds: x=${bounds.x}, y=${bounds.y}, width=${bounds.width}, height=${bounds.height}`);
      console.error(`  Bounds range: x=${bounds.x} to ${bounds.x + bounds.width}, y=${bounds.y} to ${bounds.y + bounds.height}`);
    } else {
      console.error(`  Node has no absoluteBoundingBox`);
    }

    // Direct node ID match (highest priority)
    const directMatches = instructions.filter(inst => inst.nodeId === node.id);
    console.error(`  Direct ID matches: ${directMatches.length}`);
    
    // Precise coordinate-based matching - prioritize smaller, more specific elements
    let coordinateMatches: typeof instructions = [];
    if (node.absoluteBoundingBox && instructions.length > directMatches.length) {
      const bounds = node.absoluteBoundingBox;
      const nodeArea = bounds.width * bounds.height; // Calculate area for specificity
      
      coordinateMatches = instructions.filter(inst => 
        !inst.nodeId || inst.nodeId !== node.id // Don't double-count direct matches
      ).filter(inst => {
        const { x, y } = inst.coordinates;
        
        // STRICT coordinate matching only - no fuzzy tolerance for precision
        const exactMatch = x >= bounds.x && 
                          x <= bounds.x + bounds.width &&
                          y >= bounds.y && 
                          y <= bounds.y + bounds.height;
        
        if (exactMatch) {
          console.error(`    EXACT COORDINATE MATCH: "${inst.instruction}" at (${x}, ${y}) in node area ${nodeArea}px²`);
          return true;
        }
        
        console.error(`    NO MATCH: "${inst.instruction}" at (${x}, ${y}) outside bounds`);
        return false;
      });
    }
    console.error(`  Precise coordinate matches: ${coordinateMatches.length}`);

    // Convert to CommentInstruction format with specificity-based confidence
    [...directMatches, ...coordinateMatches].forEach(match => {
      const instructionType = this.categorizeInstruction(match.instruction);
      let confidence = 1.0;
      
      // Adjust confidence based on match type and node specificity
      if (match.nodeId === node.id) {
        confidence = 1.0; // Direct node ID match
      } else if (node.absoluteBoundingBox) {
        const bounds = node.absoluteBoundingBox;
        const nodeArea = bounds.width * bounds.height;
        
        // Higher confidence for smaller, more specific elements
        // Elements smaller than 10,000px² (100x100) get higher confidence
        if (nodeArea < 10000) {
          confidence = 0.95; // High confidence for small, specific elements like logos/icons
        } else if (nodeArea < 50000) {
          confidence = 0.85; // Medium confidence for medium elements like buttons
        } else {
          confidence = 0.7; // Lower confidence for large containers
        }
        
        console.error(`    Assigned confidence ${confidence} based on node area ${nodeArea}px²`);
      } else {
        confidence = 0.5; // Low confidence for nodes without bounds
      }
      
      matchedInstructions.push({
        type: instructionType,
        instruction: match.instruction,
        author: 'Designer',
        timestamp: new Date().toISOString(),
        confidence,
        coordinates: match.coordinates
      });
    });

    console.error(`  Total matched instructions: ${matchedInstructions.length}`);
    return matchedInstructions;
  }

  /**
   * Debug helper: Recursively show all element bounds compared to comment coordinates
   */
  private debugElementCoordinates(node: EnhancedFigmaNode, commentCoords: { x: number; y: number }, indent: string): void {
    if (node.absoluteBoundingBox) {
      const bounds = node.absoluteBoundingBox;
      const isInside = commentCoords.x >= bounds.x && 
                      commentCoords.x <= bounds.x + bounds.width &&
                      commentCoords.y >= bounds.y && 
                      commentCoords.y <= bounds.y + bounds.height;
      const area = bounds.width * bounds.height;
      
      console.error(`${indent}${node.name} (${node.type}): bounds(${bounds.x},${bounds.y}) to (${bounds.x + bounds.width},${bounds.y + bounds.height}) area=${area}px² ${isInside ? '✓ CONTAINS' : '✗ outside'}`);
    } else {
      console.error(`${indent}${node.name} (${node.type}): NO BOUNDS`);
    }
    
    // Recursively check children
    if (node.children) {
      node.children.forEach(child => {
        this.debugElementCoordinates(child as EnhancedFigmaNode, commentCoords, indent + '  ');
      });
    }
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

  /**
   * Generate optimized data structure for AI code generation
   * Removes redundant and non-valuable information, focuses on development needs
   */
  optimizeForAI(node: EnhancedFigmaNodeWithComments): any {
    const optimized: any = {
      // Core identification
      id: node.id,
      name: node.name,
      type: node.type,
    };

    // Only include valuable properties
    if (node.visible === false) optimized.visible = false; // Only if hidden
    if (node.children && node.children.length > 0) {
      optimized.children = node.children.map(child => 
        this.optimizeForAI(child as EnhancedFigmaNodeWithComments)
      );
    }

    // AI-friendly positioning (simplified)
    if (node.absoluteBoundingBox) {
      optimized.bounds = {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height
      };
    }

    // Essential CSS properties only
    if (node.cssProperties && Object.keys(node.cssProperties).length > 0) {
      optimized.css = this.cleanCSSProperties(node.cssProperties);
    }

    // Detect and mark exportable images/icons
    const imageInfo = this.detectExportableImage(node);
    if (imageInfo) {
      optimized.image = imageInfo;
      // Override type to be more specific
      if (imageInfo.category === 'icon') optimized.type = 'ICON';
      if (imageInfo.category === 'image') optimized.type = 'IMAGE';
    }

    // Semantic information for AI
    if (node.semanticRole) {
      optimized.role = node.semanticRole;
    }

    // Accessibility information
    if (node.accessibilityInfo && Object.keys(node.accessibilityInfo).length > 0) {
      optimized.accessibility = node.accessibilityInfo;
    }

    // Design tokens (valuable for design systems)
    if (node.designTokens && node.designTokens.length > 0) {
      optimized.tokens = node.designTokens.map(token => ({
        name: token.name,
        value: token.value,
        type: token.type
      }));
    }

    // Interaction states (valuable for components)
    if (node.interactionStates && node.interactionStates.length > 0) {
      optimized.interactions = node.interactionStates;
    }

    // Text content (essential)
    if (node.type === 'TEXT' && node.characters) {
      optimized.text = node.characters;
      
      // Simplified text styling (no complex overrides)
      if (node.style) {
        optimized.textStyle = {
          fontFamily: node.style.fontFamily,
          fontSize: node.style.fontSize,
          lineHeight: node.style.lineHeightPx
        };
      }
    }

    // Layout information (essential for containers)
    if (node.layoutMode) {
      optimized.layout = {
        mode: node.layoutMode,
        direction: node.layoutMode === 'HORIZONTAL' ? 'row' : 'column',
        gap: node.itemSpacing,
        padding: this.simplifyPadding(node)
      };
    }

    // AI Instructions (the most valuable!)
    if (node.aiInstructions && node.aiInstructions.length > 0) {
      optimized.instructions = node.aiInstructions.map(inst => ({
        type: inst.type,
        instruction: inst.instruction,
        confidence: inst.confidence
      }));
    }

    return optimized;
  }

  /**
   * Clean CSS properties - remove redundant and keep only development-relevant ones
   */
  private cleanCSSProperties(css: any): any {
    const essential = ['width', 'height', 'padding', 'margin', 'gap', 
                     'backgroundColor', 'color', 'fontSize', 'fontFamily', 
                     'borderRadius', 'border', 'boxShadow', 'display', 
                     'flexDirection', 'justifyContent', 'alignItems'];
    
    const cleaned: any = {};
    essential.forEach(prop => {
      if (css[prop] && css[prop] !== '0px' && css[prop] !== 'none') {
        cleaned[prop] = css[prop];
      }
    });
    
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  /**
   * Simplify padding to a single property
   */
  private simplifyPadding(node: any): string | undefined {
    if (!node.paddingTop && !node.paddingRight && !node.paddingBottom && !node.paddingLeft) {
      return undefined;
    }
    
    const top = node.paddingTop || 0;
    const right = node.paddingRight || 0;
    const bottom = node.paddingBottom || 0;
    const left = node.paddingLeft || 0;
    
    // Check if all sides are equal
    if (top === right && right === bottom && bottom === left) {
      return `${top}px`;
    }
    
    return `${top}px ${right}px ${bottom}px ${left}px`;
  }

  /**
   * Detect if a node represents an exportable image/icon
   */
  private detectExportableImage(node: any): { category: 'icon' | 'image' | 'logo'; formats: string[]; isExportable: boolean } | null {
    // Check for image fills (actual images)
    const hasImageFill = node.fills && node.fills.some((fill: any) => 
      fill.type === 'IMAGE' && fill.imageRef
    );
    
    // Check for vector/icon characteristics
    const isSmallSquare = node.absoluteBoundingBox && 
      node.absoluteBoundingBox.width <= 100 && 
      node.absoluteBoundingBox.height <= 100 &&
      Math.abs(node.absoluteBoundingBox.width - node.absoluteBoundingBox.height) <= 10;
    
    // Check naming patterns
    const name = node.name.toLowerCase();
    const isIcon = name.includes('icon') || name.includes('logo') || 
                   name.includes('svg') || isSmallSquare;
    const isImage = hasImageFill || name.includes('image') || name.includes('photo');
    
    // Check if it's a component or has export settings
    const isComponent = node.type === 'COMPONENT' || node.type === 'INSTANCE';
    const hasExportSettings = node.exportSettings && node.exportSettings.length > 0;
    
    // Check if it's a visual element (not a layout container)
    const hasSimpleStructure = !node.children || node.children.length <= 1;
    const isVisualElement = hasImageFill || isComponent || hasSimpleStructure;
    
    if (isIcon || isImage || (isComponent && isVisualElement) || hasExportSettings) {
      let category: 'icon' | 'image' | 'logo' = 'icon';
      
      if (hasImageFill) category = 'image';
      else if (name.includes('logo')) category = 'logo';
      else if (isIcon) category = 'icon';
      
      // Determine best export formats
      let formats: string[] = [];
      if (hasImageFill) {
        formats = ['png', 'jpg']; // Raster images
      } else if (category === 'icon' || category === 'logo') {
        formats = ['svg', 'png']; // Vector graphics
      } else {
        formats = ['png']; // Default
      }
      
      return {
        category,
        formats,
        isExportable: true
      };
    }
    
    return null;
  }
} 