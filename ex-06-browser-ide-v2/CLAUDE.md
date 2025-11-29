# CLAUDE.md - AI Development Guide for Browser IDE Pro

This document provides comprehensive instructions for AI assistants (like Claude) working on Browser IDE Pro v2.0.

---

## 🎯 Project Overview

**Browser IDE Pro** is a production-ready, VS Code-like IDE that runs entirely in the browser using TypeScript, React, and modern web technologies.

### Core Capabilities
- Multi-LLM support (Claude, GLM-4.6, OpenAI)
- Multi-project management with parallel workflows
- AI chat sessions with message branching
- Git integration (clone, commit, push, branch)
- Code execution via WebContainers
- IndexedDB for local persistence
- PWA with offline support

### Technology Stack
- **Language:** TypeScript 5.3+
- **Package Manager:** pnpm 8.14+
- **Framework:** React 18.2+
- **Build Tool:** Vite 5.0+
- **State:** Zustand 4.4+
- **Database:** Dexie 3.2+ (IndexedDB)
- **Editor:** Monaco Editor
- **Runtime:** WebContainers API

---

## 📁 Architecture Overview

```
Browser IDE Pro
├── UI Layer (React + TypeScript)
│   ├── Components (src/components/)
│   ├── Hooks (src/hooks/)
│   └── Styles (Tailwind CSS)
│
├── State Management (Zustand)
│   ├── Project Store
│   ├── Editor Store
│   ├── AI Store
│   └── Settings Store
│
├── Business Logic (Services)
│   ├── AI Providers (Multi-LLM abstraction)
│   ├── File System (LightningFS)
│   ├── Git (isomorphic-git)
│   └── WebContainer (Code execution)
│
└── Data Layer (Dexie/IndexedDB)
    ├── Projects Table
    ├── Sessions Table
    ├── Messages Table
    └── Settings Table
```

---

## 🔧 Development Guidelines

### 1. Type Safety

**Always use TypeScript with strict types:**

```typescript
// ✅ GOOD - Explicit types
interface ProjectProps {
  project: Project;
  onSelect: (id: string) => void;
}

export function ProjectCard({ project, onSelect }: ProjectProps) {
  return <div onClick={() => onSelect(project.id)}>{project.name}</div>;
}

// ❌ BAD - No types
export function ProjectCard({ project, onSelect }) {
  return <div onClick={() => onSelect(project.id)}>{project.name}</div>;
}
```

### 2. State Management

**Use Zustand stores for global state:**

```typescript
// ✅ GOOD - Zustand store
export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProjectId: null,
  
  setActiveProject: (id: string) => set({ activeProjectId: id }),
  
  addProject: (project: Project) => set((state) => ({
    projects: [...state.projects, project],
  })),
}));

// Use in components
function MyComponent() {
  const { projects, addProject } = useProjectStore();
  // ...
}
```

### 3. Database Operations

**Use Dexie for IndexedDB access:**

```typescript
// ✅ GOOD - Type-safe database operations
import { db } from '@/lib/database';

async function saveProject(project: Project) {
  try {
    const id = await db.addProject(project);
    console.log('✅ Project saved:', id);
    return { success: true, id };
  } catch (error) {
    console.error('❌ Failed to save project:', error);
    return { success: false, error };
  }
}
```

### 4. Service Layer

**Keep business logic in services:**

```typescript
// ✅ GOOD - Service handles API calls
// src/services/ai-providers.ts
export class AnthropicProvider implements LLMProvider {
  async complete(messages, config, onChunk) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      // API call logic
    });
    return this.parseResponse(response);
  }
}

// Component just uses the service
function ChatComponent() {
  const handleSend = async (message: string) => {
    const result = await aiRegistry.complete('anthropic', messages, config);
    // Handle result
  };
}
```

### 5. Error Handling

**Always handle errors gracefully:**

```typescript
// ✅ GOOD - Comprehensive error handling
async function cloneRepository(url: string, token: string) {
  try {
    const result = await gitService.clone(url, token);
    
    if (!result.success) {
      toast.error(`Clone failed: ${result.error}`);
      return;
    }
    
    toast.success('Repository cloned successfully');
    return result.data;
    
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error('An unexpected error occurred');
  }
}
```

---

## 🎨 UI Development

### Component Structure

