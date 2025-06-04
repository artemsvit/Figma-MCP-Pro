describe('URL Parsing', () => {
  // Test URL parsing functionality
  const parseFileKey = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const fileKeyIndex = pathParts.findIndex(part => part === 'design' || part === 'file') + 1;
      return fileKeyIndex > 0 && fileKeyIndex < pathParts.length ? pathParts[fileKeyIndex] : null;
    } catch {
      return null;
    }
  };

  const parseNodeId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const nodeId = urlObj.searchParams.get('node-id');
      return nodeId;
    } catch {
      return null;
    }
  };

  const convertNodeId = (nodeId: string): string => {
    return nodeId.replace(/-/g, ':');
  };

  describe('File Key Parsing', () => {
    it('should parse file key from design URLs', () => {
      const url = 'https://www.figma.com/design/ABC123XYZ/My-Design?node-id=1-2';
      expect(parseFileKey(url)).toBe('ABC123XYZ');
    });

    it('should parse file key from file URLs', () => {
      const url = 'https://www.figma.com/file/ABC123XYZ/My-Design?node-id=1-2';
      expect(parseFileKey(url)).toBe('ABC123XYZ');
    });

    it('should handle URLs with different domains', () => {
      const url = 'https://figma.com/design/XYZ789ABC/Test-Design';
      expect(parseFileKey(url)).toBe('XYZ789ABC');
    });

    it('should return null for invalid URLs', () => {
      expect(parseFileKey('not-a-url')).toBeNull();
      expect(parseFileKey('https://example.com/design/test')).toBe('test');
    });

    it('should return null for URLs without file key', () => {
      expect(parseFileKey('https://figma.com/design/') || null).toBeNull();
      expect(parseFileKey('https://figma.com/') || null).toBeNull();
    });
  });

  describe('Node ID Parsing', () => {
    it('should parse node ID from query parameters', () => {
      const url = 'https://figma.com/design/ABC123/Test?node-id=1530-166';
      expect(parseNodeId(url)).toBe('1530-166');
    });

    it('should handle URLs without node ID', () => {
      const url = 'https://figma.com/design/ABC123/Test';
      expect(parseNodeId(url)).toBeNull();
    });

    it('should handle URLs with other query parameters', () => {
      const url = 'https://figma.com/design/ABC123/Test?mode=dev&node-id=1-2&t=xyz';
      expect(parseNodeId(url)).toBe('1-2');
    });

    it('should return null for invalid URLs', () => {
      expect(parseNodeId('not-a-url')).toBeNull();
    });
  });

  describe('Node ID Conversion', () => {
    it('should convert dash format to colon format for API', () => {
      expect(convertNodeId('1530-166')).toBe('1530:166');
      expect(convertNodeId('1-2')).toBe('1:2');
      expect(convertNodeId('123-456-789')).toBe('123:456:789');
    });

    it('should handle already converted format', () => {
      expect(convertNodeId('1530:166')).toBe('1530:166');
    });

    it('should handle empty string', () => {
      expect(convertNodeId('')).toBe('');
    });
  });

  describe('Complete URL Processing', () => {
    it('should extract both file key and node ID from complete URL', () => {
      const url = 'https://www.figma.com/design/ZVnXdidh7cqIeJuI8e4c6g/My-Design?node-id=1530-166&t=abc123';
      
      const fileKey = parseFileKey(url);
      const nodeId = parseNodeId(url);
      const convertedNodeId = nodeId ? convertNodeId(nodeId) : null;
      
      expect(fileKey).toBe('ZVnXdidh7cqIeJuI8e4c6g');
      expect(nodeId).toBe('1530-166');
      expect(convertedNodeId).toBe('1530:166');
    });

    it('should handle minimal valid URL', () => {
      const url = 'https://figma.com/design/ABC123/Test';
      
      expect(parseFileKey(url)).toBe('ABC123');
      expect(parseNodeId(url)).toBeNull();
    });
  });
}); 