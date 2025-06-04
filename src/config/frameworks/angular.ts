import type { ContextRules } from '../rules.js';

export const angularRules: Partial<ContextRules> = {
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
      generateComponent: true,
      useStandalone: true,
      generateModule: false,
      useSignals: true,
      useTypeScript: true,
      componentNamingConvention: 'PascalCase',
      implementationRules: {
        standaloneComponents: {
          rule: "Use standalone components by default",
          description: "Standalone components reduce complexity and improve tree-shaking",
          priority: "critical",
          example: `import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div class="user-card">
      <h3>{{ user().name }}</h3>
      <p>{{ user().email }}</p>
      <button (click)="onEdit.emit(user().id)">Edit</button>
    </div>
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCardComponent {
  user = input.required<User>();
  onEdit = output<number>();
}`,
          checks: [
            "Components marked as standalone: true",
            "Explicit imports in imports array",
            "OnPush change detection strategy",
            "No NgModule dependencies"
          ]
        },

        signalsFirst: {
          rule: "Use Signals for reactive state",
          description: "Signals over traditional reactive patterns for better performance",
          priority: "critical",
          example: `import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: \`
    <div>
      <p>Count: {{ count() }}</p>
      <p>Double: {{ doubleCount() }}</p>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
    </div>
  \`
})
export class CounterComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  constructor() {
    effect(() => {
      console.log('Count changed to:', this.count());
    });
  }

  increment() {
    this.count.update(value => value + 1);
  }

  decrement() {
    this.count.update(value => value - 1);
  }
}`,
          checks: [
            "State managed with signal()",
            "Derived state uses computed()",
            "Side effects use effect()",
            "State updates use .set() or .update()"
          ]
        },

        dependencyInjection: {
          rule: "Use inject() function over constructor injection",
          description: "inject() function provides cleaner dependency injection",
          priority: "high",
          example: `import { Component, inject } from '@angular/core';
import { UserService } from './user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  standalone: true,
  template: \`
    <div>
      @for (user of users(); track user.id) {
        <app-user-card [user]="user" (edit)="editUser($event)" />
      }
    </div>
  \`
})
export class UserListComponent {
  private userService = inject(UserService);
  private router = inject(Router);

  users = this.userService.users;

  editUser(userId: number) {
    this.router.navigate(['/users', userId, 'edit']);
  }
}`,
          checks: [
            "Dependencies injected with inject()",
            "No constructor injection",
            "Clean class property declarations",
            "Works in functional contexts"
          ]
        },

        modernTemplates: {
          rule: "Use modern template syntax",
          description: "New control flow syntax (@if, @for, @switch) and input/output functions",
          priority: "high",
          example: `@Component({
  selector: 'app-product-list',
  standalone: true,
  template: \`
    <div>
      @if (loading()) {
        <div class="loading">Loading products...</div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else {
        @for (product of products(); track product.id) {
          <div class="product">
            <h3>{{ product.name }}</h3>
            <p>{{ product.price | currency }}</p>
          </div>
        } @empty {
          <div class="empty">No products found</div>
        }
      }
    </div>
  \`
})
export class ProductListComponent {
  products = input<Product[]>([]);
  loading = input(false);
  error = input<string | null>(null);
}`,
          checks: [
            "@if/@else instead of *ngIf",
            "@for instead of *ngFor with track",
            "@switch instead of [ngSwitch]",
            "input()/output() functions for component API"
          ]
        },

        onPushStrategy: {
          rule: "Use OnPush change detection",
          description: "OnPush strategy improves performance with Signals",
          priority: "high",
          example: `import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="profile">
      <h2>{{ user().name }}</h2>
      <p>{{ user().email }}</p>
      <button (click)="updateProfile()">Update</button>
    </div>
  \`
})
export class UserProfileComponent {
  user = signal<User>({ name: '', email: '' });

  updateProfile() {
    this.user.update(current => ({
      ...current,
      name: 'Updated Name'
    }));
  }
}`,
          checks: [
            "ChangeDetectionStrategy.OnPush used",
            "Signals enable local change detection",
            "No manual change detection triggers needed",
            "Better performance with large component trees"
          ]
        },

        typeScriptFirst: {
          rule: "Strict TypeScript configuration",
          description: "Strict TypeScript settings and proper typing for better code quality",
          priority: "high",
          example: `interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <input formControlName="name" placeholder="Name" />
      <input formControlName="email" placeholder="Email" />
      <button type="submit" [disabled]="userForm.invalid">Save</button>
    </form>
  \`
})
export class UserFormComponent {
  userForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });

  constructor(private fb: FormBuilder) {}

  onSubmit(): void {
    if (this.userForm.valid) {
      const user: Partial<User> = this.userForm.value;
      this.saveUser(user);
    }
  }

  private saveUser(user: Partial<User>): void {
    // Type-safe user saving
  }
}`,
          checks: [
            "Strict TypeScript configuration enabled",
            "Interfaces defined for data structures",
            "Method return types specified",
            "Type assertions avoided"
          ]
        },

        reactiveforms: {
          rule: "Use Reactive Forms with proper typing",
          description: "Reactive Forms provide better type safety and easier testing",
          priority: "medium",
          example: `import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface LoginForm {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
      <input 
        formControlName="email" 
        type="email" 
        placeholder="Email"
        required 
      />
      <input 
        formControlName="password" 
        type="password" 
        placeholder="Password"
        required 
      />
      <button 
        type="submit" 
        [disabled]="loginForm.invalid || isSubmitting()"
      >
        {{ isSubmitting() ? 'Logging in...' : 'Login' }}
      </button>
    </form>
  \`
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  
  isSubmitting = signal(false);
  
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onLogin() {
    if (this.loginForm.valid) {
      this.isSubmitting.set(true);
      try {
        const credentials = this.loginForm.value as LoginForm;
        await this.authService.login(credentials);
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }
}`,
          checks: [
            "FormBuilder used for form creation",
            "Validators applied appropriately",
            "Form state properly typed",
            "Signals used for UI state"
          ]
        },

        testing: {
          rule: "Write testable components",
          description: "Structure components for easy testing with proper mocking",
          priority: "medium",
          example: `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';
import { UserService } from './user.service';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers']);

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('should display users when loaded', () => {
    const mockUsers = [
      { id: 1, name: 'John', email: 'john@example.com' }
    ];
    userService.getUsers.and.returnValue(of(mockUsers));

    fixture.detectChanges();

    expect(component.users().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('John');
  });
});`,
          checks: [
            "Components standalone for easier testing",
            "Dependencies properly mocked",
            "Tests focus on component behavior",
            "Signals make testing predictable"
          ]
        },

        errorHandling: {
          rule: "Implement proper error handling",
          description: "Global error handling and user-friendly error messages",
          priority: "medium",
          example: `@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private errorSubject = new Subject<string>();
  public error$ = this.errorSubject.asObservable();

  handleError(error: Error): void {
    console.error('Application error:', error);
    
    const message = this.getUserFriendlyMessage(error);
    this.errorSubject.next(message);
    
    this.reportError(error);
  }

  private getUserFriendlyMessage(error: Error): string {
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection.';
    }
    return 'Something went wrong. Please try again.';
  }

  private reportError(error: Error): void {
    // Send to error reporting service
  }
}`,
          checks: [
            "Global error handling service",
            "User-friendly error messages",
            "Error reporting to external services",
            "Component-level error display"
          ]
        },

        accessibilityFirst: {
          rule: "Build accessible components",
          description: "Screen readers, keyboard navigation, and WCAG guidelines",
          priority: "high",
          example: `@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <div class="search-container" role="search">
      <label [for]="searchId" class="sr-only">
        Search products
      </label>
      <input
        [id]="searchId"
        [formControl]="searchControl"
        type="search"
        [placeholder]="placeholder()"
        [attr.aria-describedby]="helpId"
        [attr.aria-expanded]="showSuggestions()"
        [attr.aria-owns]="showSuggestions() ? suggestionsId : null"
        autocomplete="off"
      />
      <div [id]="helpId" class="sr-only">
        Enter keywords to search for products
      </div>
      
      @if (showSuggestions()) {
        <ul 
          [id]="suggestionsId"
          class="suggestions"
          role="listbox"
          [attr.aria-label]="'Search suggestions'"
        >
          @for (suggestion of suggestions(); track suggestion.id) {
            <li 
              role="option"
              [attr.aria-selected]="selectedIndex() === $index"
              (click)="selectSuggestion(suggestion)"
              [class.selected]="selectedIndex() === $index"
            >
              {{ suggestion.name }}
            </li>
          }
        </ul>
      }
    </div>
  \`
})
export class SearchBoxComponent {
  searchControl = new FormControl('');
  placeholder = input('Search...');
  
  suggestions = signal<Suggestion[]>([]);
  showSuggestions = signal(false);
  selectedIndex = signal(-1);
  
  searchId = \`search-\${Math.random().toString(36).substr(2, 9)}\`;
  helpId = \`\${this.searchId}-help\`;
  suggestionsId = \`\${this.searchId}-suggestions\`;

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.navigateSuggestions(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigateSuggestions(-1);
        break;
      case 'Enter':
        event.preventDefault();
        this.selectCurrentSuggestion();
        break;
      case 'Escape':
        this.showSuggestions.set(false);
        break;
    }
  }

  private navigateSuggestions(direction: number) {
    const current = this.selectedIndex();
    const max = this.suggestions().length - 1;
    const next = Math.max(-1, Math.min(max, current + direction));
    this.selectedIndex.set(next);
  }
}`,
          checks: [
            "Interactive elements have labels",
            "ARIA attributes used appropriately",
            "Keyboard navigation implemented",
            "Screen reader support provided"
          ]
        }
      }
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