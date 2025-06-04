import type { ContextRules } from '../rules.js';

export const svelteRules: Partial<ContextRules> = {
  aiOptimization: {
    enableCSSGeneration: true,
    enableSemanticAnalysis: true,
    enableAccessibilityInfo: true,
    enableResponsiveBreakpoints: true,
    enableDesignTokens: true,
    enableComponentVariants: true,
    enableInteractionStates: true,
    simplifyComplexPaths: true,
    optimizeForCodeGeneration: true
  },
  
  frameworkOptimizations: {
    react: {
      generateJSX: false,
      useStyledComponents: false,
      useTailwindCSS: false,
      generateHooks: false,
      generatePropTypes: false,
      useTypeScript: false,
      componentNamingConvention: 'PascalCase',
      generateStorybook: false
    },
    vue: {
      generateSFC: false,
      useCompositionAPI: false,
      useScoped: false,
      generateProps: false,
      useTypeScript: false,
      componentNamingConvention: 'PascalCase'
    },
    angular: {
      generateComponent: false,
      useStandalone: false,
      generateModule: false,
      useSignals: false,
      useTypeScript: false,
      componentNamingConvention: 'PascalCase'
    },
    svelte: {
      generateSvelteComponent: true,
      useTypeScript: true,
      useStores: true,
      componentNamingConvention: 'PascalCase',
      implementationRules: {
                modernSyntax: {
          rule: "Use modern Svelte 5 syntax and TypeScript",
          description: "Svelte 5 runes, TypeScript for type safety, and SvelteKit",
          priority: "critical",
          example: `<script lang="ts">
  interface User {
    id: number;
    name: string;
    email: string;
  }

  interface Props {
    users: User[];
    onUserSelect?: (user: User) => void;
  }

  let { users, onUserSelect }: Props = $props();
  let selectedUser = $state<User | null>(null);
  let searchTerm = $state('');

  let filteredUsers = $derived(
    users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  function selectUser(user: User) {
    selectedUser = user;
    onUserSelect?.(user);
  }
</script>

<div class="user-list">
  <input bind:value={searchTerm} placeholder="Search users..." />
  
  {#each filteredUsers as user (user.id)}
    <button 
      class="user-item" 
      class:selected={selectedUser?.id === user.id}
      onclick={() => selectUser(user)}
    >
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </button>
  {:else}
    <p>No users found</p>
  {/each}
</div>

<style>
  .user-list {
    display: grid;
    gap: 1rem;
  }
  
  .user-item {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    text-align: left;
  }
  
  .user-item.selected {
    border-color: #007acc;
    background: #f0f8ff;
  }
</style>`,
          checks: [
            "Use $props() for component props",
            "Use $state() for reactive variables", 
            "Use $derived() for computed values",
            "TypeScript interfaces for props"
          ]
        },

        storesAndState: {
          rule: "Use Svelte stores for global state",
          description: "State management with writable, readable, and derived stores",
          priority: "high", 
          example: `import { writable, derived } from 'svelte/store';

interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export const users = writable<User[]>([]);
export const currentUser = writable<User | null>(null);

export const activeUsers = derived(
  users,
  ($users) => $users.filter(user => user.isActive)
);

export const userActions = {
  async loadUsers() {
    const response = await fetch('/api/users');
    const userData = await response.json();
    users.set(userData);
  },
  
  setCurrentUser(user: User) {
    currentUser.set(user);
  }
};`,
          checks: [
            "Global state in Svelte stores",
            "Derived stores for computed state",
            "Store actions for mutations",
            "Proper TypeScript typing"
          ]
        },

        svelteKitOptimization: {
          rule: "Leverage SvelteKit features",
          description: "SvelteKit's routing, data loading, and SSR capabilities",
          priority: "high",
          example: `// src/routes/users/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const response = await fetch('/api/users');
  const users = await response.json();
  
  return {
    users
  };
};

// src/routes/users/+page.svelte
<script lang="ts">
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  let { users } = data;
</script>

<h1>Users</h1>
{#each users as user}
  <a href="/users/{user.id}">{user.name}</a>
{/each}`,
          checks: [
            "Use +page.ts for data loading",
            "Proper TypeScript with $types",
            "SSR-friendly data fetching",
            "File-based routing"
          ]
        },

        accessibilityFirst: {
          rule: "Build accessible components",
          description: "Keyboard navigation, ARIA attributes, and screen reader compatibility",
          priority: "high",
          example: `<script lang="ts">
  let isOpen = $state(false);
  let buttonRef: HTMLButtonElement;
  let menuRef: HTMLDivElement;
  
  function toggleMenu() {
    isOpen = !isOpen;
    if (isOpen) {
      setTimeout(() => menuRef?.focus(), 0);
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      isOpen = false;
      buttonRef?.focus();
    }
  }
</script>

<div class="dropdown">
  <button
    bind:this={buttonRef}
    onclick={toggleMenu}
    aria-expanded={isOpen}
    aria-haspopup="true"
    aria-controls="dropdown-menu"
  >
    Menu
  </button>
  
  {#if isOpen}
    <div
      bind:this={menuRef}
      id="dropdown-menu"
      role="menu"
      tabindex="-1"
      onkeydown={handleKeydown}
    >
      <a href="/profile" role="menuitem">Profile</a>
      <a href="/settings" role="menuitem">Settings</a>
      <button role="menuitem" onclick={() => logout()}>Logout</button>
    </div>
  {/if}
</div>`,
          checks: [
            "Proper ARIA attributes",
            "Keyboard navigation support",
            "Focus management",
            "Screen reader compatibility"
          ]
        }
      }
    },
    html: {
      generateSemanticHTML: true,
      useCSS: true,
      useTailwindCSS: true,
      generateAccessibleMarkup: true,
      useModernCSS: true
    },
    swiftui: {
      generateViews: true,
      useViewBuilder: true,
      generateModifiers: true,
      useObservableObject: true,
      useStateManagement: true,
      generatePreviewProvider: true,
      useEnvironmentObjects: false,
      componentNamingConvention: 'PascalCase',
      generateSFSymbols: true,
      useNativeColors: true,
      generateAdaptiveLayouts: true,
      useAsyncImage: true,
      generateNavigationViews: true,
      useToolbarModifiers: true,
      generateAnimations: true,
      useGeometryReader: false,
      generateDarkModeSupport: true,
      useTabViews: true,
      generateListViews: true,
      useScrollViews: true,
      generateFormViews: true
    },
    uikit: {
      generateViewControllers: true,
      useStoryboards: false,
      useProgrammaticLayout: true,
      useAutoLayout: true,
      generateXIBFiles: false,
      useStackViews: true,
      generateConstraints: true,
      useSwiftUIInterop: true,
      componentNamingConvention: 'PascalCase',
      generateDelegatePatterns: true,
      useModernConcurrency: true,
      generateAccessibilitySupport: true
    },
    electron: {
      generateMainProcess: true,
      generateRendererProcess: true,
      useIPC: true,
      useWebSecurity: true,
      generateMenus: true,
      useNativeDialogs: true,
      generateUpdater: true,
      useContextIsolation: true,
      componentNamingConvention: 'camelCase',
      generateNotifications: true,
      useCrashReporter: false,
      generateTrayIcon: false,
      useProtocolHandlers: false
    },
    tauri: {
      generateRustBackend: true,
      generateWebFrontend: true,
      useSystemWebView: true,
      generateCommands: true,
      useEventSystem: true,
      generatePlugins: false,
      useSidecar: false,
      componentNamingConvention: 'snake_case',
      generateUpdater: true,
      useFilesystem: true,
      generateNotifications: true,
      useSystemTray: false,
      generateMenus: true
    },
    nwjs: {
      generateNodeBackend: true,
      generateWebFrontend: true,
      useChromiumAPI: true,
      generateMenus: true,
      useNativeModules: true,
      generateManifest: true,
      useClipboard: true,
      componentNamingConvention: 'camelCase',
      generateFileAccess: true,
      useShell: true,
      generateScreenCapture: false,
      useTrayIcon: false
    }
  }
}; 