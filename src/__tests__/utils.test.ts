describe('Utility Functions', () => {
  describe('String Utilities', () => {
    const toPascalCase = (str: string): string => {
      return str
        .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
        .replace(/^(.)/, (char) => char.toUpperCase());
    };

    const toCamelCase = (str: string): string => {
      return str
        .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
        .replace(/^(.)/, (char) => char.toLowerCase());
    };

    const toKebabCase = (str: string): string => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    };

    it('should convert strings to PascalCase', () => {
      expect(toPascalCase('hello world')).toBe('HelloWorld');
      expect(toPascalCase('hello-world')).toBe('HelloWorld');
      expect(toPascalCase('hello_world')).toBe('HelloWorld');
      expect(toPascalCase('helloWorld')).toBe('HelloWorld');
      expect(toPascalCase('HelloWorld')).toBe('HelloWorld');
    });

    it('should convert strings to camelCase', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld');
      expect(toCamelCase('hello-world')).toBe('helloWorld');
      expect(toCamelCase('hello_world')).toBe('helloWorld');
      expect(toCamelCase('HelloWorld')).toBe('helloWorld');
      expect(toCamelCase('helloWorld')).toBe('helloWorld');
    });

    it('should convert strings to kebab-case', () => {
      expect(toKebabCase('HelloWorld')).toBe('hello-world');
      expect(toKebabCase('helloWorld')).toBe('hello-world');
      expect(toKebabCase('hello world')).toBe('hello-world');
      expect(toKebabCase('hello_world')).toBe('hello-world');
      expect(toKebabCase('hello-world')).toBe('hello-world');
    });
  });

  describe('Array Utilities', () => {
    const chunk = <T>(array: T[], size: number): T[][] => {
      const chunks: T[][] = [];
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
      }
      return chunks;
    };

    const unique = <T>(array: T[]): T[] => {
      return [...new Set(array)];
    };

    it('should chunk arrays correctly', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
      expect(chunk([], 2)).toEqual([]);
      expect(chunk([1], 2)).toEqual([[1]]);
    });

    it('should remove duplicates from arrays', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(unique([])).toEqual([]);
      expect(unique([1])).toEqual([1]);
    });
  });

  describe('Object Utilities', () => {
    const deepClone = <T>(obj: T): T => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
      if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
      if (typeof obj === 'object') {
        const clonedObj = {} as T;
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]);
          }
        }
        return clonedObj;
      }
      return obj;
    };

    const omit = <T extends Record<string, any>, K extends keyof T>(
      obj: T,
      keys: K[]
    ): Omit<T, K> => {
      const result = { ...obj };
      keys.forEach(key => delete result[key]);
      return result;
    };

    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2, d: [3, 4] } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
      expect(cloned.b.d).not.toBe(original.b.d);
    });

    it('should omit specified keys from objects', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = omit(obj, ['b', 'd']);
      
      expect(result).toEqual({ a: 1, c: 3 });
      expect(result).not.toHaveProperty('b');
      expect(result).not.toHaveProperty('d');
    });
  });

  describe('Validation Utilities', () => {
    const isValidUrl = (url: string): boolean => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const isValidHexColor = (color: string): boolean => {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      return hexRegex.test(color);
    };

    it('should validate URLs correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://figma.com/design/abc123')).toBe(true);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(true);
    });

    it('should validate email addresses correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should validate hex colors correctly', () => {
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#f00')).toBe(true);
      expect(isValidHexColor('#123ABC')).toBe(true);
      expect(isValidHexColor('#xyz')).toBe(false);
      expect(isValidHexColor('FF0000')).toBe(false);
      expect(isValidHexColor('#FF00')).toBe(false);
      expect(isValidHexColor('')).toBe(false);
    });
  });
}); 