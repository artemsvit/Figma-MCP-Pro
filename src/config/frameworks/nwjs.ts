import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const nwjsRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.DESKTOP_BASE,
    enableCSSGeneration: true,
    enableResponsiveBreakpoints: false
  },
  
  frameworkOptimizations: {
    nwjs: {
      generateNodeBackend: true,
      generateWebFrontend: true,
      useChromiumAPI: true,
      generateMenus: true,
      useNativeModules: true,
      generateManifest: true,
      useClipboard: true,
      componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE,
      generateFileAccess: true,
      useShell: true,
      generateScreenCapture: false,
      useTrayIcon: false,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Unified Node.js and DOM context",
          checks: ["Node.js modules in browser", "Direct file system access", "Chromium APIs"]
        },
        manifestConfiguration: {
          rule: "Package.json manifest configuration",
          description: "App properties and window settings",
          priority: "critical" as const,
          checks: ["package.json setup", "Window configuration", "App permissions"]
        },
        nodeIntegration: {
          rule: "Node.js API integration",
          description: "Direct Node.js module access in web pages",
          priority: "high" as const,
          checks: ["require() in browser", "File system APIs", "OS modules"]
        },
        chromiumFeatures: {
          rule: "Chromium-specific features",
          description: "Native browser capabilities and DevTools",
          priority: "high" as const,
          checks: ["DevTools access", "Window management", "Native dialogs"]
        },
        nativeIntegration: {
          rule: "Native system integration",
          description: "Menus, clipboard, and shell access",
          priority: "medium" as const,
          checks: ["Native menus", "Clipboard API", "Shell commands"]
        },
        performance: {
          ...BASE_RULES.PERFORMANCE,
          rule: "NW.js performance optimization",
          checks: ["Package optimization", "Memory management", "Startup performance"]
        },
        testing: {
          ...BASE_RULES.TESTING,
          rule: "NW.js testing strategy",
          checks: ["Node.js testing", "Browser testing", "Integration tests"]
        }
      }
    }
  }
}; 