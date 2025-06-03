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

  private analyzeSemanticRole(node: FigmaNode, context: ProcessingContext): SemanticRole | undefined {
    const name = node.name.toLowerCase();
    
    // Enhanced button detection with states
    if (this.isButton(node, name)) {
      return { 
        type: 'button', 
        purpose: 'interactive',
        variant: this.detectButtonVariant(node, name),
        state: this.detectComponentState(node, name)
      };
    }
    
    // Enhanced input detection with field types
    if (this.isInput(node, name)) {
      return { 
        type: 'input', 
        purpose: 'data-entry',
        inputType: this.detectInputType(node, name),
        required: name.includes('required') || name.includes('*')
      };
    }
    
    // Navigation and menu detection
    if (this.isNavigation(node, name, context)) {
      return { 
        type: 'navigation', 
        purpose: 'navigation',
        level: this.detectNavigationLevel(node, context)
      };
    }
    
    // Enhanced text content with semantic hierarchy
    if (node.type === 'TEXT') {
      const hierarchy = this.detectTextHierarchy(node);
      const contentType = this.detectContentType(node, name);
      return { 
        type: 'text', 
        hierarchy,
        contentType,
        textAlign: this.detectTextAlignment(node)
      };
    }
    
    // List detection
    if (this.isList(node, name, context)) {
      return {
        type: 'list',
        purpose: 'content',
        listType: this.detectListType(node, name),
        itemCount: this.countListItems(node)
      };
    }
    
    // Grid detection
    if (this.isGrid(node, name, context)) {
      return {
        type: 'grid',
        purpose: 'layout',
        gridStructure: this.analyzeGridStructure(node),
        responsive: this.detectResponsiveBehavior(node)
      };
    }
    
    // Card component detection
    if (this.isCard(node, name, context)) {
      return {
        type: 'card',
        purpose: 'content',
        cardType: this.detectCardType(node, name),
        hasActions: this.hasCardActions(node)
      };
    }
    
    // Container with layout analysis
    if (node.type === 'FRAME' && node.children && node.children.length > 0) {
      const layoutPattern = this.detectLayoutPattern(node);
      return { 
        type: 'container', 
        purpose: 'layout',
        layoutPattern,
        semantic: this.detectContainerSemantic(node, name)
      };
    }
    
    // Image with enhanced detection
    if (this.isImage(node, name)) {
      return {
        type: 'image',
        purpose: 'visual',
        imageType: this.detectImageType(node, name),
        hasCaption: this.hasImageCaption(node, context)
      };
    }
    
    return undefined;
  }

  // Enhanced helper methods for semantic analysis
  private isButton(node: FigmaNode, name: string): boolean {
    return name.includes('button') || 
           name.includes('btn') || 
           name.includes('cta') ||
           (node.type === 'FRAME' && this.hasButtonCharacteristics(node));
  }

  private hasButtonCharacteristics(node: FigmaNode): boolean {
    // Check for button-like styling: rounded corners, solid background, centered text
    const hasRoundedCorners = Boolean(node.cornerRadius && node.cornerRadius > 0);
    const hasSolidBackground = Boolean(node.fills && node.fills.some(fill => fill.type === 'SOLID'));
    const hasClickableSize = Boolean(node.absoluteBoundingBox && 
      node.absoluteBoundingBox.width >= 60 && node.absoluteBoundingBox.height >= 32);
    const hasTextChild = Boolean(node.children && node.children.some(child => child.type === 'TEXT'));
    
    return hasRoundedCorners && hasSolidBackground && hasClickableSize && hasTextChild;
  }

  private detectButtonVariant(node: FigmaNode, name: string): string {
    if (name.includes('primary')) return 'primary';
    if (name.includes('secondary')) return 'secondary';
    if (name.includes('outline')) return 'outline';
    if (name.includes('ghost')) return 'ghost';
    if (name.includes('link')) return 'link';
    return 'default';
  }

  private detectComponentState(node: FigmaNode, name: string): string {
    if (name.includes('disabled')) return 'disabled';
    if (name.includes('hover')) return 'hover';
    if (name.includes('active')) return 'active';
    if (name.includes('focus')) return 'focus';
    return 'default';
  }

  private isInput(node: FigmaNode, name: string): boolean {
    return name.includes('input') || 
           name.includes('field') || 
           name.includes('textbox') ||
           name.includes('textarea') ||
           name.includes('select') ||
           name.includes('dropdown');
  }

  private detectInputType(node: FigmaNode, name: string): string {
    if (name.includes('email')) return 'email';
    if (name.includes('password')) return 'password';
    if (name.includes('search')) return 'search';
    if (name.includes('number')) return 'number';
    if (name.includes('tel') || name.includes('phone')) return 'tel';
    if (name.includes('url')) return 'url';
    if (name.includes('date')) return 'date';
    if (name.includes('textarea')) return 'textarea';
    if (name.includes('select') || name.includes('dropdown')) return 'select';
    return 'text';
  }

  private isNavigation(node: FigmaNode, name: string, context: ProcessingContext): boolean {
    return name.includes('nav') || 
           name.includes('menu') || 
           name.includes('header') ||
           name.includes('breadcrumb') ||
           (this.hasNavigationPattern(node) && context.depth <= 2);
  }

  private hasNavigationPattern(node: FigmaNode): boolean {
    // Check for horizontal list of links/buttons
    if (node.layoutMode === 'HORIZONTAL' && node.children) {
      const hasMultipleItems = node.children.length >= 2;
      const hasUniformItems = this.hasUniformChildren(node);
      return hasMultipleItems && hasUniformItems;
    }
    return false;
  }

  private detectNavigationLevel(node: FigmaNode, context: ProcessingContext): number {
    if (context.depth === 0) return 1; // Primary navigation
    if (context.depth === 1) return 2; // Secondary navigation
    return 3; // Tertiary navigation
  }

  private isList(node: FigmaNode, name: string, context: ProcessingContext): boolean {
    if (name.includes('list') || name.includes('items')) return true;
    
    // Auto-detect list pattern
    if (node.children && node.children.length >= 2) {
      const hasRepeatingPattern = this.hasRepeatingPattern(node);
      const isVerticalLayout = node.layoutMode === 'VERTICAL' || 
        (node.layoutMode === undefined && this.hasVerticalArrangement(node));
      return hasRepeatingPattern && isVerticalLayout;
    }
    return false;
  }

  private detectListType(node: FigmaNode, name: string): string {
    if (name.includes('ordered') || name.includes('numbered')) return 'ordered';
    if (name.includes('unordered') || name.includes('bullet')) return 'unordered';
    if (name.includes('description') || name.includes('definition')) return 'description';
    
    // Auto-detect based on content
    if (node.children && node.children.length > 0) {
      const firstChild = node.children[0];
      if (firstChild && this.hasNumbering(firstChild)) return 'ordered';
      if (firstChild && this.hasBulletPoints(firstChild)) return 'unordered';
    }
    return 'unordered';
  }

  private countListItems(node: FigmaNode): number {
    if (!node.children) return 0;
    // Count direct children that represent list items
    return node.children.filter(child => 
      child.type === 'FRAME' || child.type === 'TEXT'
    ).length;
  }

  private isGrid(node: FigmaNode, name: string, context: ProcessingContext): boolean {
    if (name.includes('grid') || name.includes('gallery')) return true;
    
    // Auto-detect grid pattern
    if (node.children && node.children.length >= 4) {
      const gridStructure = this.analyzeGridStructure(node);
      return gridStructure.columns > 1 && gridStructure.rows > 1;
    }
    return false;
  }

  private analyzeGridStructure(node: FigmaNode): { columns: number; rows: number; gap: number } {
    if (!node.children || node.children.length === 0) {
      return { columns: 1, rows: 1, gap: 0 };
    }

    // Sort children by position
    const children = [...node.children].sort((a, b) => {
      const aBox = a.absoluteBoundingBox;
      const bBox = b.absoluteBoundingBox;
      if (!aBox || !bBox) return 0;
      
      // Sort by Y first, then by X
      if (Math.abs(aBox.y - bBox.y) < 10) {
        return aBox.x - bBox.x;
      }
      return aBox.y - bBox.y;
    });

    // Detect grid dimensions
    if (children.length === 0) return { columns: 1, rows: 1, gap: 0 };
    
    const firstChild = children[0];
    if (!firstChild || !firstChild.absoluteBoundingBox) return { columns: 1, rows: 1, gap: 0 };
    
    // Count items in first row (same Y position)
    const firstRowY = firstChild.absoluteBoundingBox.y;
    const firstRowItems = children.filter(child => 
      child.absoluteBoundingBox && 
      Math.abs(child.absoluteBoundingBox.y - firstRowY) < 10
    );
    
    const columns = firstRowItems.length;
    const rows = Math.ceil(children.length / columns);
    
    // Calculate gap
    let gap = 0;
    if (firstRowItems.length > 1) {
      const first = firstRowItems[0]?.absoluteBoundingBox;
      const second = firstRowItems[1]?.absoluteBoundingBox;
      if (first && second) {
        gap = second.x - (first.x + first.width);
      }
    }
    
    return { columns, rows, gap: Math.max(0, gap) };
  }

  private isCard(node: FigmaNode, name: string, context: ProcessingContext): boolean {
    if (name.includes('card') || name.includes('tile')) return true;
    
    // Auto-detect card pattern
    return this.hasCardCharacteristics(node);
  }

  private hasCardCharacteristics(node: FigmaNode): boolean {
    // Check for card-like styling and content structure
    const hasBackground = Boolean(node.fills && node.fills.length > 0);
    const hasBorder = Boolean(node.strokes && node.strokes.length > 0);
    const hasShadow = Boolean(node.effects && node.effects.some(effect => 
      effect.type === 'DROP_SHADOW' && effect.visible !== false
    ));
    const hasStructuredContent = Boolean(node.children && node.children.length >= 2);
    const hasRoundedCorners = Boolean(node.cornerRadius && node.cornerRadius > 0);
    
    return (hasBackground || hasBorder || hasShadow) && 
           hasStructuredContent && 
           hasRoundedCorners;
  }

  private detectCardType(node: FigmaNode, name: string): string {
    if (name.includes('product')) return 'product';
    if (name.includes('profile') || name.includes('user')) return 'profile';
    if (name.includes('article') || name.includes('blog')) return 'article';
    if (name.includes('feature')) return 'feature';
    return 'content';
  }

  private hasCardActions(node: FigmaNode): boolean {
    if (!node.children) return false;
    
    return node.children.some(child => 
      this.isButton(child, child.name.toLowerCase()) ||
      child.name.toLowerCase().includes('action') ||
      child.name.toLowerCase().includes('link')
    );
  }

  private detectLayoutPattern(node: FigmaNode): string {
    if (!node.children || node.children.length === 0) return 'empty';
    
    // Check for specific layout patterns
    if (node.layoutMode === 'HORIZONTAL') {
      if (this.hasUniformChildren(node)) return 'horizontal-list';
      if (this.hasSidebarPattern(node)) return 'sidebar';
      return 'horizontal-flow';
    }
    
    if (node.layoutMode === 'VERTICAL') {
      if (this.hasHeaderBodyFooterPattern(node)) return 'header-body-footer';
      if (this.hasUniformChildren(node)) return 'vertical-list';
      return 'vertical-flow';
    }
    
    // Auto layout not defined, analyze positioning
    if (this.hasGridPattern(node)) return 'grid';
    if (this.hasAbsolutePositioning(node)) return 'absolute';
    if (this.hasStackingPattern(node)) return 'stack';
    
    return 'free-form';
  }

  private detectContainerSemantic(node: FigmaNode, name: string): string {
    if (name.includes('header')) return 'header';
    if (name.includes('footer')) return 'footer';
    if (name.includes('sidebar')) return 'aside';
    if (name.includes('main') || name.includes('content')) return 'main';
    if (name.includes('section')) return 'section';
    if (name.includes('article')) return 'article';
    if (name.includes('nav')) return 'nav';
    return 'div';
  }

  private isImage(node: FigmaNode, name: string): boolean {
    const hasImageFill = node.fills && node.fills.some(fill => fill.type === 'IMAGE');
    const isImageType = node.type === 'RECTANGLE' || node.type === 'ELLIPSE';
    const hasImageName = name.includes('image') || name.includes('photo') || 
                        name.includes('picture') || name.includes('avatar');
    
    return hasImageFill || (isImageType && hasImageName);
  }

  private detectImageType(node: FigmaNode, name: string): string {
    if (name.includes('avatar') || name.includes('profile')) return 'avatar';
    if (name.includes('logo')) return 'logo';
    if (name.includes('icon')) return 'icon';
    if (name.includes('hero') || name.includes('banner')) return 'hero';
    if (name.includes('thumbnail')) return 'thumbnail';
    return 'content';
  }

  private hasImageCaption(node: FigmaNode, context: ProcessingContext): boolean {
    // Check if there's a text element near this image
    if (!context.parentNode?.children) return false;
    
    const nodeIndex = context.siblingIndex;
    const siblings = context.parentNode.children;
    
    // Check next sibling for caption
    if (nodeIndex + 1 < siblings.length) {
      const nextSibling = siblings[nodeIndex + 1];
      if (!nextSibling) return false;
      
      return nextSibling.type === 'TEXT' && 
             nextSibling.name.toLowerCase().includes('caption');
    }
    
    return false;
  }

  // Enhanced text hierarchy detection
  private detectTextHierarchy(node: FigmaNode): number {
    if (node.type !== 'TEXT' || !node.style) {
      return 0;
    }
    
    const fontSize = node.style.fontSize;
    // @ts-ignore - fontWeight not in type definition but exists in API
    const fontWeight = node.style.fontWeight || 400;
    const name = node.name.toLowerCase();
    
    // Check explicit heading indicators first
    if (name.includes('h1') || name.includes('heading 1')) return 1;
    if (name.includes('h2') || name.includes('heading 2')) return 2;
    if (name.includes('h3') || name.includes('heading 3')) return 3;
    if (name.includes('h4') || name.includes('heading 4')) return 4;
    if (name.includes('h5') || name.includes('heading 5')) return 5;
    if (name.includes('h6') || name.includes('heading 6')) return 6;
    
    // Semantic name-based detection
    if (name.includes('title') || name.includes('headline')) {
      if (fontSize >= 32) return 1;
      if (fontSize >= 24) return 2;
      return 3;
    }
    
    if (name.includes('subtitle') || name.includes('subheading')) {
      if (fontSize >= 20) return 3;
      return 4;
    }
    
    // Font size and weight based detection
    if (fontSize >= 36 || (fontSize >= 28 && fontWeight >= 600)) return 1;
    if (fontSize >= 28 || (fontSize >= 24 && fontWeight >= 600)) return 2;
    if (fontSize >= 24 || (fontSize >= 20 && fontWeight >= 600)) return 3;
    if (fontSize >= 20 || (fontSize >= 18 && fontWeight >= 600)) return 4;
    if (fontSize >= 18 || (fontSize >= 16 && fontWeight >= 600)) return 5;
    if (fontSize >= 16 && fontWeight >= 600) return 6;
    
    return 0; // Body text
  }

  private detectContentType(node: FigmaNode, name: string): string {
    if (name.includes('title') || name.includes('heading') || name.includes('headline')) return 'title';
    if (name.includes('subtitle') || name.includes('subheading')) return 'subtitle';
    if (name.includes('label')) return 'label';
    if (name.includes('caption')) return 'caption';
    if (name.includes('description') || name.includes('body')) return 'body';
    if (name.includes('quote') || name.includes('blockquote')) return 'quote';
    if (name.includes('code')) return 'code';
    if (name.includes('link')) return 'link';
    if (name.includes('date') || name.includes('time')) return 'datetime';
    if (name.includes('price') || name.includes('cost')) return 'price';
    if (name.includes('tag')) return 'tag';
    return 'text';
  }

  private detectTextAlignment(node: FigmaNode): string {
    if (node.type !== 'TEXT' || !node.style) return 'left';
    
    // @ts-ignore - textAlignHorizontal not in type definition but exists in API
    const textAlign = node.style.textAlignHorizontal;
    if (textAlign === 'CENTER') return 'center';
    if (textAlign === 'RIGHT') return 'right';
    if (textAlign === 'JUSTIFIED') return 'justify';
    return 'left';
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
   * Detect ONLY nodes with explicit Figma export settings - no heuristics
   * Following Figma API specification: only export what's marked for export
   */
  private detectExportableImage(node: any): { category: 'icon' | 'image' | 'logo'; formats: string[]; isExportable: boolean } | null {
    // ONLY detect nodes with explicit export settings configured in Figma
    const hasExportSettings = node.exportSettings && node.exportSettings.length > 0;
    
    if (!hasExportSettings) {
      return null; // No export settings = not exportable
    }
    
    // Extract actual export formats and scales from Figma export settings
    const formats: string[] = [];
    for (const setting of node.exportSettings) {
      const format = setting.format.toLowerCase();
      let scale = 1;
      
      // Extract scale from constraint according to Figma API
      if (setting.constraint) {
        if (setting.constraint.type === 'SCALE') {
          scale = setting.constraint.value;
        }
      }
      
      // Format with scale info (e.g., "svg", "png@2x")
      if (format === 'svg' || scale === 1) {
        formats.push(format);
      } else {
        formats.push(`${format}@${scale}x`);
      }
    }
    
    // Determine category based on actual content, not guessing
    let category: 'icon' | 'image' | 'logo' = 'icon';
    
    // Check for actual image fills (photos/raster images)
    const hasImageFill = node.fills && node.fills.some((fill: any) => 
      fill.type === 'IMAGE' && fill.imageRef
    );
    
    if (hasImageFill) {
      category = 'image';
    } else {
      // For vector content, check naming for logos vs icons
      const name = node.name.toLowerCase();
      if (name.includes('logo') || name.includes('brand')) {
        category = 'logo';
      } else {
        category = 'icon';
      }
    }
    
    return {
      category,
      formats: [...new Set(formats)], // Remove duplicates
      isExportable: true
    };
  }

  // Helper methods for pattern detection
  private hasUniformChildren(node: FigmaNode): boolean {
    if (!node.children || node.children.length < 2) return false;
    
    const firstChild = node.children[0];
    if (!firstChild) return false;
    
    const firstType = firstChild.type;
    const firstSize = firstChild.absoluteBoundingBox;
    
    return node.children.every(child => {
      const childSize = child.absoluteBoundingBox;
      const sameType = child.type === firstType;
      const similarSize = firstSize && childSize && 
        Math.abs(firstSize.width - childSize.width) < 20 &&
        Math.abs(firstSize.height - childSize.height) < 20;
      return sameType && similarSize;
    });
  }

  private hasRepeatingPattern(node: FigmaNode): boolean {
    if (!node.children || node.children.length < 2) return false;
    
    // Check if children have similar structure
    const firstChild = node.children[0];
    if (!firstChild) return false;
    
    const pattern = this.analyzeNodeStructure(firstChild);
    
    return node.children.slice(1).every(child => 
      this.matchesStructurePattern(child, pattern)
    );
  }

  private hasVerticalArrangement(node: FigmaNode): boolean {
    if (!node.children || node.children.length < 2) return false;
    
    const sorted = [...node.children].sort((a, b) => {
      const aBox = a.absoluteBoundingBox;
      const bBox = b.absoluteBoundingBox;
      if (!aBox || !bBox) return 0;
      return aBox.y - bBox.y;
    });
    
    // Check if items are arranged vertically with minimal horizontal overlap
    for (let i = 1; i < sorted.length; i++) {
      const prevNode = sorted[i - 1];
      const currNode = sorted[i];
      const prev = prevNode?.absoluteBoundingBox;
      const curr = currNode?.absoluteBoundingBox;
      if (!prev || !curr) continue;
      
      // Items should be below each other, not side by side
      if (curr.y <= prev.y + prev.height * 0.5) return false;
    }
    
    return true;
  }

  private hasNumbering(node: FigmaNode): boolean {
    if (node.type !== 'TEXT' || !node.characters) return false;
    
    const text = node.characters.trim();
    const numberPatterns = [
      /^\d+\./,  // 1. 2. 3.
      /^\d+\)/,  // 1) 2) 3)
      /^\(\d+\)/, // (1) (2) (3)
      /^[ivx]+\./i, // i. ii. iii.
      /^[a-z]\./  // a. b. c.
    ];
    
    return numberPatterns.some(pattern => pattern.test(text));
  }

  private hasBulletPoints(node: FigmaNode): boolean {
    if (node.type !== 'TEXT' || !node.characters) return false;
    
    const text = node.characters.trim();
    const bulletPatterns = [
      /^•/, /^·/, /^‣/, /^⁃/, // Unicode bullets
      /^-/, /^\*/, /^\+/     // ASCII bullets
    ];
    
    return bulletPatterns.some(pattern => pattern.test(text));
  }

  private hasSidebarPattern(node: FigmaNode): boolean {
    if (!node.children || node.children.length !== 2) return false;
    
    const first = node.children[0];
    const second = node.children[1];
    if (!first || !second) return false;
    
    const firstBox = first.absoluteBoundingBox;
    const secondBox = second.absoluteBoundingBox;
    
    if (!firstBox || !secondBox) return false;
    
    // One child should be significantly narrower (sidebar)
    const firstIsNarrow = firstBox.width < secondBox.width * 0.5;
    const secondIsNarrow = secondBox.width < firstBox.width * 0.5;
    
    return firstIsNarrow || secondIsNarrow;
  }

  private hasHeaderBodyFooterPattern(node: FigmaNode): boolean {
    if (!node.children || node.children.length < 3) return false;
    
    // Sort by Y position
    const sorted = [...node.children].sort((a, b) => {
      const aBox = a.absoluteBoundingBox;
      const bBox = b.absoluteBoundingBox;
      if (!aBox || !bBox) return 0;
      return aBox.y - bBox.y;
    });
    
    // Check if first and last are smaller than middle sections
    const heights = sorted.map(child => child.absoluteBoundingBox?.height || 0);
    if (heights.length < 3) return false;
    
    const [headerHeight, ...bodyAndFooter] = heights;
    const footerHeight = bodyAndFooter[bodyAndFooter.length - 1];
    const bodyHeights = bodyAndFooter.slice(0, -1);
    const maxBodyHeight = Math.max(...bodyHeights);
    
    return (headerHeight || 0) < maxBodyHeight && (footerHeight || 0) < maxBodyHeight;
  }

  private hasGridPattern(node: FigmaNode): boolean {
    if (!node.children || node.children.length < 4) return false;
    
    const structure = this.analyzeGridStructure(node);
    return structure.columns > 1 && structure.rows > 1;
  }

  private hasAbsolutePositioning(node: FigmaNode): boolean {
    if (!node.children || node.children.length === 0) return false;
    
    // Check if children overlap significantly (indicating absolute positioning)
    const boxes = node.children
      .map(child => child.absoluteBoundingBox)
      .filter(box => box !== undefined);
    
    if (boxes.length < 2) return false;
    
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const box1 = boxes[i]!;
        const box2 = boxes[j]!;
        
        const overlapX = Math.max(0, Math.min(box1.x + box1.width, box2.x + box2.width) - Math.max(box1.x, box2.x));
        const overlapY = Math.max(0, Math.min(box1.y + box1.height, box2.y + box2.height) - Math.max(box1.y, box2.y));
        const overlapArea = overlapX * overlapY;
        
        const box1Area = box1.width * box1.height;
        const box2Area = box2.width * box2.height;
        const minArea = Math.min(box1Area, box2Area);
        
        // Significant overlap indicates absolute positioning
        if (overlapArea > minArea * 0.25) {
          return true;
        }
      }
    }
    
    return false;
  }

  private hasStackingPattern(node: FigmaNode): boolean {
    if (!node.children || node.children.length < 2) return false;
    
    // Check if elements are stacked with similar positions (like z-index stacking)
    const centerPoints = node.children.map(child => {
      const box = child.absoluteBoundingBox;
      return box ? {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
      } : null;
    }).filter(point => point !== null);
    
    if (centerPoints.length < 2) return false;
    
    // Check if center points are close together
    const [first, ...rest] = centerPoints;
    const threshold = 50; // pixels
    
    return rest.every(point => 
      Math.abs(point!.x - first!.x) < threshold &&
      Math.abs(point!.y - first!.y) < threshold
    );
  }

  private analyzeNodeStructure(node: FigmaNode): any {
    return {
      type: node.type,
      hasText: node.type === 'TEXT' || (node.children && node.children.some(child => child.type === 'TEXT')),
      hasImage: node.fills && node.fills.some(fill => fill.type === 'IMAGE'),
      childCount: node.children ? node.children.length : 0,
      hasBackground: node.fills && node.fills.length > 0,
      hasCornerRadius: node.cornerRadius && node.cornerRadius > 0
    };
  }

  private matchesStructurePattern(node: FigmaNode, pattern: any): boolean {
    const structure = this.analyzeNodeStructure(node);
    
    return structure.type === pattern.type &&
           structure.hasText === pattern.hasText &&
           structure.hasImage === pattern.hasImage &&
           Math.abs(structure.childCount - pattern.childCount) <= 1 &&
           structure.hasBackground === pattern.hasBackground;
  }

  private detectResponsiveBehavior(node: FigmaNode): boolean {
    // Analyze layout properties to detect responsive behavior intentions
    if (!node.children || node.children.length === 0) return false;
    
    // Check for auto layout (indicates responsive design)
    const hasAutoLayout = node.layoutMode !== undefined && node.layoutMode !== 'NONE';
    
    // Check for flexible sizing
    const hasFlexibleSizing = node.children.some(child => 
      child.layoutSizingHorizontal === 'FILL' || 
      child.layoutSizingVertical === 'FILL' ||
      (child.layoutGrow !== undefined && child.layoutGrow > 0)
    );
    
    // Check for constraints that suggest responsive behavior
    const hasResponsiveConstraints = node.children.some(child =>
      child.constraints?.horizontal === 'LEFT_RIGHT' ||
      child.constraints?.horizontal === 'SCALE' ||
      child.constraints?.vertical === 'TOP_BOTTOM' ||
      child.constraints?.vertical === 'SCALE'
    );
    
    return hasAutoLayout || hasFlexibleSizing || hasResponsiveConstraints;
  }
} 