import type { ContextRules } from '../rules.js';

export const reactRules: Partial<ContextRules> = {
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
      generateJSX: true,
      useStyledComponents: false,
      useTailwindCSS: true,
      generateHooks: true,
      generatePropTypes: false,
      useTypeScript: true,
      componentNamingConvention: 'PascalCase',
      generateStorybook: false,
      implementationRules: {
        modernReactPatterns: {
          rule: "Use function components with hooks",
          description: "Function components over class components. Use useState, useEffect, useCallback, useMemo and custom hooks",
          priority: "critical",
          example: `function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  return <div>{user?.name}</div>;
}`,
          checks: [
            "Function components only",
            "State with useState/useReducer", 
            "Side effects with useEffect",
            "Custom hooks for reusable logic"
          ]
        },
        
        typeScriptIntegration: {
          rule: "TypeScript-first development",
          description: "TypeScript for type safety and better IDE support. Define interfaces for props and state",
          priority: "critical",
          example: `interface UserCardProps {
  user: {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
  };
  onEdit?: (userId: number) => void;
  variant?: 'compact' | 'detailed';
}

function UserCard({ user, onEdit, variant = 'detailed' }: UserCardProps) {
  return (
    <div className={\`user-card \${variant}\`}>
      <h3>{user.name}</h3>
      {variant === 'detailed' && <p>{user.email}</p>}
      {onEdit && <button onClick={() => onEdit(user.id)}>Edit</button>}
    </div>
  );
}`,
          checks: [
            "Components have TypeScript interfaces",
            "State types properly defined",
            "Event handlers typed",
            "API responses typed"
          ]
        },

        customHooks: {
          rule: "Extract logic into custom hooks",
          description: "Custom hooks for reusable stateful logic. Follow 'use' naming convention",
          priority: "high",
          example: `function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}`,
          checks: [
            "Custom hooks start with 'use'",
            "Logic reusable across components",
            "Handle loading and error states",
            "Dependencies properly managed"
          ]
        },

        performanceOptimization: {
          rule: "Optimize with React.memo and useCallback",
          description: "React.memo for components, useCallback for functions, useMemo for calculations",
          priority: "high",
          example: `const UserCard = React.memo(({ user, onEdit }) => {
  const handleEdit = useCallback(() => {
    onEdit(user.id);
  }, [user.id, onEdit]);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US').format(new Date(user.createdAt));
  }, [user.createdAt]);

  return (
    <div>
      <h3>{user.name}</h3>
      <p>Joined: {formattedDate}</p>
      <button onClick={handleEdit}>Edit</button>
    </div>
  );
});`,
          checks: [
            "Components wrapped with React.memo",
            "Event handlers use useCallback",
            "Expensive calculations use useMemo",
            "Component re-renders minimized"
          ]
        },

        stateManagement: {
          rule: "Context API for app-wide state",
          description: "React Context API for global state. Use useReducer for complex state",
          priority: "medium",
          example: `const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}`,
          checks: [
            "Context providers have stable values",
            "Custom hooks for context consumption",
            "Context scoped appropriately",
            "Complex state uses useReducer"
          ]
        },

        errorHandling: {
          rule: "Implement error boundaries",
          description: "Error boundaries to catch errors and display fallback UI",
          priority: "medium",
          example: `class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}`,
          checks: [
            "Error boundaries wrap component trees",
            "Fallback UI is user-friendly",
            "Errors logged for debugging",
            "Error boundaries don't catch all errors"
          ]
        },

        codeStructure: {
          rule: "Component composition and reusability",
          description: "Small focused components. Use composition over inheritance",
          priority: "high",
          example: `function Button({ children, variant = 'primary', ...props }) {
  return (
    <button 
      className={\`btn btn-\${variant}\`} 
      {...props}
    >
      {children}
    </button>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </header>
        <main className="modal-body">{children}</main>
      </div>
    </div>
  );
}`,
          checks: [
            "Components have single responsibility",
            "Props properly typed",
            "Components composable and reusable",
            "Consistent naming conventions"
          ]
        },

        testing: {
          rule: "Test components with React Testing Library",
          description: "Focus on user behavior. Test components as users interact with them",
          priority: "medium",
          example: `import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('user can search for products', async () => {
  const user = userEvent.setup();
  render(<ProductSearch />);
  
  const searchInput = screen.getByRole('textbox', { name: /search products/i });
  const searchButton = screen.getByRole('button', { name: /search/i });
  
  await user.type(searchInput, 'laptop');
  await user.click(searchButton);
  
  await waitFor(() => {
    expect(screen.getByText(/search results for "laptop"/i)).toBeInTheDocument();
  });
});`,
          checks: [
            "Tests use React Testing Library",
            "Tests focus on user interactions",
            "Accessibility queries used",
            "Async behavior properly tested"
          ]
        },

        react19Features: {
          rule: "Leverage React 19 features",
          description: "Server Components, use() hook, and useOptimistic for better performance",
          priority: "medium",
          example: `async function ProductList() {
  const products = await fetchProducts();
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

'use client';
function TodoList({ todos, onAddTodo }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }]
  );

  const handleAdd = async (todo) => {
    addOptimisticTodo(todo);
    await onAddTodo(todo);
  };

  return (
    <ul>
      {optimisticTodos.map(todo => (
        <li key={todo.id} className={todo.pending ? 'pending' : ''}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}`,
          checks: [
            "Server Components for data fetching",
            "Client Components marked with 'use client'",
            "useOptimistic for better UX",
            "use() hook for conditional fetching"
          ]
        },

        accessibilityFirst: {
          rule: "Build with accessibility in mind",
          description: "Keyboard accessible, proper ARIA labels, screen reader support",
          priority: "high",
          example: `function SearchBox({ onSearch, placeholder = "Search..." }) {
  const [query, setQuery] = useState('');
  const searchId = useId();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} role="search">
      <label htmlFor={searchId} className="sr-only">
        Search products
      </label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-describedby={\`\${searchId}-help\`}
      />
      <div id={\`\${searchId}-help\`} className="sr-only">
        Enter keywords to search for products
      </div>
      <button type="submit" aria-label="Search">
        Search
      </button>
    </form>
  );
}`,
          checks: [
            "Interactive elements have labels",
            "Keyboard navigation works",
            "ARIA attributes used appropriately",
            "Color contrast meets WCAG standards"
          ]
        }
      }
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