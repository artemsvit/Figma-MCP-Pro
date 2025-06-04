import { reactRules } from './react.js';
import { vueRules } from './vue.js';
import { angularRules } from './angular.js';
import { svelteRules } from './svelte.js';
import { htmlRules } from './html.js';
import { swiftuiRules } from './swiftui.js';
import { uikitRules } from './uikit.js';
import { electronRules } from './electron.js';
import { tauriRules } from './tauri.js';
import { nwjsRules } from './nwjs.js';
import type { ContextRules } from '../rules.js';

export type Framework = 'react' | 'vue' | 'angular' | 'svelte' | 'html' | 'swiftui' | 'uikit' | 'electron' | 'tauri' | 'nwjs';

export const frameworks: Record<Framework, Partial<ContextRules>> = {
  react: reactRules,
  vue: vueRules,
  angular: angularRules,
  svelte: svelteRules,
  html: htmlRules,
  swiftui: swiftuiRules,
  uikit: uikitRules,
  electron: electronRules,
  tauri: tauriRules,
  nwjs: nwjsRules
} as const;

export const frameworkDescriptions = {
  react: {
    name: 'React',
    description: 'Modern React with TypeScript, functional components, and hooks',
    features: ['Components', 'TypeScript', 'Hooks', 'CSS Modules']
  },
  vue: {
    name: 'Vue 3',
    description: 'Vue 3 with Composition API and TypeScript',
    features: ['Components', 'Composition API', 'TypeScript', 'Scoped Styles']
  },
  angular: {
    name: 'Angular',
    description: 'Angular with TypeScript and component architecture',
    features: ['Components', 'TypeScript', 'Services', 'Angular CLI']
  },
  svelte: {
    name: 'Svelte',
    description: 'Svelte with TypeScript and reactive statements',
    features: ['Components', 'TypeScript', 'Reactive', 'Scoped Styles']
  },
  html: {
    name: 'HTML/CSS/JS',
    description: 'Vanilla HTML, CSS, and JavaScript - no framework',
    features: ['Semantic HTML', 'Pure CSS', 'Vanilla JS', 'Accessibility']
  },
  swiftui: {
    name: 'SwiftUI',
    description: 'Apple\'s declarative UI framework for iOS, macOS, watchOS, tvOS',
    features: ['Declarative', 'Swift', 'Cross-Apple Platform', 'Live Previews']
  },
  uikit: {
    name: 'UIKit',
    description: 'Traditional Apple UI framework with programmatic and Storyboard support',
    features: ['Imperative', 'Objective-C/Swift', 'Mature', 'SwiftUI Interop']
  },
  electron: {
    name: 'Electron',
    description: 'Cross-platform desktop apps with web technologies',
    features: ['Chromium', 'Node.js', 'Cross-Platform', 'Large Ecosystem']
  },
  tauri: {
    name: 'Tauri',
    description: 'Lightweight desktop apps with Rust backend and web frontend',
    features: ['System WebView', 'Rust Backend', 'Small Bundles', 'Secure']
  },
  nwjs: {
    name: 'NW.js',
    description: 'Node.js and Chromium combined for desktop applications',
    features: ['Node.js', 'Chromium', 'Direct DOM Access', 'Cross-Platform']
  }
} as const;

export function getFrameworkRules(framework: Framework) {
  return frameworks[framework];
}

export function getAvailableFrameworks() {
  return Object.keys(frameworks) as Framework[];
}

export function isValidFramework(framework: string): framework is Framework {
  return framework in frameworks;
} 