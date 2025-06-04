import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const electronRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.DESKTOP_BASE,
    enableCSSGeneration: true,
    enableResponsiveBreakpoints: true
  },
  
  frameworkOptimizations: {
    electron: {
      generateMainProcess: true,
      generateRendererProcess: true,
      useIPC: true,
      useWebSecurity: true,
      generateMenus: true,
      useNativeDialogs: true,
      generateUpdater: true,
      useContextIsolation: true,
      componentNamingConvention: NAMING_CONVENTIONS.CAMEL_CASE,
      generateNotifications: true,
      useCrashReporter: false,
      generateTrayIcon: false,
      useProtocolHandlers: false,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Main/Renderer process separation",
          checks: ["Context isolation", "Preload scripts", "Secure IPC"]
        },
        security: {
          rule: "Electron security best practices",
          description: "Context isolation, CSP, and secure defaults",
          priority: "critical" as const,
          checks: ["Context isolation", "Node integration disabled", "CSP headers"]
        },
        ipcCommunication: {
          rule: "Secure IPC patterns",
          description: "Type-safe IPC with proper validation",
          priority: "high" as const,
          checks: ["Typed IPC channels", "Input validation", "Error handling"]
        },
        nativeIntegration: {
          rule: "Native OS integration",
          description: "Menus, notifications, and system dialogs",
          priority: "medium" as const,
          checks: ["Application menus", "System notifications", "File dialogs"]
        },
        performance: {
          ...BASE_RULES.PERFORMANCE,
          checks: ["Memory management", "Process optimization", "Resource loading"]
        },
        testing: {
          ...BASE_RULES.TESTING,
          rule: "Electron testing strategy",
          checks: ["Spectron tests", "Unit tests", "Main process tests"]
        }
      }
    }
  }
}; 