// Figma API Types and Interfaces
export interface FigmaFile {
  name: string;
  role: string;
  lastModified: string;
  editorType: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  componentSets: Record<string, FigmaComponentSet>;
  schemaVersion: number;
  styles: Record<string, FigmaStyle>;
  mainFileKey?: string;
  branches?: FigmaBranch[];
}

export interface FigmaNode {
  id: string;
  name: string;
  type: FigmaNodeType;
  visible?: boolean;
  locked?: boolean;
  children?: FigmaNode[];
  backgroundColor?: FigmaColor;
  prototypeStartNodeID?: string;
  prototypeDevice?: FigmaPrototypeDevice;
  flowStartingPoints?: FigmaFlowStartingPoint[];
  
  // Layout properties
  absoluteBoundingBox?: FigmaRectangle;
  absoluteRenderBounds?: FigmaRectangle;
  constraints?: FigmaLayoutConstraint;
  layoutAlign?: FigmaLayoutAlign;
  layoutGrow?: number;
  layoutSizingHorizontal?: FigmaLayoutSizing;
  layoutSizingVertical?: FigmaLayoutSizing;
  
  // Style properties
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  strokeAlign?: FigmaStrokeAlign;
  strokeDashes?: number[];
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number]; // [topLeft, topRight, bottomRight, bottomLeft]
  cornerSmoothing?: number;
  individualStrokeWeights?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // Text properties
  characters?: string;
  style?: FigmaTypeStyle;
  characterStyleOverrides?: number[];
  styleOverrideTable?: Record<string, FigmaTypeStyle>;
  
  // Effects
  effects?: FigmaEffect[];
  
  // Auto layout
  layoutMode?: FigmaLayoutMode;
  primaryAxisSizingMode?: FigmaAxisSizingMode;
  counterAxisSizingMode?: FigmaAxisSizingMode;
  primaryAxisAlignItems?: FigmaAxisAlign;
  counterAxisAlignItems?: FigmaAxisAlign;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  
  // Component properties
  componentId?: string;
  componentProperties?: Record<string, FigmaComponentProperty>;
  
  // Interaction properties
  transitionNodeID?: string;
  transitionDuration?: number;
  transitionEasing?: FigmaEasingType;
  
  // Export settings
  exportSettings?: FigmaExportSetting[];
  
  // Blend mode and opacity
  blendMode?: FigmaBlendMode;
  opacity?: number;
  
  // Mask properties
  isMask?: boolean;
  maskType?: FigmaMaskType;
  
  // Grid properties
  layoutGrids?: FigmaLayoutGrid[];
  
  // Plugin data
  pluginData?: Record<string, any>;
  sharedPluginData?: Record<string, Record<string, any>>;
}

export type FigmaNodeType = 
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'REGULAR_POLYGON'
  | 'RECTANGLE'
  | 'TEXT'
  | 'SLICE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'
  | 'STICKY'
  | 'SHAPE_WITH_TEXT'
  | 'CONNECTOR'
  | 'WIDGET'
  | 'EMBED'
  | 'LINK_UNFURL'
  | 'MEDIA'
  | 'SECTION';

export interface FigmaRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaPaint {
  type: FigmaPaintType;
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  blendMode?: FigmaBlendMode;
  gradientHandlePositions?: FigmaVector[];
  gradientStops?: FigmaColorStop[];
  scaleMode?: FigmaScaleMode;
  imageTransform?: FigmaTransform;
  scalingFactor?: number;
  rotation?: number;
  imageRef?: string;
  filters?: FigmaImageFilters;
  gifRef?: string;
  boundVariables?: Record<string, FigmaVariableAlias>;
}

export type FigmaPaintType = 
  | 'SOLID'
  | 'GRADIENT_LINEAR'
  | 'GRADIENT_RADIAL'
  | 'GRADIENT_ANGULAR'
  | 'GRADIENT_DIAMOND'
  | 'IMAGE'
  | 'EMOJI'
  | 'VIDEO';

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  documentationLinks: FigmaDocumentationLink[];
  remote: boolean;
  componentSetId?: string;
}

