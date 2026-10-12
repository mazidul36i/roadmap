import type { LessonBody } from "@content/types";

export const springIoc: LessonBody = {
  id: "spring-ioc",
  blocks: [
    {
      type: "md",
      md: `Spring's container creates your objects (**beans**), wires their dependencies, and wraps some of them in **proxies** that add behaviour like transactions, caching and security. Understanding that last part explains half of all "why doesn't my annotation work?" bugs.`,
    },
    {
      type: "steps",
      title: "Bean lifecycle",
      items: [
        { title: "Instantiate", md: "Constructor called (constructor injection resolves dependencies here)." },
        { title: "Populate", md: "Field/setter injection, then `*Aware` callbacks." },
        { title: "BeanPostProcessor (before)", md: "Hooks run before initialisation." },
        { title: "Initialise", md: "`@PostConstruct`, then `afterPropertiesSet()`, then a custom init method." },
        { title: "BeanPostProcessor (after)", md: "**Proxies are created here**: the bean you receive may be a wrapper." },
        { title: "Destroy", md: "`@PreDestroy` on context shutdown (singletons only)." },
      ],
    },
    {
      type: "code",
      lang: "java",
      title: "Prefer constructor injection",
      code: `@Service
public class CheckoutService {
    private final PaymentGateway payments;      // final, testable, no reflection needed
    private final InventoryClient inventory;

    public CheckoutService(PaymentGateway payments, InventoryClient inventory) {
        this.payments = payments;
        this.inventory = inventory;
    }
}`,
    },
    {
      type: "callout",
      tone: "warning",
      title: "The self-invocation trap",
      md: "Annotations like `@Transactional`, `@Async` and `@Cacheable` work because callers go through the proxy. A call from one method to another **inside the same class** uses `this`, skipping the proxy, so the annotation silently does nothing.",
    },
    {
      type: "compare",
      title: "Scopes",
      headers: ["Scope", "Instances", "Note"],
      rows: [
        ["singleton (default)", "One per container", "Must be thread-safe: no mutable request state in fields"],
        ["prototype", "New per injection/lookup", "Spring doesn't manage its destruction"],
        ["request / session", "Per HTTP request/session", "Injected into singletons via a scoped proxy"],
      ],
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Mutable fields in singleton beans shared across requests",
        "Circular dependencies hidden by field injection",
        "Calling @Transactional/@Async methods from the same class",
        "Injecting a prototype into a singleton and expecting a new instance each time",
      ],
    },
    { type: "quiz", ids: ["ioc-q1", "ioc-q2"] },
  ],
  quiz: [
    {
      id: "ioc-q1",
      prompt: "methodA() calls this.methodB(), which is @Transactional(propagation = REQUIRES_NEW). What happens?",
      choices: ["A new transaction starts", "The annotation is ignored: the call bypasses the proxy", "Spring throws an exception", "It runs asynchronously"],
      answer: 1,
      explanation: "Self-invocation doesn't go through the proxy. Move methodB to another bean or inject the proxy.",
    },
    {
      id: "ioc-q2",
      prompt: "Why prefer constructor injection?",
      choices: [
        "It's faster at runtime",
        "Dependencies can be final, are required, and the class is testable without Spring",
        "Field injection is deprecated",
        "It avoids proxies",
      ],
      answer: 1,
      explanation: "It also makes circular dependencies fail fast.",
    },
  ],
  cards: [
    { id: "ioc-c1", front: "When are Spring AOP proxies created?", back: "In BeanPostProcessor after-initialisation." },
    {
      id: "ioc-c2",
      front: "Self-invocation problem?",
      back: "Calling a proxied method via `this` bypasses the proxy, so @Transactional/@Async/@Cacheable don't apply.",
    },
    { id: "ioc-c3", front: "Default bean scope and its implication?", back: "Singleton: one shared instance, so it must be thread-safe." },
    { id: "ioc-c4", front: "JDK dynamic proxy vs CGLIB?", back: "JDK proxies implement interfaces; CGLIB subclasses the class (Spring Boot's default)." },
  ],
};

