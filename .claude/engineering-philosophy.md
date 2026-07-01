# Engineering Philosophy

This document defines how we write code in this project. When in doubt, refer back to these principles.

## Core Philosophy: Linus Torvalds Approach

> "Talk is cheap. Show me the code." - Linus Torvalds

**Working code first, always.** Perfect code that doesn't exist is worthless. Shipping is the feature.

### Guiding Principles
1. **Simple solutions beat clever ones** - If you can't explain it in one sentence, it's too complex
2. **Code should be obvious** - The next person (or future you) should understand it immediately
3. **Solve the problem in front of you** - Not the hypothetical problem you might have later
4. **Delete code aggressively** - The best code is no code

## Good Taste vs Bad Taste

### Bad Taste: Over-Abstraction

```typescript
// ❌ BAD: Premature abstraction, factory pattern for 2 implementations
interface MessageFormatterFactory {
  createFormatter(type: MessageType): IMessageFormatter;
}

class MessageFormatterFactoryImpl implements MessageFormatterFactory {
  createFormatter(type: MessageType): IMessageFormatter {
    switch(type) {
      case 'user': return new UserMessageFormatter();
      case 'assistant': return new AssistantMessageFormatter();
    }
  }
}

// Using it requires mental gymnastics
const factory = new MessageFormatterFactoryImpl();
const formatter = factory.createFormatter('user');
const message = formatter.format(text);
```

### Good Taste: Simple and Obvious

```typescript
// ✅ GOOD: Direct, obvious, easy to modify
function formatMessage(text: string, type: 'user' | 'assistant'): string {
  if (type === 'user') {
    return `User: ${text}`;
  }
  return `Assistant: ${text}`;
}

// Or even simpler if rendering:
<div className={type === 'user' ? 'user-message' : 'assistant-message'}>
  {text}
</div>
```

### Bad Taste: Clever Logic

```typescript
// ❌ BAD: Clever but confusing
const isValid = !!(data?.items?.length && data.items.every(i => i.status !== 'error'));
```

### Good Taste: Explicit Logic

```typescript
// ✅ GOOD: Obvious what's happening
if (!data?.items || data.items.length === 0) {
  return false;
}

const hasErrors = data.items.some(item => item.status === 'error');
return !hasErrors;
```

### Bad Taste: Premature DRY

```typescript
// ❌ BAD: Abstracting two slightly different things
function handleDataUpdate(data: Data, options: UpdateOptions) {
  // 50 lines of code trying to handle both cases
  if (options.type === 'tree') {
    // Different logic
  } else if (options.type === 'node') {
    // Different logic
  }
}
```

### Good Taste: Separate Until Patterns Emerge

```typescript
// ✅ GOOD: Two clear functions, easy to understand and modify
function handleTreeUpdate(tree: Tree) {
  // 10 lines of tree-specific logic
}

function handleNodeUpdate(node: Node) {
  // 10 lines of node-specific logic
}

// If they TRULY become identical later, THEN refactor
```

## Performance: Measure First

**Never optimize without measuring.** Your intuition is wrong.

### Performance Rules
1. **Make it work** - Get correct behavior first
2. **Make it obvious** - Optimize for reading, not cleverness
3. **Measure it** - Use browser DevTools, React Profiler
4. **Fix critical path only** - 80% of slowness is in 20% of code

### What to Actually Optimize
- **API calls**: Cache, dedupe, batch
- **Re-renders**: React.memo only when profiler shows it matters
- **Database queries**: N+1 problems, missing indexes
- **Bundle size**: Code splitting, lazy loading

### What NOT to Optimize
- Micro-optimizations (map vs forEach)
- Premature memoization
- Clever algorithms when simple works fine
- Anything you haven't measured

```typescript
// ❌ BAD: Premature optimization
const memoizedValue = useMemo(() => data.filter(x => x.active), [data]);

// ✅ GOOD: Simple until proven slow
const activeItems = data.filter(x => x.active);

// ✅ BETTER: Add optimization AFTER profiling shows it's slow
// Added because React Profiler showed 200ms render time
const activeItems = useMemo(() => data.filter(x => x.active), [data]);
```

## TypeScript Rules

### 1. No 'any' Without TODO

```typescript
// ❌ BAD
function process(data: any) {
  return data.value;
}

// ✅ GOOD: Specific types
function process(data: { value: string }) {
  return data.value;
}

// ✅ ACCEPTABLE: When type is truly unknown, document why
function process(data: any) { // TODO: Type this after API contract is finalized
  return data.value;
}
```

### 2. Async Always for IPC/API Calls

All database calls, API calls, and inter-process communication must be async. No fake synchronous wrappers.

```typescript
// ❌ BAD: Hiding async behavior
function getUser(id: string): User {
  return supabase.from('users').select().eq('id', id).single(); // This is actually async!
}

// ✅ GOOD: Explicit async
async function getUser(id: string): Promise<User> {
  const { data } = await supabase.from('users').select().eq('id', id).single();
  return data;
}
```

### 3. Union Types Over Enums

```typescript
// ❌ BAD: Enum overhead
enum Status {
  Pending = 'pending',
  Done = 'done'
}

// ✅ GOOD: Literal union types
type Status = 'pending' | 'done';
```

### 4. Type Narrowing, Not Casting

```typescript
// ❌ BAD: Forcing types
const user = data as User;

// ✅ GOOD: Check and narrow
if (!data || typeof data !== 'object' || !('id' in data)) {
  throw new Error('Invalid user data');
}
const user = data as User; // Now safe
```

## Debug-First Development

**Console.log everywhere in development.** Comment out for production, don't delete.

