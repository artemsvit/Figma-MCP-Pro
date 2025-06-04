import type { ContextRules } from '../rules.js';

export const vueRules: Partial<ContextRules> = {
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
      generateSFC: true,
      useCompositionAPI: true,
      useScoped: true,
      generateProps: true,
      useTypeScript: true,
      componentNamingConvention: 'PascalCase',
      implementationRules: {
        compositionAPIFirst: {
          rule: "Use Composition API over Options API",
          description: "Composition API for better logic organization and TypeScript support. Use <script setup>",
          priority: "critical",
          example: `<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
    <UserList :users="users" @user-selected="handleUserSelection" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import UserList from './components/UserList.vue'

const count = ref(0)
const users = ref<User[]>([])

const title = computed(() => \`Welcome! Clicked \${count.value} times\`)

const increment = () => {
  count.value++
}

const handleUserSelection = (user: User) => {
  console.log('Selected user:', user)
}

onMounted(() => {
  fetchUsers()
})

const fetchUsers = async () => {
  users.value = await fetch('/api/users').then(r => r.json())
}
</script>`,
          checks: [
            "Components use <script setup> syntax",
            "State management uses ref() and reactive()",
            "Computed properties use computed()",
            "Lifecycle hooks imported and used functionally"
          ]
        },

        composables: {
          rule: "Create reusable composables",
          description: "Extract reusable logic into composable functions. Use 'use' prefix",
          priority: "high",
          example: `export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const increment = () => {
    count.value++
  }
  
  const decrement = () => {
    count.value--
  }
  
  const reset = () => {
    count.value = initialValue
  }
  
  const isEven = computed(() => count.value % 2 === 0)
  
  return {
    count: readonly(count),
    increment,
    decrement,
    reset,
    isEven
  }
}`,
          checks: [
            "Composables start with 'use' prefix",
            "Logic extracted and reusable",
            "Return reactive references properly",
            "Use readonly() for immutable state"
          ]
        },

        typeScriptIntegration: {
          rule: "TypeScript-first development",
          description: "TypeScript for type safety. Define interfaces for props, emits, and data",
          priority: "critical",
          example: `<template>
  <div class="user-card" :class="variant">
    <h3>{{ user.name }}</h3>
    <p v-if="variant === 'detailed'">{{ user.email }}</p>
    <p>Role: {{ user.role }}</p>
    <button v-if="onEdit" @click="handleEdit">Edit</button>
  </div>
</template>

<script setup lang="ts">
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}

interface Props {
  user: User
  variant?: 'compact' | 'detailed'
}

interface Emits {
  edit: [userId: number]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'detailed'
})

const emit = defineEmits<Emits>()

const handleEdit = () => {
  emit('edit', props.user.id)
}
</script>`,
          checks: [
            "Props have TypeScript interfaces",
            "Emits properly typed",
            "Component data uses proper types",
            "Generic types for reusable components"
          ]
        },

        stateManagement: {
          rule: "Use Pinia for global state",
          description: "Pinia for complex state management. Composables for local state sharing",
          priority: "medium",
          example: `export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)

  const userCount = computed(() => users.value.length)
  const activeUsers = computed(() => 
    users.value.filter(user => user.isActive)
  )

  const fetchUsers = async () => {
    isLoading.value = true
    try {
      const response = await fetch('/api/users')
      users.value = await response.json()
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      isLoading.value = false
    }
  }

  const setCurrentUser = (user: User) => {
    currentUser.value = user
  }

  return {
    users,
    currentUser,
    isLoading,
    userCount,
    activeUsers,
    fetchUsers,
    setCurrentUser
  }
})`,
          checks: [
            "Pinia stores use Composition API syntax",
            "State properly typed",
            "Actions handle async operations",
            "Stores modular and focused"
          ]
        },

        provideInject: {
          rule: "Use provide/inject for component communication",
          description: "Provide/inject for data sharing between parent and descendant components",
          priority: "medium",
          example: `<script setup lang="ts">
import { provide, ref } from 'vue'

const theme = ref('light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

provide('theme', {
  current: theme,
  toggle: toggleTheme
})
</script>

<!-- Child Component -->
<script setup lang="ts">
import { inject } from 'vue'

interface ThemeContext {
  current: Ref<string>
  toggle: () => void
}

const theme = inject<ThemeContext>('theme')

const themeWithDefault = inject('theme', {
  current: ref('light'),
  toggle: () => {}
})
</script>`,
          checks: [
            "Provide/inject for non-prop data sharing",
            "Injection keys typed",
            "Default values provided for inject",
            "Context properly scoped"
          ]
        },

        reactivity: {
          rule: "Use ref() for primitives, reactive() for objects",
          description: "ref() for primitive values, reactive() for objects. Understand deep vs shallow reactivity",
          priority: "high",
          example: `<script setup lang="ts">
import { ref, reactive, shallowRef, readonly } from 'vue'

const count = ref(0)
const message = ref('Hello')
const isLoading = ref(false)

const user = reactive({
  name: 'John',
  email: 'john@example.com',
  preferences: {
    theme: 'dark',
    notifications: true
  }
})

const largeDataset = shallowRef([])

const config = readonly(reactive({
  apiUrl: 'https://api.example.com',
  version: '1.0.0'
}))

const fullName = computed(() => \`\${user.name} <\${user.email}>\`)
</script>`,
          checks: [
            "ref() used for primitive values",
            "reactive() used for objects",
            "shallowRef/shallowReactive for performance",
            "readonly() used to prevent mutations"
          ]
        },

        watchers: {
          rule: "Use watchers appropriately",
          description: "watch and watchEffect for side effects. Prefer computed for derived data",
          priority: "medium",
          example: `<script setup lang="ts">
import { ref, watch, watchEffect, onUnmounted } from 'vue'

const searchQuery = ref('')
const results = ref([])

watch(searchQuery, async (newQuery, oldQuery) => {
  if (newQuery !== oldQuery && newQuery.length > 2) {
    results.value = await searchAPI(newQuery)
  }
}, { debounce: 300 })

watch([user.name, user.email], ([newName, newEmail]) => {
  updateProfile({ name: newName, email: newEmail })
})

const cleanup = watchEffect(() => {
  if (user.id) {
    subscribeToUserUpdates(user.id)
  }
})

onUnmounted(() => {
  cleanup()
})
</script>`,
          checks: [
            "watch() for specific reactive sources",
            "watchEffect() for automatic dependency tracking",
            "Watchers cleaned up properly",
            "Debouncing used for performance"
          ]
        },

        performanceOptimization: {
          rule: "Optimize rendering performance",
          description: "v-memo, KeepAlive, and async components for better performance",
          priority: "medium",
          example: `<template>
  <div>
    <UserCard
      v-for="user in users"
      :key="user.id"
      v-memo="[user.id, user.lastModified]"
      :user="user"
    />
    
    <Suspense>
      <template #default>
        <AsyncDashboard />
      </template>
      <template #fallback>
        <div>Loading dashboard...</div>
      </template>
    </Suspense>
    
    <KeepAlive>
      <component :is="currentComponent" />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, shallowRef } from 'vue'

const AsyncDashboard = defineAsyncComponent(() =>
  import('./components/Dashboard.vue')
)

const largeList = shallowRef([])

const config = markRaw({
  apiEndpoints: [...],
  constants: {...}
})
</script>`,
          checks: [
            "v-memo for expensive list items",
            "Async components for code splitting",
            "KeepAlive for expensive component caching",
            "Shallow reactivity for large data"
          ]
        },

        testing: {
          rule: "Test components with Vue Testing Library",
          description: "User-focused tests. Test behavior, not implementation details",
          priority: "medium",
          example: `import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import SearchComponent from '@/components/SearchComponent.vue'

test('user can search for items', async () => {
  const user = userEvent.setup()
  
  render(SearchComponent, {
    props: {
      items: [
        { id: 1, name: 'Vue.js Guide' },
        { id: 2, name: 'React Tutorial' }
      ]
    }
  })
  
  const searchInput = screen.getByRole('textbox', { name: /search/i })
  const searchButton = screen.getByRole('button', { name: /search/i })
  
  await user.type(searchInput, 'Vue')
  await user.click(searchButton)
  
  expect(screen.getByText('Vue.js Guide')).toBeInTheDocument()
  expect(screen.queryByText('React Tutorial')).not.toBeInTheDocument()
})`,
          checks: [
            "Tests use Vue Testing Library",
            "Tests focus on user interactions",
            "Composables tested in isolation",
            "Accessibility queries used"
          ]
        },

        accessibility: {
          rule: "Build accessible components",
          description: "Keyboard accessible, proper ARIA labels, screen reader support",
          priority: "high",
          example: `<template>
  <form @submit.prevent="handleSubmit" role="search">
    <label :for="searchId" class="sr-only">
      Search products
    </label>
    <input
      :id="searchId"
      v-model="query"
      type="search"
      :placeholder="placeholder"
      :aria-describedby="helpId"
      required
    />
    <div :id="helpId" class="sr-only">
      Enter keywords to search for products
    </div>
    <button type="submit" :aria-label="submitLabel">
      Search
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  placeholder?: string
}

interface Emits {
  search: [query: string]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search...'
})

const emit = defineEmits<Emits>()

const query = ref('')
const searchId = computed(() => \`search-\${Math.random().toString(36).substr(2, 9)}\`)
const helpId = computed(() => \`\${searchId.value}-help\`)
const submitLabel = computed(() => \`Search for \${query.value || 'products'}\`)

const handleSubmit = () => {
  emit('search', query.value)
}
</script>`,
          checks: [
            "Form elements have labels",
            "Unique IDs generated for accessibility",
            "ARIA attributes used appropriately",
            "Keyboard navigation works"
          ]
        }
      }
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
      generateSvelteComponent: false,
      useTypeScript: false,
      useStores: false,
      componentNamingConvention: 'PascalCase'
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