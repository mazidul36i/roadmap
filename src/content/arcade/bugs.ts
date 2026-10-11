// Spot the Bug: Java snippets with exactly one buggy line.

export interface BugItem {
  id: string;
  title: string;
  lines: string[];
  /** 0-based index of the buggy line. */
  bug: number;
  /** Other lines that are also fair answers (where the fix would go). */
  accept?: number[];
  explanation: string;
  track: "java" | "dsa";
}

const code = (s: string) => s.split("\n");

export const BUG_ITEMS: BugItem[] = [
  {
    id: "bug-1",
    title: "Binary search",
    track: "dsa",
    lines: code(`int search(int[] a, int x) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}`),
    bug: 3,
    explanation: "lo + hi can overflow int for very large arrays. Use lo + (hi - lo) / 2 or (lo + hi) >>> 1.",
  },
  {
    id: "bug-2",
    title: "Sum an array",
    track: "java",
    lines: code(`int sum(int[] a) {
    int total = 0;
    for (int i = 0; i <= a.length; i++)
        total += a[i];
    return total;
}`),
    bug: 2,
    explanation: "i <= a.length reads one past the end and throws ArrayIndexOutOfBoundsException. Use <.",
  },
  {
    id: "bug-3",
    title: "Compare names",
    track: "java",
    lines: code(`boolean sameUser(User a, User b) {
    String x = a.getName();
    String y = b.getName();
    return x == y;
}`),
    bug: 3,
    explanation: "== compares references. Use x.equals(y) (or Objects.equals for nulls).",
  },
  {
    id: "bug-4",
    title: "Boxed comparison",
    track: "java",
    lines: code(`Map<String, Integer> stock = loadStock();
Integer a = stock.get("apples");   // 1000
Integer b = stock.get("pears");    // 1000
if (a == b) {
    log("same stock level");
}`),
    bug: 3,
    explanation: "Integer == compares references; only -128..127 are cached, so 1000 == 1000 is false. Use equals or unbox.",
  },
  {
    id: "bug-5",
    title: "Remove empty strings",
    track: "java",
    lines: code(`List<String> names = new ArrayList<>(input);
for (String s : names) {
    if (s.isBlank()) {
        names.remove(s);
    }
}`),
    bug: 3,
    explanation: "Modifying a list while iterating it with for-each throws ConcurrentModificationException. Use names.removeIf(String::isBlank).",
  },
  {
    id: "bug-6",
    title: "Lazy singleton",
    track: "java",
    lines: code(`class Config {
    private static Config instance;
    static Config get() {
        if (instance == null) {
            synchronized (Config.class) {
                if (instance == null) instance = new Config();
            }
        }
        return instance;
    }
}`),
    bug: 1,
    explanation: "Double-checked locking needs the field to be volatile; otherwise another thread can see a partially constructed object.",
  },
  {
    id: "bug-7",
    title: "Hit counter",
    track: "java",
    lines: code(`class Counter {
    private volatile int hits;
    void record() {
        hits++;
    }
    int get() { return hits; }
}`),
    bug: 3,
    explanation: "volatile gives visibility, not atomicity: hits++ is read-modify-write and loses updates. Use AtomicInteger or LongAdder.",
  },
  {
    id: "bug-8",
    title: "Min-size window",
    track: "dsa",
    lines: code(`int minLen(int[] a, int target) {
    int best = Integer.MAX_VALUE, sum = 0, left = 0;
    for (int right = 0; right < a.length; right++) {
        sum += a[right];
        if (sum >= target) {
            best = Math.min(best, right - left + 1);
            sum -= a[left++];
        }
    }
    return best == Integer.MAX_VALUE ? 0 : best;
}`),
    bug: 4,
    explanation: "The window must shrink as far as possible: use while (sum >= target), not if.",
  },
  {
    id: "bug-9",
    title: "Area of a big grid",
    track: "java",
    lines: code(`long cells(int rows, int cols) {
    // rows and cols can each be up to 100,000
    long total = rows * cols;
    return total;
}`),
    bug: 2,
    explanation: "rows * cols is computed in int and overflows before widening. Cast first: (long) rows * cols.",
  },
  {
    id: "bug-10",
    title: "Average",
    track: "java",
    lines: code(`double average(int[] scores) {
    int sum = 0;
    for (int s : scores) sum += s;
    double avg = sum / scores.length;
    return avg;
}`),
    bug: 3,
    explanation: "int / int truncates before converting to double. Use (double) sum / scores.length.",
  },
  {
    id: "bug-11",
    title: "Add a tag",
    track: "java",
    lines: code(`String[] defaults = {"java", "spring"};
List<String> tags = Arrays.asList(defaults);
tags.add("kafka");
return tags;`),
    bug: 2,
    explanation: "Arrays.asList returns a fixed-size view; add throws UnsupportedOperationException. Wrap it: new ArrayList<>(Arrays.asList(…)).",
  },
  {
    id: "bug-12",
    title: "Factorial",
    track: "dsa",
    lines: code(`long factorial(int n) {
    return n * factorial(n - 1);
}`),
    bug: 1,
    explanation: "No base case: the recursion never stops and throws StackOverflowError. Return 1 when n <= 1.",
  },
  {
    id: "bug-13",
    title: "Transfer money",
    track: "java",
    lines: code(`@Service
class TransferService {
    @Transactional
    private void transfer(Account from, Account to, long cents) {
        from.debit(cents);
        to.credit(cents);
    }
}`),
    bug: 3,
    explanation: "Spring's proxy can't intercept private methods, so @Transactional is silently ignored. Make it public (and call it through the proxy).",
  },
  {
    id: "bug-14",
    title: "Import orders",
    track: "java",
    lines: code(`@Service
class OrderImporter {
    public void importAll(List<Order> orders) {
        for (Order o : orders) this.save(o);
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void save(Order o) { repo.save(o); }
}`),
    bug: 3,
    explanation: "Self-invocation bypasses the Spring proxy, so save() gets no new transaction. Call it via another bean or inject the proxy.",
  },
  {
    id: "bug-15",
    title: "Count and print",
    track: "java",
    lines: code(`Stream<String> active = users.stream()
    .filter(User::isActive)
    .map(User::getName);
long n = active.count();
active.forEach(System.out::println);`),
    bug: 4,
    explanation: "A stream can be consumed only once; the second terminal operation throws IllegalStateException. Collect to a list first.",
  },
  {
    id: "bug-16",
    title: "Sort by score",
    track: "java",
    lines: code(`List<Player> players = load();
players.sort((a, b) -> a.score - b.score);
// scores range over the whole int domain`),
    bug: 1,
    explanation: "Subtraction overflows for large values of opposite sign, giving the wrong order. Use Integer.compare or Comparator.comparingInt.",
  },
  {
    id: "bug-17",
    title: "Drop negatives",
    track: "java",
    lines: code(`List<Integer> nums = new ArrayList<>(input);
for (int i = 0; i < nums.size(); i++) {
    if (nums.get(i) < 0) {
        nums.remove(i);
    }
}`),
    bug: 3,
    explanation: "After removing index i, the next element shifts into i and is skipped. Iterate backwards or use removeIf.",
  },
  {
    id: "bug-18",
    title: "Grid memo",
    track: "dsa",
    lines: code(`Map<int[], Integer> memo = new HashMap<>();
int paths(int r, int c) {
    if (r == 0 || c == 0) return 1;
    int[] key = {r, c};
    if (memo.containsKey(key)) return memo.get(key);
    int v = paths(r - 1, c) + paths(r, c - 1);
    memo.put(key, v);
    return v;
}`),
    bug: 0,
    accept: [3],
    explanation:
      "Arrays use identity equals/hashCode, so a new int[] never matches a stored key and memoisation never hits. Use a record, a long key, or a 2D array.",
  },
  {
    id: "bug-19",
    title: "BFS on a grid",
    track: "dsa",
    lines: code(`Deque<int[]> q = new ArrayDeque<>();
q.add(start);
while (!q.isEmpty()) {
    int[] cur = q.poll();
    seen[cur[0]][cur[1]] = true;
    for (int[] d : DIRS) {
        int r = cur[0] + d[0], c = cur[1] + d[1];
        if (inBounds(r, c) && !seen[r][c]) q.add(new int[]{r, c});
    }
}`),
    bug: 4,
    accept: [7],
    explanation: "Marking cells as seen when polled (not when enqueued) lets the same cell be queued many times, blowing up time and memory. Mark on enqueue.",
  },
  {
    id: "bug-20",
    title: "Find a user",
    track: "java",
    lines: code(`public UserDto find(long id) {
    User user = repo.findById(id).get();
    return UserDto.from(user);
}`),
    bug: 1,
    explanation: "Optional.get() throws NoSuchElementException when the user doesn't exist. Use orElseThrow with a meaningful 404 exception.",
  },
  {
    id: "bug-21",
    title: "Order totals",
    track: "java",
    lines: code(`@Transactional(readOnly = true)
public List<Long> totals() {
    List<Order> orders = orderRepo.findAll();   // items are LAZY
    return orders.stream()
        .map(o -> o.getItems().stream().mapToLong(Item::price).sum())
        .toList();
}`),
    bug: 2,
    accept: [4],
    explanation: "Loading orders, then touching each lazy items collection, fires one query per order (N+1). Fetch items with a join fetch or entity graph.",
  },
];
