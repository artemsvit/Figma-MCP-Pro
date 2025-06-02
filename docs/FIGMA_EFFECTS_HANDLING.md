# Figma Effects Handling in MCP Server

## Overview

This document describes how our Figma MCP Server handles various Figma effects and converts them to CSS properties for consistent design representation.

## Supported Effects

### 1. Corner Radius
- **Basic radius**: Single value applied to all corners
- **Individual radii**: Different values for each corner (topLeft, topRight, bottomRight, bottomLeft)
- **CSS Output**: `border-radius` property

```css
/* Basic */
border-radius: 8px;

/* Individual corners */
border-radius: 10px 20px 30px 40px;
```

### 2. Shadows

#### Drop Shadows
- Supports up to 8 drop shadows per element
- Includes offset (x/y), blur, spread, and color
- **CSS Output**: `box-shadow` property

```css
box-shadow: 0px 4px 16px -4px rgba(0, 0, 0, 0.2);
```

#### Inner Shadows  
- Supports up to 8 inner shadows per element
- Uses `inset` keyword in CSS
- **CSS Output**: `box-shadow` with `inset`

```css
box-shadow: inset 0px -1px 2px 0px rgba(0, 0, 0, 0.1);
```

#### Multiple Shadows
Multiple shadows are combined into a single `box-shadow` declaration:

```css
box-shadow: 
  inset 0px -1px 2px 0px rgba(0, 0, 0, 0.1),
  0px 4px 8px -2px rgba(0, 0, 0, 0.15),
  0px 10px 20px -5px rgba(0, 0, 0, 0.1);
```

### 3. Strokes (Borders)

#### Stroke Alignment
Figma supports three stroke alignments, which we handle differently:

1. **CENTER** (default): Standard CSS border
   ```css
   border: 2px solid rgb(204, 204, 204);
   ```

2. **INSIDE**: Uses inset box-shadow to simulate
   ```css
   box-shadow: inset 0 0 0 2px rgb(204, 204, 204);
   ```

3. **OUTSIDE**: Uses regular box-shadow to simulate
   ```css
   box-shadow: 0 0 0 3px rgb(255, 0, 0);
   ```

#### Individual Stroke Weights
Supports different stroke weights for each side:

```css
border-top: 1px solid rgb(0, 0, 0);
border-right: 2px solid rgb(0, 0, 0);
border-bottom: 3px solid rgb(0, 0, 0);
border-left: none;
```

#### Stroke Dashes
Basic support for dashed strokes:

```css
border-style: dashed;
```

*Note: CSS doesn't support custom dash patterns like Figma*

### 4. Blur Effects

#### Layer Blur
Applies blur to the element itself
- **CSS Output**: `filter` property

```css
filter: blur(10px);
```

#### Background Blur
Blurs content behind the element
- **CSS Output**: `backdrop-filter` property

```css
backdrop-filter: blur(20px);
```

### 5. Design Tokens

Our system automatically extracts design tokens from effects:

- **Shadow tokens**: Extracts each shadow as a reusable token
- **Border tokens**: Extracts stroke properties as tokens
- **Radius tokens**: Extracts corner radius values

Example tokens:
```json
{
  "name": "Card-drop-shadow-0",
  "value": "0px 4px 16px -4px rgba(0, 0, 0, 0.2)",
  "type": "shadow",
  "category": "drop-shadow"
}
```

## Implementation Notes

### Stroke Position Challenge
The biggest challenge is the mismatch between Figma's stroke positioning and CSS borders:
- Figma: Strokes can be inside, center, or outside the element bounds
- CSS: Borders are always part of the element's box model

We solve this by using box-shadow for inside/outside strokes, which doesn't affect layout.

### Performance Considerations
- Multiple shadows are combined into a single CSS property for better performance
- Blur effects (especially backdrop-filter) can impact performance on some devices

### Browser Compatibility
- `backdrop-filter` requires vendor prefixes for some browsers
- Complex box-shadows are well-supported across modern browsers

## Usage Example

When processing a Figma node with effects:

```typescript
const node: FigmaNode = {
  type: 'FRAME',
  cornerRadius: 8,
  strokes: [{
    type: 'SOLID',
    color: { r: 0.8, g: 0.8, b: 0.8, a: 1 }
  }],
  strokeWeight: 2,
  strokeAlign: 'INSIDE',
  effects: [
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.25 },
      offset: { x: 0, y: 2 },
      radius: 4
    }
  ]
};
```

Output CSS properties:
```json
{
  "borderRadius": "8px",
  "boxShadow": "inset 0 0 0 2px rgb(204, 204, 204), 0px 2px 4px 0px rgba(0, 0, 0, 0.25)"
}
```

## Future Enhancements

1. **Corner Smoothing**: Figma's cornerSmoothing property (iOS-style smooth corners)
2. **Gradient Borders**: Support for gradient strokes
3. **Advanced Blend Modes**: Better support for effect blend modes
4. **Noise & Texture Effects**: New Figma effects not yet supported
5. **Custom Dash Patterns**: More accurate stroke dash representation 