export interface FigmaComponentSet {
  key: string;
  name: string;
  description: string;
  documentationLinks: FigmaDocumentationLink[];
  remote: boolean;
}

export interface FigmaStyle {
  key: string;
  name: string;
  description: string;
  remote: boolean;
  styleType: FigmaStyleType;
}

export type FigmaStyleType = 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';

export interface FigmaLayoutConstraint {
  vertical: FigmaVerticalConstraint;
  horizontal: FigmaHorizontalConstraint;
}

export type FigmaVerticalConstraint = 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
export type FigmaHorizontalConstraint = 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';

export type FigmaLayoutAlign = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'INHERIT';
export type FigmaLayoutSizing = 'FIXED' | 'HUG' | 'FILL';
export type FigmaLayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL';
export type FigmaAxisSizingMode = 'FIXED' | 'AUTO';
export type FigmaAxisAlign = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';

export interface FigmaTypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  listSpacing?: number;
  hangingPunctuation?: boolean;
  hangingList?: boolean;
  fontSize: number;
  textDecoration?: FigmaTextDecoration;
  textCase?: FigmaTextCase;
  lineHeightPx: number;
  lineHeightPercent?: number;
  lineHeightPercentFontSize?: number;
  lineHeightUnit: FigmaLineHeightUnit;
  letterSpacing: number;
  fills: FigmaPaint[];
  hyperlink?: FigmaHyperlink;
  opentypeFlags?: Record<string, number>;
  boundVariables?: Record<string, FigmaVariableAlias>;
}

export type FigmaTextDecoration = 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
export type FigmaTextCase = 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED';
export type FigmaLineHeightUnit = 'PIXELS' | 'FONT_SIZE_%' | 'INTRINSIC_%';

export interface FigmaEffect {
  type: FigmaEffectType;
  visible?: boolean;
  radius?: number;
  color?: FigmaColor;
  blendMode?: FigmaBlendMode;
  offset?: FigmaVector;
  spread?: number;
  showShadowBehindNode?: boolean;
  boundVariables?: Record<string, FigmaVariableAlias>;
}

export type FigmaEffectType = 
  | 'INNER_SHADOW'
  | 'DROP_SHADOW'
  | 'LAYER_BLUR'
  | 'BACKGROUND_BLUR';

export interface FigmaVector {
  x: number;
  y: number;
}

export interface FigmaColorStop {
  position: number;
  color: FigmaColor;
  boundVariables?: Record<string, FigmaVariableAlias>;
}

export interface FigmaVariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

export interface FigmaDocumentationLink {
  uri: string;
}

export interface FigmaHyperlink {
  type: 'URL' | 'NODE';
  url?: string;
  nodeID?: string;
}

export type FigmaBlendMode = 
  | 'PASS_THROUGH'
  | 'NORMAL'
  | 'DARKEN'
  | 'MULTIPLY'
  | 'LINEAR_BURN'
  | 'COLOR_BURN'
  | 'LIGHTEN'
  | 'SCREEN'
  | 'LINEAR_DODGE'
  | 'COLOR_DODGE'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY';

export type FigmaStrokeAlign = 'INSIDE' | 'OUTSIDE' | 'CENTER';

export interface FigmaExportSetting {
  suffix: string;
  format: FigmaExportFormat;
  constraint: FigmaConstraint;
}

export type FigmaExportFormat = 'JPG' | 'PNG' | 'SVG' | 'PDF';

export interface FigmaConstraint {
  type: FigmaConstraintType;
  value: number;
}

export type FigmaConstraintType = 'SCALE' | 'WIDTH' | 'HEIGHT';

