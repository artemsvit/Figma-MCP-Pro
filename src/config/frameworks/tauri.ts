import type { ContextRules } from '../rules.js';
import { COMMON_OPTIMIZATIONS, BASE_RULES, NAMING_CONVENTIONS } from '../base.js';

export const tauriRules: Partial<ContextRules> = {
  aiOptimization: {
    ...COMMON_OPTIMIZATIONS.DESKTOP_BASE,
    enableCSSGeneration: true,
    enableResponsiveBreakpoints: false
  },
  
  frameworkOptimizations: {
    tauri: {
      generateRustBackend: true,
      generateWebFrontend: true,
      useSystemWebView: true,
      generateCommands: true,
      useEventSystem: true,
      generatePlugins: false,
      useSidecar: false,
      componentNamingConvention: NAMING_CONVENTIONS.SNAKE_CASE,
      generateUpdater: true,
      useFilesystem: true,
      generateNotifications: true,
      useSystemTray: false,
      generateMenus: true,
      implementationRules: {
        modernPatterns: {
          ...BASE_RULES.MODERN_PATTERNS,
          rule: "Rust backend with web frontend",
          checks: ["Tauri commands", "System WebView", "Rust/JS interop"]
        },
        security: {
          rule: "WebView security configuration",
          description: "Secure WebView with CSP and allowlist",
          priority: "critical" as const,
          checks: ["Content Security Policy", "API allowlist", "Secure contexts"]
        },
        communication: {
          rule: "Frontend-backend communication",
          description: "Tauri invoke API and event system",
          priority: "high" as const,
          checks: ["Invoke API", "Event system", "Type-safe commands"]
        },
        nativeIntegration: {
          rule: "Native OS integration",
          description: "Tauri plugins for OS functionality",
          priority: "medium" as const,
          checks: ["Filesystem access", "Notifications", "System integration"]
        },
        performance: {
          ...BASE_RULES.PERFORMANCE,
          rule: "Bundle optimization",
          checks: ["System WebView", "Rust performance", "Small bundles"]
        },
        testing: {
          ...BASE_RULES.TESTING,
          rule: "Tauri testing strategy",
          checks: ["Rust unit tests", "WebView tests", "Integration tests"]
        }
      }
    }
  }
}; 