```typescript
// Component template
interface MyComponentProps {
  title: string;
  onAction: () => void;
  className?: string;
}

export function MyComponent({ title, onAction, className }: MyComponentProps) {
  // Hooks first
  const [state, setState] = useState<string>('');
  const store = useMyStore();
  
  // Event handlers
  const handleClick = () => {
    // Logic
    onAction();
  };
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Render
  return (
    <div className={clsx('my-component', className)}>
      <h2>{title}</h2>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}
```

### Styling

**Use Tailwind CSS utility classes:**

```typescript
// ✅ GOOD - Tailwind classes
<div className="flex items-center gap-2 p-4 bg-gray-900 rounded-lg">
  <Icon className="w-5 h-5 text-blue-400" />
  <span className="text-sm font-medium text-gray-100">Title</span>
</div>

// Use clsx for conditional classes
<div className={clsx(
  'button',
  variant === 'primary' && 'bg-blue-500',
  variant === 'danger' && 'bg-red-500',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
```

---

## 🔌 Adding New Features

### Adding a New LLM Provider

**Step 1: Define Provider Class**

```typescript
// src/services/ai-providers.ts
export class MyProvider implements LLMProvider {
  id = 'myprovider';
  name = 'My Provider';
  
  async complete(
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<APIResponse<AIMessage>> {
    // Implement API call
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });
    
    // Parse and return
    const data = await response.json();
    return {
      success: true,
      data: {
        id: data.id,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
        model: config.model,
        parentId: null,
      },
    };
  }
  
  async validateConfig(config: AIProviderConfig): Promise<boolean> {
    // Test API key
    try {
      const response = await fetch(`${config.baseUrl}/test`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

**Step 2: Register Provider**

```typescript
// src/services/ai-providers.ts
export const aiRegistry = new AIProviderRegistry();
aiRegistry.register('myprovider', new MyProvider());
```

**Step 3: Update Types**

```typescript
// src/types/index.ts
export type AIProvider = 'anthropic' | 'glm' | 'openai' | 'myprovider';

export const AI_PROVIDERS = {
  // ...existing providers
  myprovider: {
    name: 'My Provider',
    baseUrl: 'https://api.myprovider.com',
    models: ['model-1', 'model-2'],
  },
} as const;
```

**Step 4: Add UI**

```typescript
// src/components/settings/AIProviderSettings.tsx
<select value={provider} onChange={(e) => setProvider(e.target.value)}>
  <option value="anthropic">Anthropic Claude</option>
  <option value="glm">Z.ai GLM</option>
  <option value="openai">OpenAI</option>
  <option value="myprovider">My Provider</option>
</select>
```

### Adding a New Component

**1. Create Component File**

```bash
# Create component directory
mkdir -p src/components/myfeature

# Create component file
touch src/components/myfeature/MyFeature.tsx
```

**2. Implement Component**

```typescript
// src/components/myfeature/MyFeature.tsx
import { useState } from 'react';
import type { MyFeatureProps } from '@/types';

export function MyFeature({ data, onSave }: MyFeatureProps) {
  const [state, setState] = useState('');
  
  return (
    <div className="my-feature">
      {/* Implementation */}
    </div>
  );
}
```

**3. Export from Index**

```typescript
// src/components/myfeature/index.ts
export { MyFeature } from './MyFeature';
```

**4. Use in Parent**

```typescript
// src/App.tsx
import { MyFeature } from '@/components/myfeature';

export function App() {
  return (
    <div>
      <MyFeature data={data} onSave={handleSave} />
    </div>
  );
}
```

---

## 🗄️ Database Patterns

### Creating a New Table

**1. Define Type**

```typescript
// src/types/index.ts
export interface MyData {
  id: string;
  name: string;
  createdAt: number;
}

export interface DBMyData extends MyData {
  // Additional DB fields
}
```

**2. Add to Database Schema**

```typescript
// src/lib/database.ts
export class BrowserIDEDatabase extends Dexie {
  myData!: Table<DBMyData, string>;
  
  constructor() {
    super('BrowserIDEDatabase');
    
    this.version(2).stores({
      // Existing tables...
      myData: 'id, name, createdAt',
    });
  }
  
  // Add methods
  async getMyData(id: string): Promise<MyData | undefined> {
    return this.myData.get(id);
  }
  