export interface FigmaLayoutGrid {
  pattern: FigmaGridPattern;
  sectionSize: number;
  visible: boolean;
  color: FigmaColor;
  alignment: FigmaGridAlignment;
  gutterSize: number;
  offset: number;
  count: number;
}

export type FigmaGridPattern = 'COLUMNS' | 'ROWS' | 'GRID';
export type FigmaGridAlignment = 'MIN' | 'STRETCH' | 'CENTER';

export interface FigmaComponentProperty {
  type: FigmaComponentPropertyType;
  defaultValue: any;
  variantOptions?: string[];
  preferredValues?: FigmaComponentPropertyPreferredValue[];
}

export type FigmaComponentPropertyType = 
  | 'BOOLEAN'
  | 'INSTANCE_SWAP'
  | 'TEXT'
  | 'VARIANT';

export interface FigmaComponentPropertyPreferredValue {
  type: 'COMPONENT' | 'COMPONENT_SET';
  key: string;
}

export interface FigmaPrototypeDevice {
  type: FigmaDeviceType;
  size: FigmaVector;
  presetIdentifier?: string;
  rotation?: FigmaDeviceRotation;
}

export type FigmaDeviceType = 
  | 'NONE'
  | 'PRESET'
  | 'CUSTOM'
  | 'PRESENTATION';

export type FigmaDeviceRotation = 'NONE' | 'CCW_90';

export interface FigmaFlowStartingPoint {
  nodeId: string;
  name: string;
}

export type FigmaEasingType = 
  | 'EASE_IN'
  | 'EASE_OUT'
  | 'EASE_IN_AND_OUT'
  | 'LINEAR'
  | 'GENTLE_SPRING';

export type FigmaMaskType = 'ALPHA' | 'VECTOR' | 'LUMINANCE';

export type FigmaScaleMode = 'FILL' | 'FIT' | 'TILE' | 'STRETCH';

export interface FigmaTransform {
  m00: number;
  m01: number;
  m02: number;
  m10: number;
  m11: number;
  m12: number;
}

export interface FigmaImageFilters {
  exposure?: number;
  contrast?: number;
  saturation?: number;
  temperature?: number;
  tint?: number;
  highlights?: number;
  shadows?: number;
}

export interface FigmaBranch {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
  link_access: FigmaLinkAccess;
}

export type FigmaLinkAccess = 'inherit' | 'view' | 'edit';

// API Response Types
export interface FigmaFileResponse {
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  componentSets: Record<string, FigmaComponentSet>;
  schemaVersion: number;
  styles: Record<string, FigmaStyle>;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  role: string;
  editorType: string;
  linkAccess: FigmaLinkAccess;
}

export interface FigmaNodeResponse {
  nodes: Record<string, FigmaNodeWrapper>;
}

export interface FigmaNodeWrapper {
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  componentSets: Record<string, FigmaComponentSet>;
  schemaVersion: number;
  styles: Record<string, FigmaStyle>;
}

export interface FigmaImageResponse {
  images: Record<string, string>;
}

export interface FigmaProjectFilesResponse {
  files: FigmaProjectFile[];
}

export interface FigmaProjectFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
}

// Error Types
export interface FigmaError {
  status: number;
  err: string;
}

// Custom Enhanced Types for AI Context
export interface EnhancedFigmaNode extends FigmaNode {
  // AI-optimized properties
  cssProperties?: CSSProperties;
  semanticRole?: SemanticRole;
  accessibilityInfo?: AccessibilityInfo;
  responsiveBreakpoints?: ResponsiveBreakpoint[];
  designTokens?: DesignToken[];
  componentVariants?: ComponentVariant[];
  interactionStates?: InteractionState[];
  layoutContext?: LayoutContext;
  componentRelationships?: ComponentRelationships;
}

export interface CSSProperties {
  display?: string;
  position?: string;
  width?: string;
  height?: string;
  margin?: string;
  padding?: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  borderRadius?: string;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderStyle?: string;
  boxShadow?: string;
  transform?: string;
  opacity?: string;
  zIndex?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  filter?: string;
  backdropFilter?: string;
  [key: string]: string | undefined;
}