export const springBoot: LessonBody = {
  id: "spring-boot",
  blocks: [
    {
      type: "md",
      md: `Spring Boot's magic is just **conditional configuration**. Each auto-configuration class declares beans guarded by conditions like "only if this class is on the classpath" and "only if you haven't defined one yourself". Add a starter, and the matching auto-configuration switches on.`,
    },
    {
      type: "code",
      lang: "java",
      title: "How an auto-configuration backs off",
      code: `@AutoConfiguration
@ConditionalOnClass(DataSource.class)                  // only when JDBC is present
public class MyDataSourceAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean                          // your own DataSource wins
    DataSource dataSource(DataSourceProperties props) {
        return props.initializeDataSourceBuilder().build();
    }
}
// registered in META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`,
    },
    {
      type: "compare",
      title: "Configuration precedence (highest first, abridged)",
      headers: ["Source", "Example"],
      rows: [
        ["Command-line arguments", "--server.port=9090"],
        ["Environment variables", "SERVER_PORT=9090"],
        ["Profile-specific files", "application-prod.yml"],
        ["application.yml / .properties", "server.port: 8080"],
        ["Defaults in code", "@ConfigurationProperties defaults"],
      ],
    },
    {
      type: "callout",
      tone: "tip",
      title: "See what was auto-configured",
      md: "Run with `--debug` (or check `/actuator/conditions`) to get the conditions report: which auto-configurations matched and why the others didn't.",
    },
    {
      type: "code",
      lang: "yaml",
      title: "Production-ready Actuator basics",
      code: `management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true        # /actuator/health/liveness and /readiness for Kubernetes`,
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Exposing all actuator endpoints publicly",
        "Secrets in application.yml committed to git",
        "Fighting auto-configuration instead of defining your own bean (which makes it back off)",
        "@ComponentScan picking up test or unrelated packages",
      ],
    },
    { type: "quiz", ids: ["boot-q1", "boot-q2"] },
  ],
  quiz: [
    {
      id: "boot-q1",
      prompt: "You define your own ObjectMapper bean. What happens to Boot's default one?",
      choices: ["Both exist and conflict", "Boot's backs off due to @ConditionalOnMissingBean", "Startup fails", "Yours is ignored"],
      answer: 1,
      explanation: "Most auto-configured beans are guarded so user definitions win.",
    },
    {
      id: "boot-q2",
      prompt: "@SpringBootApplication combines which annotations?",
      choices: [
        "@Configuration, @EnableAutoConfiguration, @ComponentScan",
        "@Service, @Repository, @Controller",
        "@EnableWebMvc, @EnableJpa",
        "@Bean, @Primary",
      ],
      answer: 0,
      explanation: "Configuration class + auto-configuration + component scanning from its package.",
    },
  ],
  cards: [
    {
      id: "boot-c1",
      front: "How does Spring Boot auto-configuration work?",
      back: "Conditional @Configuration classes (@ConditionalOnClass/OnMissingBean/OnProperty) listed in AutoConfiguration.imports.",
    },
    { id: "boot-c2", front: "@SpringBootApplication = ?", back: "@Configuration + @EnableAutoConfiguration + @ComponentScan." },
    { id: "boot-c3", front: "How to see why an auto-config did or didn't apply?", back: "--debug conditions report or /actuator/conditions." },
    { id: "boot-c4", front: "Kubernetes probes in Boot?", back: "management.endpoint.health.probes.enabled → /actuator/health/liveness and /readiness." },
  ],
};

export const springTransactions: LessonBody = {
  id: "spring-transactions",
  blocks: [
    {
      type: "md",
      md: `\`@Transactional\` opens a transaction before your method and commits or rolls back after it, via a proxy. Two settings control almost everything: **propagation** (what to do if a transaction already exists) and **rollback rules** (which exceptions undo the work).`,
    },
    {
      type: "compare",
      title: "Propagation",
      headers: ["Setting", "If a transaction exists", "If none exists"],
      rows: [
        ["REQUIRED (default)", "Join it", "Start one"],
        ["REQUIRES_NEW", "Suspend it, start a new one", "Start one"],
        ["NESTED", "Savepoint inside it", "Start one"],
        ["SUPPORTS", "Join it", "Run without"],
        ["MANDATORY", "Join it", "Throw"],
        ["NOT_SUPPORTED / NEVER", "Suspend / throw", "Run without"],
      ],
    },
    {
      type: "callout",
      tone: "warning",
      title: "Checked exceptions commit by default",
      md: "Spring rolls back on `RuntimeException` and `Error` only. A checked exception (like `IOException`) **commits** the transaction unless you say `@Transactional(rollbackFor = Exception.class)`.",
    },
    {
      type: "code",
      lang: "java",
      title: "Audit log that survives a rollback",
      code: `@Service
class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)   // independent transaction
    public void record(String event) { auditRepository.save(new AuditEntry(event)); }
}

@Service
class TransferService {
    @Transactional
    public void transfer(Transfer t) {
        audit.record("transfer attempted");   // commits even if the transfer below fails
        ledger.debit(t.from(), t.amount());
        ledger.credit(t.to(), t.amount());
    }
}`,
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "Self-invocation: calling a @Transactional method from the same class",
        "@Transactional on private methods (not proxied)",
        "Catching an exception inside the method so the proxy never sees it (and commits)",
        "Long transactions that call remote services while holding a DB connection",
        "`UnexpectedRollbackException` when an inner REQUIRED call marked the shared transaction rollback-only",
      ],
    },
    { type: "quiz", ids: ["tx-q1", "tx-q2"] },
  ],
  quiz: [
    {
      id: "tx-q1",
      prompt: "A @Transactional method throws a checked IOException. By default…",
      choices: ["The transaction rolls back", "The transaction commits", "Spring retries", "It depends on the database"],
      answer: 1,
      explanation: "Default rollback rules cover only unchecked exceptions and errors.",
    },
    {
      id: "tx-q2",
      prompt: "You need an audit row saved even if the outer business transaction rolls back. Use…",
      choices: ["REQUIRED", "REQUIRES_NEW on the audit method in another bean", "NESTED", "SUPPORTS"],
      answer: 1,
      explanation: "REQUIRES_NEW runs in an independent transaction (and must be called through a proxy).",
    },
  ],
  cards: [
    { id: "tx-c1", front: "Default propagation?", back: "REQUIRED: join an existing transaction or start one." },
    { id: "tx-c2", front: "Default rollback rule?", back: "Unchecked exceptions and Errors roll back; checked exceptions commit unless rollbackFor." },
    { id: "tx-c3", front: "REQUIRES_NEW vs NESTED?", back: "REQUIRES_NEW: independent transaction (outer suspended). NESTED: savepoint inside the outer one." },
    { id: "tx-c4", front: "Why might @Transactional silently do nothing?", back: "Self-invocation, private method, or the bean isn't Spring-managed." },
  ],
};

