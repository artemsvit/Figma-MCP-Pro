import type { ContextRules } from '../rules.js';

export const uikitRules: Partial<ContextRules> = {
  aiOptimization: {
    enableCSSGeneration: false, // UIKit uses programmatic styling
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
      generateViews: false,
      useViewBuilder: false,
      generateModifiers: false,
      useObservableObject: false,
      useStateManagement: false,
      generatePreviewProvider: false,
      useEnvironmentObjects: false,
      componentNamingConvention: 'PascalCase',
      generateSFSymbols: false,
      useNativeColors: false,
      generateAdaptiveLayouts: false,
      useAsyncImage: false,
      generateNavigationViews: false,
      useToolbarModifiers: false,
      generateAnimations: false,
      useGeometryReader: false,
      generateDarkModeSupport: false,
      useTabViews: false,
      generateListViews: false,
      useScrollViews: false,
      generateFormViews: false
    },
    uikit: {
      generateViewControllers: true,
      useStoryboards: false, // Prefer programmatic approach
      useProgrammaticLayout: true,
      useAutoLayout: true,
      generateXIBFiles: false,
      useStackViews: true,
      generateConstraints: true,
      useSwiftUIInterop: true, // Modern UIKit-SwiftUI integration
      componentNamingConvention: 'PascalCase',
      generateDelegatePatterns: true,
      useModernConcurrency: true,
      generateAccessibilitySupport: true,
      implementationRules: {
        modernConcurrency: {
          rule: "Use modern Swift concurrency patterns",
          description: "Leverage async/await, actors, and structured concurrency for better performance and safety",
          priority: "critical",
          example: `// ✅ Good: Modern concurrency in UIKit
@MainActor
class UserViewController: UIViewController {
    @IBOutlet private weak var tableView: UITableView!
    @IBOutlet private weak var loadingIndicator: UIActivityIndicatorView!
    
    private var users: [User] = []
    private let userService: UserServiceProtocol
    
    init(userService: UserServiceProtocol = UserService()) {
        self.userService = userService
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        
        Task {
            await loadUsers()
        }
    }
    
    private func loadUsers() async {
        loadingIndicator.startAnimating()
        defer { loadingIndicator.stopAnimating() }
        
        do {
            let fetchedUsers = try await userService.fetchUsers()
            users = fetchedUsers
            tableView.reloadData()
        } catch {
            await showAlert(title: "Error", message: error.localizedDescription)
        }
    }
    
    private func showAlert(title: String, message: String) async {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}

// Actor for thread-safe data management
actor DataCache {
    private var cache: [String: Any] = [:]
    
    func getValue(for key: String) -> Any? {
        return cache[key]
    }
    
    func setValue(_ value: Any, for key: String) {
        cache[key] = value
    }
}`,
          checks: [
            "✓ @MainActor for UI-related classes",
            "✓ async/await for network operations",
            "✓ Actors for thread-safe data management",
            "✓ Task-based concurrency for async operations",
            "✓ Proper error handling with async throws"
          ]
        },

        programmaticAutoLayout: {
          rule: "Use programmatic Auto Layout with modern patterns",
          description: "Implement layouts programmatically using NSLayoutConstraint, UIStackView, and modern constraint APIs",
          priority: "critical",
          example: `// ✅ Good: Programmatic Auto Layout
class ProfileViewController: UIViewController {
    private lazy var profileImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFill
        imageView.layer.cornerRadius = 50
        imageView.layer.masksToBounds = true
        imageView.backgroundColor = .systemGray4
        imageView.translatesAutoresizingMaskIntoConstraints = false
        return imageView
    }()
    
    private lazy var nameLabel: UILabel = {
        let label = UILabel()
        label.font = .preferredFont(forTextStyle: .largeTitle)
        label.adjustsFontForContentSizeCategory = true
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private lazy var emailLabel: UILabel = {
        let label = UILabel()
        label.font = .preferredFont(forTextStyle: .body)
        label.adjustsFontForContentSizeCategory = true
        label.textColor = .secondaryLabel
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private lazy var infoStackView: UIStackView = {
        let stackView = UIStackView(arrangedSubviews: [nameLabel, emailLabel])
        stackView.axis = .vertical
        stackView.spacing = 8
        stackView.alignment = .leading
        stackView.distribution = .fill
        stackView.translatesAutoresizingMaskIntoConstraints = false
        return stackView
    }()
    
    private lazy var mainStackView: UIStackView = {
        let stackView = UIStackView(arrangedSubviews: [profileImageView, infoStackView])
        stackView.axis = .horizontal
        stackView.spacing = 16
        stackView.alignment = .center
        stackView.distribution = .fill
        stackView.translatesAutoresizingMaskIntoConstraints = false
        return stackView
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupConstraints()
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        view.addSubview(mainStackView)
    }
    
    private func setupConstraints() {
        NSLayoutConstraint.activate([
            // Profile image constraints
            profileImageView.widthAnchor.constraint(equalToConstant: 100),
            profileImageView.heightAnchor.constraint(equalToConstant: 100),
            
            // Main stack view constraints
            mainStackView.topAnchor.constraint(greaterThanOrEqualTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            mainStackView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            mainStackView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            mainStackView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            
            // Info stack view should fill remaining space
            infoStackView.heightAnchor.constraint(greaterThanOrEqualToConstant: 60)
        ])
    }
}`,
          checks: [
            "✓ translatesAutoresizingMaskIntoConstraints = false",
            "✓ UIStackView for organized layouts",
            "✓ NSLayoutConstraint.activate for batch constraints",
            "✓ Safe area layout guides",
            "✓ Dynamic Type support with adjustsFontForContentSizeCategory"
          ]
        },

        swiftuiInteroperation: {
          rule: "Integrate SwiftUI views seamlessly",
          description: "Use UIHostingController and UIViewRepresentable for modern SwiftUI-UIKit interoperability",
          priority: "high",
          example: `// ✅ Good: SwiftUI-UIKit Integration
import SwiftUI

// Hosting SwiftUI in UIKit
class SettingsViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        embedSwiftUIView()
    }
    
    private func embedSwiftUIView() {
        let settingsView = SettingsView { [weak self] action in
            self?.handleSettingsAction(action)
        }
        
        let hostingController = UIHostingController(rootView: settingsView)
        addChild(hostingController)
        view.addSubview(hostingController.view)
        
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            hostingController.view.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        hostingController.didMove(toParent: self)
    }
    
    private func handleSettingsAction(_ action: SettingsAction) {
        switch action {
        case .logout:
            // Handle logout
            break
        case .profile:
            let profileVC = ProfileViewController()
            navigationController?.pushViewController(profileVC, animated: true)
        }
    }
}

// UIKit view in SwiftUI
struct UIKitMapView: UIViewRepresentable {
    @Binding var coordinate: CLLocationCoordinate2D
    
    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        mapView.showsUserLocation = true
        mapView.userTrackingMode = .none
        return mapView
    }
    
    func updateUIView(_ mapView: MKMapView, context: Context) {
        let region = MKCoordinateRegion(center: coordinate, latitudinalMeters: 1000, longitudinalMeters: 1000)
        mapView.setRegion(region, animated: true)
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, MKMapViewDelegate {
        let parent: UIKitMapView
        
        init(_ parent: UIKitMapView) {
            self.parent = parent
        }
        
        func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
            parent.coordinate = mapView.region.center
        }
    }
}`,
          checks: [
            "✓ UIHostingController for SwiftUI in UIKit",
            "✓ UIViewRepresentable for UIKit in SwiftUI",
            "✓ Proper parent-child view controller setup",
            "✓ Coordinator pattern for delegates",
            "✓ Binding for data synchronization"
          ]
        },

        delegateDataSourcePatterns: {
          rule: "Implement delegate and data source patterns efficiently",
          description: "Use proper delegate patterns with weak references and protocol-oriented design",
          priority: "high",
          example: `// ✅ Good: Modern delegate patterns
protocol UserListViewControllerDelegate: AnyObject {
    func userListViewController(_ controller: UserListViewController, didSelectUser user: User)
    func userListViewControllerDidRefresh(_ controller: UserListViewController)
}

class UserListViewController: UIViewController {
    weak var delegate: UserListViewControllerDelegate?
    
    private lazy var tableView: UITableView = {
        let tableView = UITableView(frame: .zero, style: .plain)
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(UserTableViewCell.self, forCellReuseIdentifier: UserTableViewCell.identifier)
        tableView.translatesAutoresizingMaskIntoConstraints = false
        return tableView
    }()
    
    private var users: [User] = []
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupRefreshControl()
    }
    
    private func setupRefreshControl() {
        let refreshControl = UIRefreshControl()
        refreshControl.addTarget(self, action: #selector(refreshData), for: .valueChanged)
        tableView.refreshControl = refreshControl
    }
    
    @objc private func refreshData() {
        delegate?.userListViewControllerDidRefresh(self)
        tableView.refreshControl?.endRefreshing()
    }
    
    func updateUsers(_ users: [User]) {
        self.users = users
        tableView.reloadData()
    }
}

// MARK: - UITableViewDataSource
extension UserListViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return users.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard let cell = tableView.dequeueReusableCell(withIdentifier: UserTableViewCell.identifier, for: indexPath) as? UserTableViewCell else {
            return UITableViewCell()
        }
        
        cell.configure(with: users[indexPath.row])
        return cell
    }
}

// MARK: - UITableViewDelegate
extension UserListViewController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        let user = users[indexPath.row]
        delegate?.userListViewController(self, didSelectUser: user)
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        return UITableView.automaticDimension
    }
    
    func tableView(_ tableView: UITableView, estimatedHeightForRowAt indexPath: IndexPath) -> CGFloat {
        return 80
    }
}

// Custom cell with proper configuration
class UserTableViewCell: UITableViewCell {
    static let identifier = "UserTableViewCell"
    
    private lazy var nameLabel: UILabel = {
        let label = UILabel()
        label.font = .preferredFont(forTextStyle: .headline)
        label.adjustsFontForContentSizeCategory = true
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private lazy var emailLabel: UILabel = {
        let label = UILabel()
        label.font = .preferredFont(forTextStyle: .subheadline)
        label.textColor = .secondaryLabel
        label.adjustsFontForContentSizeCategory = true
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupUI()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setupUI() {
        contentView.addSubview(nameLabel)
        contentView.addSubview(emailLabel)
        
        NSLayoutConstraint.activate([
            nameLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 12),
            nameLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            nameLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            
            emailLabel.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 4),
            emailLabel.leadingAnchor.constraint(equalTo: nameLabel.leadingAnchor),
            emailLabel.trailingAnchor.constraint(equalTo: nameLabel.trailingAnchor),
            emailLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -12)
        ])
    }
    
    func configure(with user: User) {
        nameLabel.text = user.name
        emailLabel.text = user.email
    }
}`,
          checks: [
            "✓ Weak delegate references to prevent retain cycles",
            "✓ Protocol-oriented delegate design",
            "✓ Proper table view cell registration and dequeuing",
            "✓ Extension-based delegate implementation",
            "✓ Dynamic cell height with Auto Layout"
          ]
        },

        accessibilitySupport: {
          rule: "Build comprehensive accessibility support",
          description: "Implement VoiceOver, Dynamic Type, and assistive technology support throughout the app",
          priority: "high",
          example: `// ✅ Good: Comprehensive accessibility
class AccessibleViewController: UIViewController {
    private lazy var headerLabel: UILabel = {
        let label = UILabel()
        label.text = "User Profile"
        label.font = .preferredFont(forTextStyle: .largeTitle)
        label.adjustsFontForContentSizeCategory = true
        label.accessibilityTraits = .header
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private lazy var profileButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Edit Profile", for: .normal)
        button.titleLabel?.font = .preferredFont(forTextStyle: .body)
        button.titleLabel?.adjustsFontForContentSizeCategory = true
        button.backgroundColor = .systemBlue
        button.setTitleColor(.white, for: .normal)
        button.layer.cornerRadius = 8
        
        // Accessibility configuration
        button.accessibilityLabel = "Edit Profile"
        button.accessibilityHint = "Double tap to edit your profile information"
        button.accessibilityTraits = .button
        
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()
    
    private lazy var deleteButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Delete Account", for: .normal)
        button.titleLabel?.font = .preferredFont(forTextStyle: .body)
        button.titleLabel?.adjustsFontForContentSizeCategory = true
        button.backgroundColor = .systemRed
        button.setTitleColor(.white, for: .normal)
        button.layer.cornerRadius = 8
        
        // Accessibility for destructive action
        button.accessibilityLabel = "Delete Account"
        button.accessibilityHint = "Warning: This action cannot be undone. Double tap to delete your account permanently"
        button.accessibilityTraits = [.button, .destructive]
        
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupAccessibility()
        
        // Listen for accessibility notifications
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(contentSizeCategoryDidChange),
            name: UIContentSizeCategory.didChangeNotification,
            object: nil
        )
    }
    
    private func setupAccessibility() {
        // Set up accessibility reading order
        view.accessibilityElements = [headerLabel, profileButton, deleteButton]
        
        // Custom accessibility actions
        let editAction = UIAccessibilityCustomAction(
            name: "Quick Edit Name",
            target: self,
            selector: #selector(quickEditName)
        )
        
        profileButton.accessibilityCustomActions = [editAction]
        
        // Accessibility container
        view.isAccessibilityElement = false
        view.accessibilityContainerType = .semanticGroup
    }
    
    @objc private func contentSizeCategoryDidChange() {
        // Update layout for dynamic type changes
        updateLayoutForContentSize()
    }
    
    @objc private func quickEditName() -> Bool {
        // Implement quick name editing
        presentNameEditAlert()
        return true
    }
    
    private func updateLayoutForContentSize() {
        // Adjust spacing and sizing based on content size category
        let isAccessibilityCategory = UIApplication.shared.preferredContentSizeCategory.isAccessibilityCategory
        
        if isAccessibilityCategory {
            // Increase button height for accessibility
            profileButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 60).isActive = true
            deleteButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 60).isActive = true
        }
    }
    
    private func presentNameEditAlert() {
        let alert = UIAlertController(title: "Edit Name", message: nil, preferredStyle: .alert)
        
        alert.addTextField { textField in
            textField.placeholder = "Enter new name"
            textField.accessibilityLabel = "Name input field"
        }
        
        let saveAction = UIAlertAction(title: "Save", style: .default) { _ in
            // Save logic
        }
        
        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel)
        
        alert.addAction(saveAction)
        alert.addAction(cancelAction)
        
        present(alert, animated: true)
    }
}

// Accessibility-friendly custom control
class AccessibleRatingControl: UIControl {
    private var rating: Int = 0 {
        didSet {
            updateAccessibilityValue()
        }
    }
    
    override var accessibilityTraits: UIAccessibilityTraits {
        get { return [.adjustable, .updatesFrequently] }
        set { }
    }
    
    override var accessibilityLabel: String? {
        get { return "Rating" }
        set { }
    }
    
    override var accessibilityValue: String? {
        get { return "\\(rating) out of 5 stars" }
        set { }
    }
    
    override func accessibilityIncrement() {
        if rating < 5 {
            rating += 1
            sendActions(for: .valueChanged)
        }
    }
    
    override func accessibilityDecrement() {
        if rating > 0 {
            rating -= 1
            sendActions(for: .valueChanged)
        }
    }
    
    private func updateAccessibilityValue() {
        UIAccessibility.post(notification: .layoutChanged, argument: self)
    }
}`,
          checks: [
            "✓ Dynamic Type support with adjustsFontForContentSizeCategory",
            "✓ Proper accessibility traits and labels",
            "✓ Custom accessibility actions for complex controls",
            "✓ Accessibility hints for destructive actions",
            "✓ VoiceOver reading order with accessibilityElements"
          ]
        },

        performanceOptimization: {
          rule: "Optimize performance and memory usage",
          description: "Implement efficient table view management, image loading, and memory management practices",
          priority: "medium",
          example: `// ✅ Good: Performance optimization
class OptimizedTableViewController: UIViewController {
    private lazy var tableView: UITableView = {
        let tableView = UITableView()
        tableView.delegate = self
        tableView.dataSource = self
        tableView.prefetchDataSource = self
        
        // Performance optimizations
        tableView.estimatedRowHeight = 100
        tableView.rowHeight = UITableView.automaticDimension
        tableView.separatorInset = UIEdgeInsets(top: 0, left: 16, bottom: 0, right: 0)
        
        // Register cells
        tableView.register(OptimizedTableViewCell.self, forCellReuseIdentifier: OptimizedTableViewCell.identifier)
        
        tableView.translatesAutoresizingMaskIntoConstraints = false
        return tableView
    }()
    
    private var items: [Item] = []
    private let imageCache = NSCache<NSString, UIImage>()
    private var prefetchTasks: [IndexPath: Task<Void, Never>] = [:]
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupImageCache()
        loadData()
    }
    
    private func setupImageCache() {
        imageCache.countLimit = 100
        imageCache.totalCostLimit = 50 * 1024 * 1024 // 50MB
    }
    
    private func loadData() {
        Task {
            // Simulate data loading
            let newItems = await DataService.shared.fetchItems()
            await MainActor.run {
                self.items = newItems
                self.tableView.reloadData()
            }
        }
    }
}

// MARK: - UITableViewDataSourcePrefetching
extension OptimizedTableViewController: UITableViewDataSourcePrefetching {
    func tableView(_ tableView: UITableView, prefetchRowsAt indexPaths: [IndexPath]) {
        for indexPath in indexPaths {
            guard indexPath.row < items.count else { continue }
            
            let item = items[indexPath.row]
            
            // Cancel any existing prefetch task for this index path
            prefetchTasks[indexPath]?.cancel()
            
            // Start prefetching
            let task = Task {
                await prefetchImage(for: item, at: indexPath)
            }
            
            prefetchTasks[indexPath] = task
        }
    }
    
    func tableView(_ tableView: UITableView, cancelPrefetchingForRowsAt indexPaths: [IndexPath]) {
        for indexPath in indexPaths {
            prefetchTasks[indexPath]?.cancel()
            prefetchTasks.removeValue(forKey: indexPath)
        }
    }
    
    private func prefetchImage(for item: Item, at indexPath: IndexPath) async {
        guard let url = item.imageURL else { return }
        
        let cacheKey = NSString(string: url.absoluteString)
        
        // Check cache first
        if imageCache.object(forKey: cacheKey) != nil {
            return
        }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            
            // Check if task was cancelled
            try Task.checkCancellation()
            
            if let image = UIImage(data: data) {
                await MainActor.run {
                    self.imageCache.setObject(image, forKey: cacheKey)
                    
                    // Update visible cell if still on screen
                    if let cell = self.tableView.cellForRow(at: indexPath) as? OptimizedTableViewCell {
                        cell.updateImage(image)
                    }
                }
            }
        } catch {
            // Handle error (including cancellation)
        }
    }
}

class OptimizedTableViewCell: UITableViewCell {
    static let identifier = "OptimizedTableViewCell"
    
    private lazy var itemImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 8
        imageView.backgroundColor = .systemGray5
        imageView.translatesAutoresizingMaskIntoConstraints = false
        return imageView
    }()
    
    private lazy var titleLabel: UILabel = {
        let label = UILabel()
        label.font = .preferredFont(forTextStyle: .headline)
        label.numberOfLines = 2
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setupUI()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func prepareForReuse() {
        super.prepareForReuse()
        itemImageView.image = nil
        titleLabel.text = nil
    }
    
    func configure(with item: Item, imageCache: NSCache<NSString, UIImage>) {
        titleLabel.text = item.title
        
        // Load image from cache or set placeholder
        if let url = item.imageURL {
            let cacheKey = NSString(string: url.absoluteString)
            if let cachedImage = imageCache.object(forKey: cacheKey) {
                itemImageView.image = cachedImage
            } else {
                itemImageView.image = UIImage(systemName: "photo")
            }
        }
    }
    
    func updateImage(_ image: UIImage) {
        UIView.transition(with: itemImageView, duration: 0.2, options: .transitionCrossDissolve) {
            self.itemImageView.image = image
        }
    }
}`,
          checks: [
            "✓ Table view prefetching for smooth scrolling",
            "✓ NSCache for efficient image caching",
            "✓ Task cancellation for prefetch operations",
            "✓ Proper cell reuse with prepareForReuse",
            "✓ Estimated row heights for performance"
          ]
        }
      }
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