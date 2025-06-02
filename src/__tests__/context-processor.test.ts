import { ContextProcessor, ProcessingContext } from '../processors/context-processor.js';
import { FigmaNode } from '../types/figma.js';

describe('ContextProcessor', () => {
  let processor: ContextProcessor;

  beforeEach(() => {
    processor = new ContextProcessor();
  });

  describe('processNode', () => {
    it('should process a simple frame node', async () => {
      const mockNode: FigmaNode = {
        id: '1:1',
        name: 'Test Frame',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: []
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(mockNode, context);

      expect(result).toBeDefined();
      expect(result.id).toBe('1:1');
      expect(result.name).toBe('Test Frame');
      expect(result.type).toBe('FRAME');
    });

    it('should apply semantic analysis to button nodes', async () => {
      const mockButtonNode: FigmaNode = {
        id: '1:2',
        name: 'Primary Button',
        type: 'COMPONENT',
        visible: true,
        locked: false,
        children: [
          {
            id: '1:3',
            name: 'Button Text',
            type: 'TEXT',
            visible: true,
            locked: false,
            characters: 'Click me'
          }
        ]
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(mockButtonNode, context);

      expect(result.semanticRole?.type).toBe('button');
      expect(result.accessibilityInfo?.ariaRole).toBe('button');
      expect(result.accessibilityInfo?.focusable).toBe(true);
    });

    it('should generate CSS properties for layout nodes', async () => {
      const mockLayoutNode: FigmaNode = {
        id: '1:4',
        name: 'Container',
        type: 'FRAME',
        visible: true,
        locked: false,
        layoutMode: 'HORIZONTAL',
        primaryAxisAlignItems: 'CENTER',
        counterAxisAlignItems: 'CENTER',
        itemSpacing: 16,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 16,
        paddingBottom: 16,
        absoluteBoundingBox: {
          x: 0,
          y: 0,
          width: 300,
          height: 100
        }
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(mockLayoutNode, context);

      expect(result.cssProperties?.display).toBe('flex');
      expect(result.cssProperties?.flexDirection).toBe('row');
      expect(result.cssProperties?.justifyContent).toBe('center');
      expect(result.cssProperties?.alignItems).toBe('center');
      expect(result.cssProperties?.gap).toBe('16px');
      expect(result.cssProperties?.width).toBe('300px');
      expect(result.cssProperties?.height).toBe('100px');
    });

    it('should respect depth limits', async () => {
      const processor = new ContextProcessor({
        maxDepth: 2
      });

      const deepNode: FigmaNode = {
        id: '1:5',
        name: 'Deep Node',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: [
          {
            id: '1:6',
            name: 'Child 1',
            type: 'FRAME',
            visible: true,
            locked: false,
            children: [
              {
                id: '1:7',
                name: 'Child 2',
                type: 'FRAME',
                visible: true,
                locked: false,
                children: [
                  {
                    id: '1:8',
                    name: 'Child 3 (should be excluded)',
                    type: 'FRAME',
                    visible: true,
                    locked: false
                  }
                ]
              }
            ]
          }
        ]
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(deepNode, context);

      expect(result.children).toBeDefined();
      expect(result.children?.length).toBe(1);
      expect(result.children?.[0]?.children).toBeDefined();
      expect(result.children?.[0]?.children?.length).toBe(1);
      // Should not process beyond maxDepth
      expect(result.children?.[0]?.children?.[0]?.children).toBeUndefined();
    });

    it('should extract design tokens from styled nodes', async () => {
      const mockStyledNode: FigmaNode = {
        id: '1:9',
        name: 'Styled Component',
        type: 'RECTANGLE',
        visible: true,
        locked: false,
        fills: [
          {
            type: 'SOLID',
            color: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
            visible: true
          }
        ],
        cornerRadius: 8,
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: true,
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            offset: { x: 0, y: 2 },
            radius: 4,
            spread: 0
          }
        ]
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(mockStyledNode, context);

      expect(result.designTokens).toBeDefined();
      expect(result.designTokens?.length).toBeGreaterThan(0);
      expect(result.cssProperties?.backgroundColor).toBe('rgb(51, 102, 204)');
      expect(result.cssProperties?.borderRadius).toBe('8px');
      expect(result.cssProperties?.boxShadow).toContain('0px 2px 4px 0px');
    });
  });

  describe('getStats', () => {
    it('should return processing statistics', () => {
      const stats = processor.getStats();

      expect(stats).toBeDefined();
      expect(stats.nodesProcessed).toBe(0);
      expect(stats.nodesEnhanced).toBe(0);
      expect(stats.rulesApplied).toBe(0);
      expect(stats.processingTime).toBe(0);
      expect(Array.isArray(stats.errors)).toBe(true);
      expect(Array.isArray(stats.warnings)).toBe(true);
    });
  });

  describe('resetStats', () => {
    it('should reset processing statistics', () => {
      processor.resetStats();
      const stats = processor.getStats();

      expect(stats.nodesProcessed).toBe(0);
      expect(stats.nodesEnhanced).toBe(0);
      expect(stats.rulesApplied).toBe(0);
      expect(stats.processingTime).toBe(0);
      expect(stats.errors.length).toBe(0);
      expect(stats.warnings.length).toBe(0);
    });
  });

  describe('Advanced Effects', () => {
    it('should handle multiple shadow effects', async () => {
      const nodeWithMultipleShadows: FigmaNode = {
        id: '1:10',
        name: 'Card',
        type: 'FRAME',
        visible: true,
        locked: false,
        effects: [
          {
            type: 'INNER_SHADOW',
            visible: true,
            color: { r: 0, g: 0, b: 0, a: 0.1 },
            offset: { x: 0, y: -1 },
            radius: 2,
            spread: 0
          },
          {
            type: 'DROP_SHADOW',
            visible: true,
            color: { r: 0, g: 0, b: 0, a: 0.15 },
            offset: { x: 0, y: 4 },
            radius: 8,
            spread: -2
          },
          {
            type: 'DROP_SHADOW',
            visible: true,
            color: { r: 0, g: 0, b: 0, a: 0.1 },
            offset: { x: 0, y: 10 },
            radius: 20,
            spread: -5
          }
        ]
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(nodeWithMultipleShadows, context);

      expect(result.cssProperties?.boxShadow).toContain('inset');
      expect(result.cssProperties?.boxShadow).toContain('0px -1px 2px 0px');
      expect(result.cssProperties?.boxShadow).toContain('0px 4px 8px -2px');
      expect(result.cssProperties?.boxShadow).toContain('0px 10px 20px -5px');
    });

    it('should handle stroke properties with different alignments', async () => {
      const nodeWithInsideStroke: FigmaNode = {
        id: '1:11',
        name: 'Border Box',
        type: 'RECTANGLE',
        visible: true,
        locked: false,
        strokes: [{
          type: 'SOLID',
          color: { r: 0.8, g: 0.8, b: 0.8, a: 1 },
          visible: true
        }],
        strokeWeight: 2,
        strokeAlign: 'INSIDE'
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(nodeWithInsideStroke, context);

      // Inside stroke should use box-shadow inset
      expect(result.cssProperties?.boxShadow).toBe('inset 0 0 0 2px rgb(204, 204, 204)');
      expect(result.cssProperties?.border).toBeUndefined();
    });

    it('should handle outside stroke alignment', async () => {
      const nodeWithOutsideStroke: FigmaNode = {
        id: '1:12',
        name: 'Outline Box',
        type: 'RECTANGLE',
        visible: true,
        locked: false,
        strokes: [{
          type: 'SOLID',
          color: { r: 1, g: 0, b: 0, a: 1 },
          visible: true
        }],
        strokeWeight: 3,
        strokeAlign: 'OUTSIDE'
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(nodeWithOutsideStroke, context);

      expect(result.cssProperties?.boxShadow).toBe('0 0 0 3px rgb(255, 0, 0)');
    });

    it('should handle individual stroke weights', async () => {
      const nodeWithIndividualStrokes: FigmaNode = {
        id: '1:13',
        name: 'Custom Borders',
        type: 'RECTANGLE',
        visible: true,
        locked: false,
        strokes: [{
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0, a: 1 },
          visible: true
        }],
        individualStrokeWeights: {
          top: 1,
          right: 2,
          bottom: 3,
          left: 0
        }
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(nodeWithIndividualStrokes, context);

      expect(result.cssProperties?.borderTop).toBe('1px solid rgb(0, 0, 0)');
      expect(result.cssProperties?.borderRight).toBe('2px solid rgb(0, 0, 0)');
      expect(result.cssProperties?.borderBottom).toBe('3px solid rgb(0, 0, 0)');
      expect(result.cssProperties?.borderLeft).toBe('none');
    });

    it('should handle blur effects', async () => {
      const nodeWithBlur: FigmaNode = {
        id: '1:14',
        name: 'Blurred Container',
        type: 'FRAME',
        visible: true,
        locked: false,
        effects: [
          {
            type: 'LAYER_BLUR',
            visible: true,
            radius: 10
          },
          {
            type: 'BACKGROUND_BLUR',
            visible: true,
            radius: 20
          }
        ]
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(nodeWithBlur, context);

      expect(result.cssProperties?.filter).toBe('blur(10px)');
      expect(result.cssProperties?.backdropFilter).toBe('blur(20px)');
    });

    it('should handle individual corner radii', async () => {
      const nodeWithAsymmetricCorners: FigmaNode = {
        id: '1:15',
        name: 'Asymmetric Corners',
        type: 'RECTANGLE',
        visible: true,
        locked: false,
        rectangleCornerRadii: [10, 20, 30, 40]
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(nodeWithAsymmetricCorners, context);

      expect(result.cssProperties?.borderRadius).toBe('10px 20px 30px 40px');
    });

    it('should extract shadow design tokens', async () => {
      const nodeWithShadow: FigmaNode = {
        id: '1:16',
        name: 'Shadow Card',
        type: 'FRAME',
        visible: true,
        locked: false,
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: true,
            color: { r: 0, g: 0, b: 0, a: 0.2 },
            offset: { x: 0, y: 4 },
            radius: 16,
            spread: -4
          }
        ]
      };

      const context: ProcessingContext = {
        fileKey: 'test-file',
        depth: 0,
        siblingIndex: 0,
        totalSiblings: 1
      };

      const result = await processor.processNode(nodeWithShadow, context);

      expect(result.designTokens).toBeDefined();
      const shadowToken = result.designTokens?.find(t => t.type === 'shadow');
      expect(shadowToken).toBeDefined();
      expect(shadowToken?.name).toBe('Shadow Card-drop-shadow-0');
      expect(shadowToken?.value).toBe('0px 4px 16px -4px rgba(0, 0, 0, 0.2)');
    });
  });
}); 