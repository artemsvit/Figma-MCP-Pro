import { getFrameworkRules, getAvailableFrameworks, isValidFramework } from '../config/frameworks/index.js';

describe('Framework Configuration', () => {
  it('should have all 10 frameworks available', () => {
    const availableFrameworks = getAvailableFrameworks();
    expect(availableFrameworks).toHaveLength(10);
    expect(availableFrameworks).toEqual([
      'react', 'vue', 'angular', 'svelte', 'html', 
      'swiftui', 'uikit', 'electron', 'tauri', 'nwjs'
    ]);
  });

  it('should validate framework names correctly', () => {
    expect(isValidFramework('react')).toBe(true);
    expect(isValidFramework('vue')).toBe(true);
    expect(isValidFramework('angular')).toBe(true);
    expect(isValidFramework('svelte')).toBe(true);
    expect(isValidFramework('html')).toBe(true);
    expect(isValidFramework('swiftui')).toBe(true);
    expect(isValidFramework('uikit')).toBe(true);
    expect(isValidFramework('electron')).toBe(true);
    expect(isValidFramework('tauri')).toBe(true);
    expect(isValidFramework('nwjs')).toBe(true);
    
    expect(isValidFramework('invalid')).toBe(false);
    expect(isValidFramework('')).toBe(false);
  });

  it('should load framework rules for all frameworks', () => {
    const frameworkNames = getAvailableFrameworks();
    
    frameworkNames.forEach(framework => {
      const rules = getFrameworkRules(framework);
      expect(rules).toBeDefined();
      expect(typeof rules).toBe('object');
      expect(rules.aiOptimization).toBeDefined();
      expect(rules.frameworkOptimizations).toBeDefined();
    });
  });

  it('should have AI optimization settings for all frameworks', () => {
    const frameworkNames = getAvailableFrameworks();
    
    frameworkNames.forEach(framework => {
      const rules = getFrameworkRules(framework);
      const { aiOptimization } = rules;
      
      expect(aiOptimization).toBeDefined();
      expect(typeof aiOptimization?.enableSemanticAnalysis).toBe('boolean');
      expect(typeof aiOptimization?.enableAccessibilityInfo).toBe('boolean');
      expect(typeof aiOptimization?.optimizeForCodeGeneration).toBe('boolean');
    });
  });

  it('should have framework-specific optimizations', () => {
    const reactRules = getFrameworkRules('react');
    expect(reactRules.frameworkOptimizations?.react?.generateJSX).toBe(true);
    expect(reactRules.frameworkOptimizations?.react?.useTypeScript).toBe(true);

    const vueRules = getFrameworkRules('vue');
    expect(vueRules.frameworkOptimizations?.vue?.generateSFC).toBe(true);
    expect(vueRules.frameworkOptimizations?.vue?.useCompositionAPI).toBe(true);

    const angularRules = getFrameworkRules('angular');
    expect(angularRules.frameworkOptimizations?.angular?.generateComponent).toBe(true);
    expect(angularRules.frameworkOptimizations?.angular?.useStandalone).toBe(true);

    const htmlRules = getFrameworkRules('html');
    expect(htmlRules.frameworkOptimizations?.html?.generateSemanticHTML).toBe(true);
    expect(htmlRules.frameworkOptimizations?.html?.useModernCSS).toBe(true);
  });

  it('should have implementation rules for frameworks with advanced configurations', () => {
    const reactRules = getFrameworkRules('react');
    expect(reactRules.frameworkOptimizations?.react?.implementationRules).toBeDefined();
    
    const vueRules = getFrameworkRules('vue');
    expect(vueRules.frameworkOptimizations?.vue?.implementationRules).toBeDefined();
    
    const angularRules = getFrameworkRules('angular');
    expect(angularRules.frameworkOptimizations?.angular?.implementationRules).toBeDefined();
    
    const htmlRules = getFrameworkRules('html');
    expect(htmlRules.frameworkOptimizations?.html?.implementationRules).toBeDefined();
  });
}); 