export interface SemanticRole {
  type: 'button' | 'input' | 'text' | 'image' | 'container' | 'navigation' | 'header' | 'footer' | 'main' | 'section' | 'article' | 'list' | 'grid' | 'card';
  purpose?: string;
  hierarchy?: number;
  
  // Enhanced button properties
  variant?: string;
  state?: string;
  
  // Enhanced input properties
  inputType?: string;
  required?: boolean;
  
  // Enhanced navigation properties
  level?: number;
  
  // Enhanced text properties
  contentType?: string;
  textAlign?: string;
  
  // Enhanced list properties
  listType?: string;
  itemCount?: number;
  
  // Enhanced grid properties
  gridStructure?: {
    columns: number;
    rows: number;
    gap: number;
  };
  responsive?: boolean;
  
  // Enhanced card properties
  cardType?: string;
  hasActions?: boolean;
  
  // Enhanced container properties
  layoutPattern?: string;
  semantic?: string;
  
  // Enhanced image properties
  imageType?: string;
  hasCaption?: boolean;
}

export interface AccessibilityInfo {
  ariaLabel?: string;
  ariaRole?: string;
  tabIndex?: number;
  altText?: string;
  focusable?: boolean;
}

export interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  properties: Partial<CSSProperties>;
}

export interface DesignToken {
  name: string;
  value: string;
  type: 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'opacity';
  category?: string;
  description?: string;
}

export interface ComponentVariant {
  name: string;
  properties: Record<string, any>;
  state?: 'default' | 'hover' | 'active' | 'disabled' | 'focus';
}

export interface InteractionState {
  trigger: 'hover' | 'click' | 'focus' | 'scroll';
  changes: Partial<CSSProperties>;
  animation?: AnimationProperties;
}

export interface AnimationProperties {
  duration: string;
  easing: string;
  delay?: string;
  iterations?: number;
}

export interface LayoutContext {
  parentType: FigmaNodeType;
  siblingCount: number;
  position: 'first' | 'middle' | 'last' | 'only';
  gridArea?: string;
  flexOrder?: number;
}

export interface ComponentRelationships {
  parent?: {
    id: string;
    name: string;
    type: FigmaNodeType;
  };
  children?: Array<{
    id: string;
    name: string;
    type: FigmaNodeType;
    role?: string;
  }>;
  siblings?: Array<{
    id: string;
    name: string;
    type: FigmaNodeType;
  }>;
  componentInstance?: {
    mainComponent?: string;
    componentId?: string;
    overrides?: Record<string, any>;
  };
  exportable?: {
    hasExportSettings: boolean;
    formats?: string[];
    category?: 'icon' | 'image' | 'logo' | 'asset';
  };
}

// Comments API Types
export interface FigmaComment {
  id: string;
  file_key: string;
  parent_id: string;
  user: FigmaUser;
  created_at: string;
  resolved_at?: string;
  message: string;
  client_meta: FigmaCommentClientMeta;
  order_id: string;
}

export interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
  email?: string;
}

export interface FigmaCommentClientMeta {
  node_id?: string;
  node_offset?: FigmaVector;
}

export interface FigmaCommentsResponse {
  comments: FigmaComment[];
}

// Enhanced node type with comments
export interface EnhancedFigmaNodeWithComments extends EnhancedFigmaNode {
  comments?: FigmaComment[];
  commentInstructions?: CommentInstruction[];
  aiInstructions?: CommentInstruction[]; // Simplified instructions for AI agents
}

export interface CommentInstruction {
  type: 'animation' | 'interaction' | 'behavior' | 'general';
  instruction: string;
  author: string;
  timestamp: string;
  confidence: number; // 0-1 score of how likely this is an implementation instruction
  coordinates?: { x: number; y: number }; // Optional coordinates for spatial matching
} 