```typescript
async function enrichNode(nodeId: string) {
  console.log('[enrichNode] Starting:', nodeId);

  const node = await getNode(nodeId);
  console.log('[enrichNode] Node data:', node);

  if (!node.papers) {
    console.log('[enrichNode] Fetching papers for:', nodeId);
    const papers = await fetchPapers(node);
    console.log('[enrichNode] Found papers:', papers.length);

    // Process papers...
  }

  console.log('[enrichNode] Complete:', nodeId);
  return node;
}

// In production, use a simple flag
const DEBUG = false;
const log = DEBUG ? console.log : () => {};

async function enrichNode(nodeId: string) {
  log('[enrichNode] Starting:', nodeId);
  // ... rest of code
}
```

### Why Console.log?
- **Fast**: Faster than debugger for most bugs
- **Context**: See execution flow and values
- **Async-friendly**: Works with async/await
- **Permanent**: Keep logs, just disable them
- **Prefix everything**: `[functionName]` makes logs searchable

## Decision Framework

Before writing any code, ask these questions in order:

### 1. Is It Needed Now?
- **NO**: Delete the task, move on
- **YES**: Continue to #2

### 2. Can We Hardcode It?
- **YES**: Hardcode it, ship it
- **NO**: Continue to #3

### 3. What's the Simplest Solution?
- One function? Do that.
- Duplication? That's okay until you have 3+ copies.
- Complex abstraction? You probably don't need it.

### 4. Will This Be Obvious in 6 Months?
- **NO**: Simplify or add comments
- **YES**: Ship it

### Example: Adding Search Filters

```typescript
// Question 1: Is it needed now?
// User wants to filter by status only, not date/author/etc.

// Question 2: Can we hardcode it?
// Yes! We only have 3 statuses.

// ✅ Simple solution:
function filterByStatus(items: Item[], status: 'pending' | 'done' | 'error') {
  return items.filter(item => item.status === status);
}

// ❌ Over-engineered "future-proof" solution:
interface FilterStrategy<T> {
  apply(items: T[]): T[];
}

class StatusFilterStrategy implements FilterStrategy<Item> {
  constructor(private status: string) {}
  apply(items: Item[]): Item[] {
    return items.filter(item => item.status === this.status);
  }
}

class FilterEngine<T> {
  private strategies: FilterStrategy<T>[] = [];

  addStrategy(strategy: FilterStrategy<T>) {
    this.strategies.push(strategy);
  }

  execute(items: T[]): T[] {
    return this.strategies.reduce((acc, strategy) => strategy.apply(acc), items);
  }
}

// Stop. Go back. Choose the simple solution.
```

## Anti-Patterns to Avoid

### 1. Factories Until Needed
Don't create factories, builders, or abstract factories until you have 3+ concrete implementations that share behavior.

### 2. Premature Abstractions
Write the same code twice. On the third time, consider abstracting. Not before.

### 3. Wrapper Mania
Don't wrap libraries "just in case we switch." You won't switch. Use the library directly.

```typescript
// ❌ BAD: Wrapping axios "in case we switch"
class HttpClient {
  async get(url: string) { return axios.get(url); }
  async post(url: string, data: any) { return axios.post(url, data); }
}

// ✅ GOOD: Just use axios
import axios from 'axios';
const response = await axios.get(url);

// Switch if/when you actually need to, not speculatively
```

### 4. Configuration Over Convention
Hardcode first. Configure when you have 3+ different values.

```typescript
// ❌ BAD: Config for one value
const config = {
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 5000,
    retries: 3
  }
};

// ✅ GOOD: Hardcode until you need variety
const API_BASE = 'https://api.example.com';
const response = await fetch(`${API_BASE}/users`);
```

### 5. Nested Ternaries
If you need more than one ternary, use if/else.

```typescript
// ❌ BAD
const message = status === 'pending' ? 'Loading...' : status === 'error' ? 'Failed' : 'Done';

// ✅ GOOD
let message = 'Done';
if (status === 'pending') message = 'Loading...';
if (status === 'error') message = 'Failed';

// ✅ ALSO GOOD: Object lookup for many cases
const messages = {
  pending: 'Loading...',
  error: 'Failed',
  done: 'Done'
};
const message = messages[status];
```

### 6. Clever Variable Names
Use boring, explicit names.

```typescript
// ❌ BAD
const usr = await getUsr();
const proc = await procData(usr);

// ✅ GOOD
const user = await getUser();
const processedData = await processUserData(user);
```

## Quick Decision Guide

When writing code, choose:

| Situation | Choose This | Not This |
|-----------|------------|----------|
| **Working vs Perfect** | Working | Perfect |
| **Simple vs Clever** | Simple | Clever |
| **Duplication vs Abstraction** | Duplication (until 3rd copy) | Premature abstraction |
| **Today vs Tomorrow** | Today | Tomorrow |
| **Obvious vs Terse** | Obvious | Terse |
| **Explicit vs Implicit** | Explicit | Implicit |
| **Boring vs Exciting** | Boring | Exciting |
| **Delete vs Keep** | Delete | Keep "just in case" |

## Code Review Checklist

Before committing, ask yourself:

- [ ] Does this solve the actual problem?
- [ ] Can I explain this in one sentence?
- [ ] Will this be obvious in 6 months?
- [ ] Did I add any abstractions? Do I have 3+ use cases?
- [ ] Did I optimize anything? Did I measure first?
- [ ] Are there any `any` types without TODOs?
- [ ] Did I add console.logs for debugging?
- [ ] Can I delete any code?

## Remember

**Good code is boring code.** If your code is exciting, you're probably doing it wrong.

**Working code today beats perfect code tomorrow.** Ship it.

**Simple code that works beats clever code that impresses.** Nobody is impressed.

**The best code is no code.** Delete aggressively.

---

*When in doubt, ask: "What would Linus do?"*

*Answer: Write the simplest thing that works, ship it, optimize later if needed.*
