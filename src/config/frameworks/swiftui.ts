import type { ContextRules } from '../rules.js';

export const swiftuiRules: Partial<ContextRules> = {
  aiOptimization: {
    enableCSSGeneration: false, // SwiftUI uses modifiers, not CSS
    enableSemanticAnalysis: true,
    enableAccessibilityInfo: true,
    enableResponsiveBreakpoints: true, // For adaptive layouts
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
      generateSvelteComponent: false,
      useTypeScript: false,
      useStores: false,
      componentNamingConvention: 'PascalCase'
    },
    html: {
      generateSemanticHTML: false,
      useCSS: false,
      useTailwindCSS: false,
      generateAccessibleMarkup: false,
      useModernCSS: false
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
      generateFormViews: true,
      implementationRules: {
        modernStateManagement: {
          rule: "Use modern state management patterns",
          description: "Leverage @State, @Binding, @ObservableObject, and @Environment for reactive UI. Use the new Observation framework for iOS 17+",
          priority: "critical",
          example: `// ✅ Good: Modern state management
struct ContentView: View {
    @State private var counter = 0
    @StateObject private var viewModel = ViewModel()
    @Environment(\\.dismiss) private var dismiss
    
    var body: some View {
        VStack {
            Text("Count: \\(counter)")
            Button("Increment") {
                counter += 1
                viewModel.updateData()
            }
        }
    }
}

// iOS 17+ with Observation framework
@Observable
class ViewModel {
    var data: [Item] = []
    
    func updateData() {
        // Automatic UI updates with @Observable
    }
}`,
          checks: [
            "✓ @State for local view state",
            "✓ @StateObject for view model ownership",
            "✓ @ObservedObject for shared view models",
            "✓ @Environment for dependency injection",
            "✓ Use @Observable for iOS 17+ projects"
          ]
        },

        mvvmArchitecture: {
          rule: "Implement MVVM architecture",
          description: "Structure apps using Model-View-ViewModel pattern for separation of concerns and testability",
          priority: "high",
          example: `// ✅ Good: MVVM Structure
// Model
struct User: Identifiable, Codable {
    let id: UUID
    let name: String
    let email: String
}

// ViewModel
@MainActor
class UserListViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let userService: UserServiceProtocol
    
    init(userService: UserServiceProtocol = UserService()) {
        self.userService = userService
    }
    
    func loadUsers() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            users = try await userService.fetchUsers()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// View
struct UserListView: View {
    @StateObject private var viewModel = UserListViewModel()
    
    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading {
                    ProgressView("Loading users...")
                } else {
                    List(viewModel.users) { user in
                        UserRow(user: user)
                    }
                }
            }
            .navigationTitle("Users")
            .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
        .task {
            await viewModel.loadUsers()
        }
    }
}`,
          checks: [
            "✓ Clear separation between Model, View, and ViewModel",
            "✓ ViewModels marked with @MainActor for UI updates",
            "✓ Protocol-based dependency injection",
            "✓ Proper error handling and loading states"
          ]
        },

        accessibilityFirst: {
          rule: "Build accessibility into every component",
          description: "Ensure all UI elements are accessible with proper labels, hints, and navigation. Support VoiceOver, Dynamic Type, and other assistive technologies",
          priority: "critical",
          example: `// ✅ Good: Accessible SwiftUI components
struct AccessibleButton: View {
    let title: String
    let action: () -> Void
    let isDestructive: Bool
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .foregroundColor(isDestructive ? .white : .primary)
                .padding()
                .background(isDestructive ? Color.red : Color.blue)
                .cornerRadius(8)
        }
        .accessibilityLabel(title)
        .accessibilityHint(isDestructive ? "This action cannot be undone" : "")
        .accessibilityAction(named: "Double tap to \\(title.lowercased())") {
            action()
        }
    }
}

struct AccessibleForm: View {
    @State private var name = ""
    @State private var age = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("Full Name", text: $name)
                        .accessibilityLabel("Full name input field")
                        .textContentType(.name)
                    
                    TextField("Age", text: $age)
                        .accessibilityLabel("Age input field")
                        .keyboardType(.numberPad)
                } header: {
                    Text("Personal Information")
                } footer: {
                    Text("This information helps us personalize your experience")
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel("Form description: This information helps us personalize your experience")
                }
            }
            .navigationTitle("Profile")
            .navigationBarAccessibilityHeading()
        }
    }
}`,
          checks: [
            "✓ All interactive elements have accessibility labels",
            "✓ Form fields have proper content types",
            "✓ Navigation uses accessibility headings",
            "✓ Custom actions for complex gestures",
            "✓ Meaningful hints for destructive actions"
          ]
        },

        performanceOptimization: {
          rule: "Optimize for performance and memory",
          description: "Use lazy loading, efficient data binding, and proper view lifecycle management for smooth 60fps performance",
          priority: "high",
          example: `// ✅ Good: Performance optimized views
struct OptimizedListView: View {
    let items: [Item]
    
    var body: some View {
        LazyVStack(spacing: 8) {
            ForEach(items) { item in
                ItemRow(item: item)
                    .id(item.id) // Explicit ID for view recycling
            }
        }
        .drawingGroup() // Flatten into single texture for complex views
    }
}

struct ItemRow: View {
    let item: Item
    
    var body: some View {
        HStack {
            AsyncImage(url: item.imageURL) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .redacted(reason: .placeholder)
            }
            .frame(width: 60, height: 60)
            .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .font(.headline)
                    .lineLimit(1)
                
                Text(item.subtitle)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            Spacer()
            
            Text(item.price, format: .currency(code: "USD"))
                .font(.title2)
                .fontWeight(.semibold)
        }
        .padding(.horizontal)
        .contentShape(Rectangle()) // Expand touch area
        .onTapGesture {
            // Handle tap
        }
    }
}

// Performance monitoring
struct PerformanceMonitoredView<Content: View>: View {
    let content: Content
    @State private var renderTime: TimeInterval = 0
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .onAppear {
                let startTime = CFAbsoluteTimeGetCurrent()
                DispatchQueue.main.async {
                    renderTime = CFAbsoluteTimeGetCurrent() - startTime
                    if renderTime > 0.016 { // > 16ms (60fps)
                        print("⚠️ Slow render: \\(renderTime * 1000)ms")
                    }
                }
            }
    }
}`,
          checks: [
            "✓ LazyVStack/LazyHStack for large lists",
            "✓ AsyncImage for network images",
            "✓ Explicit IDs for ForEach performance",
            "✓ drawingGroup() for complex static content",
            "✓ Performance monitoring for slow renders"
          ]
        },

        modernAsyncPatterns: {
          rule: "Use modern async/await patterns",
          description: "Leverage Swift's async/await with proper error handling and cancellation support",
          priority: "high",
          example: `// ✅ Good: Modern async patterns
@MainActor
class DataManager: ObservableObject {
    @Published var data: [DataItem] = []
    @Published var isLoading = false
    
    private var loadTask: Task<Void, Never>?
    
    func loadData() {
        // Cancel previous task
        loadTask?.cancel()
        
        loadTask = Task {
            isLoading = true
            defer { isLoading = false }
            
            do {
                let fetchedData = try await fetchDataFromAPI()
                
                // Check for cancellation
                try Task.checkCancellation()
                
                await MainActor.run {
                    self.data = fetchedData
                }
            } catch is CancellationError {
                print("Data loading cancelled")
            } catch {
                print("Error loading data: \\(error)")
            }
        }
    }
    
    func cancelLoading() {
        loadTask?.cancel()
    }
    
    private func fetchDataFromAPI() async throws -> [DataItem] {
        let url = URL(string: "https://api.example.com/data")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode([DataItem].self, from: data)
    }
}

struct AsyncContentView: View {
    @StateObject private var dataManager = DataManager()
    
    var body: some View {
        NavigationView {
            Group {
                if dataManager.isLoading {
                    ProgressView("Loading...")
                } else {
                    List(dataManager.data) { item in
                        Text(item.title)
                    }
                }
            }
            .navigationTitle("Data")
            .refreshable {
                await dataManager.loadData()
            }
        }
        .task {
            await dataManager.loadData()
        }
        .onDisappear {
            dataManager.cancelLoading()
        }
    }
}`,
          checks: [
            "✓ @MainActor for UI-related classes",
            "✓ Task cancellation support",
            "✓ Proper error handling with do-catch",
            "✓ Task.checkCancellation() for long operations",
            "✓ Use .task and .refreshable modifiers"
          ]
        },

        nativeIntegration: {
          rule: "Leverage native iOS capabilities",
          description: "Use SF Symbols, native colors, haptics, and system services for authentic iOS experience",
          priority: "medium",
          example: `// ✅ Good: Native iOS integration
struct NativeIntegratedView: View {
    @State private var showingAlert = false
    
    var body: some View {
        VStack(spacing: 20) {
            // SF Symbols with proper sizing
            Image(systemName: "heart.fill")
                .font(.system(size: 50))
                .foregroundStyle(.red.gradient)
                .symbolEffect(.bounce)
            
            // Native button with haptics
            Button("Favorite") {
                // Haptic feedback
                let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
                impactFeedback.impactOccurred()
                
                showingAlert = true
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            
            // Native color usage
            Text("System colors adapt to appearance")
                .foregroundColor(.primary)
                .padding()
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
        .alert("Added to Favorites", isPresented: $showingAlert) {
            Button("OK") { }
        }
        // Native background materials
        .background(.ultraThinMaterial)
    }
}

// Widget integration
struct WidgetEntryView: View {
    let entry: TimelineEntry
    
    var body: some View {
        VStack {
            Text(entry.date, style: .time)
                .font(.largeTitle)
            Text("Last updated")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .widgetBackground(.clear)
    }
}`,
          checks: [
            "✓ SF Symbols for consistent iconography",
            "✓ System colors for automatic theming",
            "✓ Native materials and backgrounds",
            "✓ Haptic feedback for interactions",
            "✓ Widget and extension support"
          ]
        },

        testingStrategy: {
          rule: "Implement comprehensive testing",
          description: "Use Preview providers, unit tests, and UI tests for reliable SwiftUI development",
          priority: "medium",
          example: `// ✅ Good: Testing strategy
// Preview providers with different states
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Default state
            ContentView()
                .previewDisplayName("Default")
            
            // Loading state
            ContentView()
                .environment(\\.isLoading, true)
                .previewDisplayName("Loading")
            
            // Error state
            ContentView()
                .environment(\\.errorMessage, "Network error occurred")
                .previewDisplayName("Error")
            
            // Dark mode
            ContentView()
                .preferredColorScheme(.dark)
                .previewDisplayName("Dark Mode")
            
            // Different screen sizes
            ContentView()
                .previewDevice("iPhone SE (3rd generation)")
                .previewDisplayName("Small Screen")
            
            ContentView()
                .previewDevice("iPhone 15 Pro Max")
                .previewDisplayName("Large Screen")
        }
    }
}

// Unit testing view models
class UserViewModelTests: XCTestCase {
    var viewModel: UserViewModel!
    var mockService: MockUserService!
    
    override func setUp() {
        super.setUp()
        mockService = MockUserService()
        viewModel = UserViewModel(userService: mockService)
    }
    
    @MainActor
    func testLoadUsers() async {
        // Given
        let expectedUsers = [User(id: UUID(), name: "Test", email: "test@example.com")]
        mockService.usersToReturn = expectedUsers
        
        // When
        await viewModel.loadUsers()
        
        // Then
        XCTAssertEqual(viewModel.users.count, 1)
        XCTAssertEqual(viewModel.users.first?.name, "Test")
        XCTAssertFalse(viewModel.isLoading)
    }
}

// UI Testing
class ContentViewUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUp() {
        super.setUp()
        app = XCUIApplication()
        app.launch()
    }
    
    func testUserCanAddItem() {
        // Given
        let addButton = app.buttons["Add Item"]
        let itemTextField = app.textFields["Item Name"]
        
        // When
        addButton.tap()
        itemTextField.tap()
        itemTextField.typeText("Test Item")
        app.buttons["Save"].tap()
        
        // Then
        XCTAssertTrue(app.staticTexts["Test Item"].exists)
    }
}`,
          checks: [
            "✓ Preview providers for all component states",
            "✓ Unit tests for view models and business logic",
            "✓ UI tests for critical user flows",
            "✓ Accessibility testing with VoiceOver",
            "✓ Performance testing for smooth animations"
          ]
        }
      }
    },
    uikit: {
      generateViewControllers: false,
      useStoryboards: false,
      useProgrammaticLayout: false,
      useAutoLayout: false,
      generateXIBFiles: false,
      useStackViews: false,
      generateConstraints: false,
      useSwiftUIInterop: false,
      componentNamingConvention: 'PascalCase',
      generateDelegatePatterns: false,
      useModernConcurrency: false,
      generateAccessibilitySupport: false
    },
    electron: {
      generateMainProcess: false,
      generateRendererProcess: false,
      useIPC: false,
      useWebSecurity: false,
      generateMenus: false,
      useNativeDialogs: false,
      generateUpdater: false,
      useContextIsolation: false,
      componentNamingConvention: 'camelCase',
      generateNotifications: false,
      useCrashReporter: false,
      generateTrayIcon: false,
      useProtocolHandlers: false
    },
    tauri: {
      generateRustBackend: false,
      generateWebFrontend: false,
      useSystemWebView: false,
      generateCommands: false,
      useEventSystem: false,
      generatePlugins: false,
      useSidecar: false,
      componentNamingConvention: 'snake_case',
      generateUpdater: false,
      useFilesystem: false,
      generateNotifications: false,
      useSystemTray: false,
      generateMenus: false
    },
    nwjs: {
      generateNodeBackend: false,
      generateWebFrontend: false,
      useChromiumAPI: false,
      generateMenus: false,
      useNativeModules: false,
      generateManifest: false,
      useClipboard: false,
      componentNamingConvention: 'camelCase',
      generateFileAccess: false,
      useShell: false,
      generateScreenCapture: false,
      useTrayIcon: false
    }
  }
}; 