  async addMyData(data: MyData): Promise<string> {
    return this.myData.add(data);
  }
}
```

### Using Database in Components

```typescript
// Use useLiveQuery for reactive queries
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';

function MyComponent() {
  const projects = useLiveQuery(
    () => db.getAllProjects(),
    []  // Dependencies
  );
  
  if (!projects) return <div>Loading...</div>;
  
  return (
    <div>
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </div>
  );
}
```

---

## 🧪 Testing Guidelines

### Unit Tests (Coming Soon)

```typescript
// ✅ GOOD - Test structure
describe('AIProviderRegistry', () => {
  it('should register and retrieve providers', () => {
    const registry = new AIProviderRegistry();
    const provider = new AnthropicProvider();
    
    registry.register('anthropic', provider);
    const retrieved = registry.get('anthropic');
    
    expect(retrieved).toBe(provider);
  });
  
  it('should return undefined for unknown providers', () => {
    const registry = new AIProviderRegistry();
    const result = registry.get('unknown' as AIProvider);
    
    expect(result).toBeUndefined();
  });
});
```

---

## 🐛 Debugging

### Debug Logging

```typescript
// Use console groups for clarity
console.group('🔍 Project Loading');
console.log('Project ID:', projectId);
console.log('Loading from database...');
const project = await db.getProject(projectId);
console.log('Project loaded:', project);
console.groupEnd();

// Use time for performance
console.time('Clone Repository');
await gitService.clone(url, token);
console.timeEnd('Clone Repository');
```

### React DevTools

- Install React DevTools extension
- Use Components tab to inspect props/state
- Use Profiler to find performance issues

### IndexedDB Inspector

- Open DevTools → Application → IndexedDB
- Inspect tables and data
- Clear data for testing

---

## 📝 Code Review Checklist

Before committing code, ensure:

- [ ] **TypeScript:** No `any` types, all interfaces defined
- [ ] **Errors:** All async operations have try/catch
- [ ] **State:** Using Zustand stores appropriately
- [ ] **Database:** Using Dexie correctly
- [ ] **Services:** Business logic in service layer
- [ ] **Components:** Props typed, handlers implemented
- [ ] **Styling:** Using Tailwind classes
- [ ] **Imports:** Using `@/` path aliases
- [ ] **Logging:** Meaningful console messages
- [ ] **Comments:** Complex logic explained
- [ ] **Formatting:** Code formatted with Prettier
- [ ] **Linting:** No ESLint errors

---

## 🚀 Deployment Checklist

Before deploying:

- [ ] **Build:** `pnpm build` completes successfully
- [ ] **Types:** `pnpm type-check` passes
- [ ] **Lint:** `pnpm lint` passes
- [ ] **Test:** Manual testing complete
- [ ] **PWA:** Manifest and icons configured
- [ ] **Headers:** COOP/COEP headers set
- [ ] **Environment:** API keys in settings (not code)
- [ ] **Git:** All changes committed
- [ ] **Docs:** README and CLAUDE.md updated
- [ ] **Version:** package.json version bumped

---

## 🎓 Learning Resources

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### React
- [React Docs](https://react.dev/)
- [React Hooks Reference](https://react.dev/reference/react)

### Zustand
- [Zustand Docs](https://github.com/pmndrs/zustand)

### Dexie
- [Dexie Tutorial](https://dexie.org/docs/Tutorial)
- [Dexie React Hooks](https://dexie.org/docs/dexie-react-hooks/useLiveQuery())

### pnpm
- [pnpm Docs](https://pnpm.io/)

---

## 💡 Common Patterns

### Loading States

```typescript
function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchData();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, []);
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  if (!data) return <Empty />;
  
  return <DataDisplay data={data} />;
}
```

### Form Handling

```typescript
function MyForm() {
  const [values, setValues] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validate(values);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    await saveData(values);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      {errors.name && <span className="error">{errors.name}</span>}
      {/* More fields */}
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 📞 Getting Help

If you're stuck:

1. **Check types:** TypeScript errors often reveal issues
2. **Console logs:** Add strategic logging
3. **DevTools:** Use React/Redux DevTools
4. **Documentation:** Check this file and README
5. **GitHub Issues:** Search existing issues
6. **Ask:** Create new issue with details

---

**This is a living document. Update it as the project evolves!**

*Last Updated: November 2024*
*Version: 2.0.0*
