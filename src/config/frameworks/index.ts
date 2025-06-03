import { reactRules } from './react.js';
import { vueRules } from './vue.js';
import { angularRules } from './angular.js';
import { svelteRules } from './svelte.js';
import { htmlRules } from './html.js';
import type { ContextRules } from '../rules.js';

export type Framework = 'react' | 'vue' | 'angular' | 'svelte' | 'html';

export const frameworks: Record<Framework, Partial<ContextRules>> = {
  react: reactRules,
  vue: vueRules,
  angular: angularRules,
  svelte: svelteRules,
  html: htmlRules
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