export const springJpa: LessonBody = {
  id: "spring-jpa",
  blocks: [
    {
      type: "md",
      md: `JPA hides SQL, which is great until it quietly runs 101 queries for one page. Know the **persistence context** (a per-transaction identity map and first-level cache), entity states, and how fetching works, and you'll avoid the classic traps.`,
    },
    {
      type: "code",
      lang: "java",
      title: "The N+1 query problem",
      code: `// 1 query for authors + N queries, one per author, for their books
List<Author> authors = authorRepository.findAll();
authors.forEach(a -> a.getBooks().size());          // lazy collection initialised per author

// Fix: fetch in one query
@Query("select distinct a from Author a join fetch a.books")
List<Author> findAllWithBooks();

// Or declaratively
@EntityGraph(attributePaths = "books")
List<Author> findByCountry(String country);`,
    },
    {
      type: "compare",
      title: "Entity states",
      headers: ["State", "Meaning"],
      rows: [
        ["Transient", "new Author(): not tracked"],
        ["Managed", "Tracked by the persistence context; changes are flushed automatically (dirty checking)"],
        ["Detached", "Was managed, the context closed; changes aren't tracked"],
        ["Removed", "Scheduled for deletion on flush"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Dirty checking",
      md: "Inside a transaction you don't need `save()` for managed entities: change a field and Hibernate writes an UPDATE at flush. That's also why loading thousands of entities just to read them is costly; use read-only queries or DTO projections.",
    },
    {
      type: "callout",
      tone: "tip",
      title: "Optimistic locking",
      md: "Add `@Version private long version;` and concurrent updates of the same row fail with `OptimisticLockException` instead of silently overwriting each other.",
    },
    {
      type: "checklist",
      title: "Pitfalls",
      items: [
        "`LazyInitializationException` from touching lazy fields outside a transaction",
        "Leaving `spring.jpa.open-in-view` on, which holds connections for the whole web request",
        "`join fetch` with pagination (Hibernate paginates in memory and warns)",
        "equals/hashCode based on a generated id that's null before persist",
        "`FetchType.EAGER` everywhere as a 'fix'",
      ],
    },
    { type: "quiz", ids: ["jpa-q1", "jpa-q2", "jpa-q3"] },
  ],
  quiz: [
    {
      id: "jpa-q1",
      prompt: "Listing 100 orders with their lazy customer runs 101 queries. Name and fix?",
      choices: ["Cartesian product; use a Set", "N+1 queries; join fetch or @EntityGraph", "Cache miss; add Redis", "Deadlock; reorder updates"],
      answer: 1,
      explanation: "Fetch the association in the same query.",
    },
    {
      id: "jpa-q2",
      prompt: "Inside a @Transactional method you change a field on a loaded entity and never call save(). What happens?",
      choices: ["Nothing is saved", "An UPDATE is issued at flush (dirty checking)", "An exception is thrown", "A new row is inserted"],
      answer: 1,
      explanation: "Managed entities are compared with their snapshot at flush.",
    },
    {
      id: "jpa-q3",
      prompt: "What does @Version provide?",
      choices: ["Schema migrations", "Optimistic locking against lost updates", "Auditing timestamps", "Soft deletes"],
      answer: 1,
      explanation: "The UPDATE includes the version in its WHERE clause; a mismatch throws OptimisticLockException.",
    },
  ],
  cards: [
    {
      id: "jpa-c1",
      front: "N+1 fixes in Spring Data JPA?",
      back: "join fetch, @EntityGraph, batch fetching (@BatchSize / default_batch_fetch_size), or DTO projections.",
    },
    { id: "jpa-c2", front: "Persistence context?", back: "Per-transaction identity map + first-level cache that tracks managed entities for dirty checking." },
    { id: "jpa-c3", front: "LazyInitializationException cause?", back: "Accessing a lazy association after the persistence context (transaction) closed." },
    { id: "jpa-c4", front: "Why disable open-in-view?", back: "It holds a DB connection for the whole HTTP request and hides lazy-loading problems." },
    { id: "jpa-c5", front: "Optimistic locking in JPA?", back: "@Version field; conflicting updates throw OptimisticLockException." },
  ],
};

export const javaSolid: LessonBody = {
  id: "java-solid",
  blocks: [
    {
      type: "md",
      md: `SOLID is a vocabulary for **change**: each principle reduces how much code you must touch, and how much can break, when requirements move. In interviews, show it with a small example rather than reciting definitions.`,
    },
    {
      type: "compare",
      title: "SOLID in one line each",
      headers: ["Principle", "Means", "Smell when broken"],
      rows: [
        ["Single responsibility", "One reason to change", "A class touched by every feature"],
        ["Open/closed", "Extend behaviour without editing stable code", "Growing switch statements on type"],
        ["Liskov substitution", "Subtypes honour the parent's contract", "Overrides that throw UnsupportedOperationException"],
        ["Interface segregation", "Small, focused interfaces", "Implementations with empty methods"],
        ["Dependency inversion", "Depend on abstractions, inject concretions", "new-ing infrastructure inside business logic"],
      ],
    },
    {
      type: "code",
      lang: "java",
      title: "Open/closed with the Strategy pattern",
      code: `public sealed interface DiscountPolicy permits NoDiscount, Percentage, BuyXGetY {
    Money apply(Cart cart);
}
record Percentage(int pct) implements DiscountPolicy {
    public Money apply(Cart cart) { return cart.total().times(100 - pct).dividedBy(100); }
}
// Adding a new policy adds a class; checkout code doesn't change.`,
    },
    {
      type: "compare",
      title: "Patterns you'll actually use",
      headers: ["Pattern", "Use it for", "In Spring/Java"],
      rows: [
        ["Strategy", "Swappable algorithms", "Injecting a List<Handler> and picking one"],
        ["Builder", "Objects with many optional fields", "Lombok @Builder, records with withers"],
        ["Factory", "Hiding which implementation is created", "@Bean methods"],
        ["Decorator", "Adding behaviour around an object", "Spring AOP proxies, InputStream wrappers"],
        ["Observer", "Reacting to events", "ApplicationEventPublisher, @EventListener"],
        ["Template method", "Fixed algorithm, variable steps", "JdbcTemplate, AbstractRoutingDataSource"],
      ],
    },
    {
      type: "callout",
      tone: "insight",
      title: "Composition over inheritance",
      md: "Inheritance couples you to a parent's implementation. Composing small collaborators (and injecting them) keeps classes testable and changeable. Reach for `extends` mainly for genuine is-a relationships.",
    },
    { type: "quiz", ids: ["solid-q1", "solid-q2"] },
  ],
  quiz: [
    {
      id: "solid-q1",
      prompt: "A Square extends Rectangle and overrides setWidth to also set height, breaking callers. Which principle?",
      choices: ["Single responsibility", "Liskov substitution", "Interface segregation", "Open/closed"],
      answer: 1,
      explanation: "Code written for Rectangle can't rely on independent width and height for a Square.",
    },
    {
      id: "solid-q2",
      prompt: "A growing `switch (paymentType)` in checkout is a smell for which principle?",
      choices: ["Open/closed (use strategies)", "Dependency inversion", "Liskov", "None"],
      answer: 0,
      explanation: "Every new type edits stable code; polymorphic strategies avoid that.",
    },
  ],
  cards: [
    { id: "solid-c1", front: "SOLID?", back: "Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion." },
    {
      id: "solid-c2",
      front: "Classic Liskov violation?",
      back: "Square extends Rectangle with coupled width/height; or overrides that throw UnsupportedOperationException.",
    },
    { id: "solid-c3", front: "Decorator in Spring?", back: "AOP proxies wrapping beans (transactions, caching, security)." },
    { id: "solid-c4", front: "Composition over inheritance: why?", back: "Looser coupling, easier testing, behaviour swappable at runtime." },
  ],
};
