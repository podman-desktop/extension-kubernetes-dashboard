---
name: add-resource
description: >-
  Step-by-step guide for adding a new Kubernetes resource type to the
  dashboard, and a review checklist for PRs that do so. Covers the
  extension backend (resource factory, contexts-manager) and the webview
  (UI type, helper, DI module, List/Details components, routing,
  navigation). Handles namespaced vs. non-namespaced resources and
  grouped resources (multiple kinds in one list page). Triggers when
  adding a new resource kind, reviewing resource-addition PRs, or asking
  how a resource is wired end-to-end.
paths:
  - packages/extension/src/resources/**
  - packages/extension/src/manager/contexts-manager.ts
  - packages/webview/src/component/**
  - packages/webview/src/inject/inversify-binding.ts
  - packages/webview/src/AppWithContext.svelte
  - packages/webview/src/Navigation.svelte
  - packages/webview/src/navigation/navigator.ts
---

# Adding a New Kubernetes Resource

## Quick Decision Guide

Before writing any code answer two questions:

| Question                                                | Answer   | Impact                                              |
| ------------------------------------------------------- | -------- | --------------------------------------------------- |
| Is the resource namespace-scoped?                       | yes / no | Changes factory API paths and signature             |
| Does this resource share a list page with another kind? | yes / no | Changes route structure, transformer, and navigator |

Examples of **namespaced** resources: Pod, Deployment, ConfigMap, Service, Ingress.  
Examples of **non-namespaced** resources: Node, Namespace, PersistentVolume.  
Examples of **grouped** resources: ConfigMap+Secret (`configmapsSecrets`), Ingress+Route (`ingressesRoutes`).

---

## Part 1 — Extension Backend

### 1. Create the resource factory

**File**: `packages/extension/src/resources/<plural>-resource-factory.ts`  
**Reference**: `packages/extension/src/resources/replicasets-resource-factory.ts` (simple namespaced),
`packages/extension/src/resources/nodes-resource-factory.ts` (non-namespaced),
`packages/extension/src/resources/ingresses-resource-factory.ts` (custom API group + targetRef search).

Every factory extends `ResourceFactoryBase` and implements `ResourceFactory`.
The constructor wires capabilities by calling setter methods in sequence.

#### Namespaced resource (core API group)

```typescript
import type { KubernetesObject, V1Foo, V1FooList, V1Status } from '@kubernetes/client-node';
import { CoreV1Api } from '@kubernetes/client-node';
import type { KubeConfigSingleContext } from '/@/types/kubeconfig-single-context.js';
import type { ResourceFactory } from './resource-factory.js';
import { ResourceFactoryBase } from './resource-factory.js';
import { ResourceInformer } from '/@/types/resource-informer.js';

export class FoosResourceFactory extends ResourceFactoryBase implements ResourceFactory {
  constructor() {
    super({ resource: 'foos', kind: 'Foo' });

    // this.setEagerStart();                      // see "When to use setEagerStart" below
    this.setPermissions({
      isNamespaced: true, // MUST be true for namespaced resources
      permissionsRequests: [
        { group: '*', resource: '*', verb: 'watch' },
        { verb: 'watch', resource: 'foos' }, // always include the specific resource
      ],
    });
    this.setInformer({ createInformer: this.createInformer.bind(this) });
    this.setDeleteObject(this.deleteFoo); // omit for admin resources (Nodes, StorageClasses) and system resources (Events, EndpointSlices)
  }

  createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1Foo> {
    const namespace = kubeconfig.getNamespace();
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    const listFn = (): Promise<V1FooList> => apiClient.listNamespacedFoo({ namespace });
    const path = `/api/v1/namespaces/${namespace}/foos`;
    return new ResourceInformer<V1Foo>({ kubeconfig, path, listFn, kind: this.kind, plural: 'foos' });
  }

  deleteFoo(
    kubeconfig: KubeConfigSingleContext,
    name: string,
    namespace: string,
  ): Promise<V1Status | KubernetesObject> {
    const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
    return apiClient.deleteNamespacedFoo({ name, namespace });
  }
}
```

#### Non-namespaced resource (core API group)

Key differences from namespaced:

```typescript
super({ resource: 'foos', kind: 'Foo' });

this.setPermissions({
  isNamespaced: false,     // MUST be false
  // ...
});

createInformer(kubeconfig: KubeConfigSingleContext): ResourceInformer<V1Foo> {
  const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
  const listFn = (): Promise<V1FooList> => apiClient.listFoo();   // no namespace param
  const path = `/api/v1/foos`;                                     // no /namespaces/ segment
  return new ResourceInformer<V1Foo>({ kubeconfig, path, listFn, kind: this.kind, plural: 'foos' });
}

deleteFoo(kubeconfig: KubeConfigSingleContext, name: string): Promise<V1Status | KubernetesObject> {
  // delete method takes only 2 params (no namespace)
  const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
  return apiClient.deleteFoo({ name });
}
```

#### Non-core API group (e.g. `networking.k8s.io`, `apps`)

Use the appropriate API client from `@kubernetes/client-node` and reflect the
API group in the watch path:

```typescript
import { NetworkingV1Api } from '@kubernetes/client-node';

// in setPermissions:
{ verb: 'watch', group: 'networking.k8s.io', resource: 'foos' }

// in createInformer:
const apiClient = kubeconfig.getKubeConfig().makeApiClient(NetworkingV1Api);
const listFn = () => apiClient.listNamespacedFoo({ namespace });
const path = `/apis/networking.k8s.io/v1/namespaces/${namespace}/foos`;
```

For OpenShift custom resources not covered by a typed client, use `CustomObjectsApi`:

```typescript
import { CustomObjectsApi } from '@kubernetes/client-node';

const listFn = () =>
  apiClient.listNamespacedCustomObject({
    group: 'example.com',
    version: 'v1',
    namespace,
    plural: 'foos',
  });
const path = `/apis/example.com/v1/namespaces/${namespace}/foos`;
```

#### Optional factory capabilities

Each capability below is opt-in. The system only calls it if the factory sets
it; missing capabilities silently no-op (with a console.error) rather than
crashing.

---

##### `setIsActive(fn: (obj) => boolean)`

**Purpose**: enables the "Active" metric column on the dashboard home page cards.
`ContextsManager.getActiveResourcesCount()` filters the in-memory cache with
`isActive` and broadcasts the filtered count. Dashboard cards that receive a
non-`undefined` active count render a three-column layout ("icon / Active /
Total"); cards without it render only "icon / Total".

**When to define it**: whenever the resource has a meaningful running/ready
state that users would want to see at a glance — typically workload controllers
whose `spec.replicas` or readiness conditions are the primary signal.

**When to omit it**: for storage, config, or networking resources where
"active" doesn't have a clear meaning (ConfigMap, Secret, Service, PVC,
Ingress, Route all omit it). Pods also omit it — pod status is complex and
computed in the webview helper instead.

**Existing examples**:

| Factory                       | Condition                                         |
| ----------------------------- | ------------------------------------------------- |
| `NodesResourceFactory`        | `status.conditions` has `type=Ready, status=True` |
| `DeploymentsResourceFactory`  | `spec.replicas > 0`                               |
| `DaemonSetsResourceFactory`   | `status.desiredNumberScheduled > 0`               |
| `StatefulSetsResourceFactory` | `spec.replicas > 0`                               |
| `ReplicaSetsResourceFactory`  | `spec.replicas > 0`                               |

**Signature** (same for namespaced and non-namespaced):

```typescript
setIsActive((obj: V1Foo) => boolean);
```

**Implementation sketch**:

```typescript
isFooActive(foo: V1Foo): boolean {
  return (foo.spec?.replicas ?? 0) > 0;
}
```

**Dashboard wiring**: after adding `setIsActive`, also add a `DashboardResourceCard`
entry in `packages/webview/src/component/dashboard/DashboardResources.svelte`
if the resource should appear on the dashboard. The card automatically picks up
both total and active counts — no other changes are needed.

---

##### `setSearchBySelector(fn)`

**Purpose**: lets the port-forwarding subsystem find resource objects that
match a Kubernetes label or field selector. Called by
`ContextsManager.searchBySelector()`, which in turn is called from
`port-forward-connection.ts` when the user sets up port forwarding to a Pod
via a Service or Deployment selector.

**When to define it**: only when the resource is the direct forwarding target
(i.e. Pods). No existing factory other than `PodsResourceFactory` defines it.
Do not add it for other resources unless a new feature explicitly needs
runtime selector-based lookup for that kind.

**Existing example**: `PodsResourceFactory` — performs a live API call
(`apiClient.listNamespacedPod({ namespace, ...options })`) and returns the
matching items.

**Signature**:

```typescript
// Namespaced
(kubeconfig: KubeConfigSingleContext, options: SelectorOptions, namespace: string) => Promise<KubernetesObject[]>

// Non-namespaced
(kubeconfig: KubeConfigSingleContext, options: SelectorOptions) => Promise<KubernetesObject[]>
```

`SelectorOptions` is `{ labelSelector?: string; fieldSelector?: string }`.

**Implementation sketch** (namespaced):

```typescript
async searchFoosBySelector(
  kubeconfig: KubeConfigSingleContext,
  options: SelectorOptions,
  namespace: string,
): Promise<V1Foo[]> {
  const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
  const list = await apiClient.listNamespacedFoo({ namespace, ...options });
  return list.items;
}
```

---

##### `setSearchByTargetRef(fn)`

**Purpose**: lets other resources look up which objects of this kind reference
a given target (by kind + name). Called by `ContextsManager.searchByTargetRef()`
to build the endpoint/routing information shown on the Service details page.
This searches the **local in-memory cache** — it does not make a live API call.

**When to define it**: when this resource has a field that points to another
resource (e.g. Ingress rules point to Services, Route `.spec.to` points to
a Service, EndpointSlice `.endpoints[*].targetRef` points to a Pod). It is
what populates the "Ingresses", "Routes", and "Endpoint Slices" sections on
Service and Pod detail pages.

**When to omit it**: for resources that are not referenced by others (Deployment,
ConfigMap, Node, etc.).

**Existing examples**:

| Factory                         | Target kind      | Field inspected                                                                          |
| ------------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `IngressesResourceFactory`      | Service          | `spec.defaultBackend.service.name` or `spec.rules[*].http.paths[*].backend.service.name` |
| `RoutesResourceFactory`         | Service (or any) | `spec.to.name` + `spec.to.kind`                                                          |
| `EndpointSlicesResourceFactory` | Pod              | `endpoints[*].targetRef.name/namespace/kind`                                             |

**Signature** (same for namespaced and non-namespaced — searches the cache,
no namespace param needed because `ContextsManager` always uses the current
context):

```typescript
(kubeconfig: KubeConfigSingleContext, targetRef: TargetRef) => KubernetesObject[]
```

`TargetRef` is `{ kind: string; name: string; namespace?: string }` from
`@kubernetes-dashboard/channels`.

The factory must receive `ContextsManager` as a constructor argument so it
can call `this.contextsManager.getResources(this.resource, contextName)` to
obtain the cache list to filter:

```typescript
constructor(protected contextsManager: ContextsManager) {
  // ...
  this.setSearchByTargetRef(this.searchFoosByTargetRef);
}

searchFoosByTargetRef(kubeconfig: KubeConfigSingleContext, targetRef: TargetRef): V1Foo[] {
  const list = this.contextsManager.getResources(this.resource, kubeconfig.getKubeConfig().currentContext);
  return list.filter(
    (item: V1Foo) => item.spec?.targetName === targetRef.name && item.spec?.targetKind === targetRef.kind,
  );
}
```

---

##### `setReadObject(fn)`

**Purpose**: enables `ContextsManager.waitForObjectDeletion()` to confirm
that a resource object has been fully removed from the API server after a
delete call. `waitForObjectDeletion` issues a read call and resolves `true`
when the API returns a 404. This is only used inside `restartObject`
implementations — to safely re-create an object the code first deletes it,
then waits for the 404 confirmation before creating the replacement.

**When to define it**: exactly when the factory also defines `setRestartObject`
and that restart implementation calls `contextsManager.waitForObjectDeletion()`.
Currently only `PodsResourceFactory` and `JobsResourceFactory` need it.

**When to omit it**: for all resources that do not implement restart, or whose
restart logic does not need to poll for deletion (e.g. a deployment rolling
restart can be triggered without deleting and recreating).

**Signature**:

```typescript
// Namespaced
(kubeconfig: KubeConfigSingleContext, name: string, namespace: string) => Promise<KubernetesObject>

// Non-namespaced
(kubeconfig: KubeConfigSingleContext, name: string) => Promise<KubernetesObject>
```

**Implementation sketch** (namespaced):

```typescript
async readFoo(kubeconfig: KubeConfigSingleContext, name: string, namespace: string): Promise<V1Foo> {
  const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
  return apiClient.readNamespacedFoo({ name, namespace });
}
```

---

##### `setRestartObject(fn)`

**Purpose**: powers the "Restart" action button in the resource list and detail
views. `ContextsManager.restartObject()` delegates to this method.
`RestartAction.svelte` calls `contextsApi.restartObject(kind, name, namespace)`.
Without this setter, the restart action does nothing (the manager logs an error
and returns).

**When to define it**: when the resource type has a meaningful restart
semantics — i.e. the user can restart an instance without losing its
configuration. Restart is generally supported for workload resources (Pods,
Jobs). For stateless config resources (ConfigMap, Service, etc.) restart makes
no sense and should be omitted. For controller-managed workloads like
Deployments, a rolling restart can also be implemented here if desired.

**When to omit it**: for resources where restart is undefined or harmful
(Nodes, Namespaces, PVCs, etc.) or for resources where deletion alone (without
re-creation) is the correct user action.

**Existing examples**:

| Factory               | Strategy                                                                                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PodsResourceFactory` | For standalone pods: delete + wait for deletion + recreate with clean metadata. For controller-owned pods: just delete (the controller recreates). Delegates Job pods to `contextsManager.restartObject('Job', ...)`. |
| `JobsResourceFactory` | Delete with `propagationPolicy: Foreground` + wait for deletion + recreate with stripped server-assigned fields (uid, resourceVersion, selector labels).                                                              |

**Signature**:

```typescript
// Namespaced
(kubeconfig: KubeConfigSingleContext, name: string, namespace: string) => Promise<void>

// Non-namespaced
(kubeconfig: KubeConfigSingleContext, name: string) => Promise<void>
```

**Important**: the factory must receive `ContextsManager` in its constructor
when `restartObject` needs to call `contextsManager.waitForObjectDeletion()`.

**Implementation sketch** (namespaced, delete + wait + recreate pattern):

```typescript
constructor(protected contextsManager: ContextsManager) {
  // ...
  this.setReadObject(this.readFoo);       // required for waitForObjectDeletion
  this.setRestartObject(this.restartFoo);
}

async restartFoo(kubeconfig: KubeConfigSingleContext, name: string, namespace: string): Promise<void> {
  const apiClient = kubeconfig.getKubeConfig().makeApiClient(CoreV1Api);
  const existing = await apiClient.readNamespacedFoo({ name, namespace });

  await apiClient.deleteNamespacedFoo({ name, namespace });

  const deleted = await this.contextsManager.waitForObjectDeletion('foos', name, namespace);
  if (!deleted) {
    throw new Error(`foo "${name}" in namespace "${namespace}" was not deleted within the expected timeframe`);
  }

  // strip server-assigned fields before recreating
  delete existing.metadata!.uid;
  delete existing.metadata!.resourceVersion;
  delete existing.status;

  await apiClient.createNamespacedFoo({ namespace, body: existing });
}
```

### When to use setEagerStart

`setEagerStart()` tells the extension to start watching this resource immediately
when a Kubernetes context connects, rather than waiting until the user navigates
to the resource's list page.

**Use `setEagerStart()` when:**

1. **The resource appears on the Dashboard home page** — resources shown in
   `DashboardResources.svelte` cards (Pods, Deployments, Services, Nodes, etc.)
   need data available immediately so the dashboard can render counts.

2. **The resource is needed for port-forwarding endpoint resolution** — the
   port-forwarding subsystem uses Services, Ingresses, Routes, and EndpointSlices
   to resolve forwarding targets. These must be watched eagerly so lookups work
   even if the user hasn't visited those list pages.

**Omit `setEagerStart()` when:**

The resource is secondary or detail-only — ReplicaSets, DaemonSets, StatefulSets,
and Events are not shown on the dashboard home and are not involved in port
forwarding. Watching them lazily (on first navigation) reduces initial API load.

**Existing eager-start resources:**
Pods, Deployments, Services, Nodes, Namespaces, ConfigMaps, Secrets, CronJobs,
Jobs, PVCs, Ingresses, Routes, EndpointSlices.

**Existing lazy-start resources:**
ReplicaSets, DaemonSets, StatefulSets, Events.

---

### 2. Register the factory in ContextsManager

**File**: `packages/extension/src/manager/contexts-manager.ts`

Add an import at the top with the other factory imports, then add an instance
to the array returned by `getResourceFactories()`:

```typescript
// Add import (keep sorted with other factory imports)
import { FoosResourceFactory } from '/@/resources/foos-resource-factory.js';

// In getResourceFactories():
protected getResourceFactories(): ResourceFactory[] {
  return [
    // ... existing factories ...
    new FoosResourceFactory(),          // no-arg constructor for simple factories
    // new FoosResourceFactory(this),   // pass `this` if the factory needs ContextsManager
  ];
}
```

That is all that is needed on the backend. The existing dispatch machinery
(`UpdateResourceDispatcher`, `ContextsStatesDispatcher`) picks up the new
resource automatically — no changes required to those files.

---

## Part 2 — Webview

Six files to create, three files to edit.

### 3. Create the UI type

**File**: `packages/webview/src/component/<plural>/<Kind>UI.ts`

Extend the appropriate base interface:

```typescript
// For namespaced resources — extends KubernetesNamespacedObjectUI
import type { KubernetesNamespacedObjectUI } from '/@/component/objects/KubernetesObjectUI.ts';

export interface FooUI extends KubernetesNamespacedObjectUI {
  uid: string;
  created?: Date;
  // add resource-specific display fields here
}
```

```typescript
// For non-namespaced resources — extends KubernetesObjectUI (no namespace field)
import type { KubernetesObjectUI } from '/@/component/objects/KubernetesObjectUI.ts';

export interface FooUI extends KubernetesObjectUI {
  uid: string;
  created?: Date;
}
```

`KubernetesObjectUI` already provides `kind`, `name`, `status`, `selected?`.  
`KubernetesNamespacedObjectUI` adds `namespace`.

**Status convention**: use `'RUNNING'`, `'DEGRADED'`, or `'STOPPED'`.

### 4. Create the helper

**File**: `packages/webview/src/component/<plural>/<kind>-helper.ts`

The helper is a plain class with a method that converts a raw `KubernetesObject`
to a typed `FooUI`. The method is called as a transformer callback, so it must
be bound when passed (`.bind(helper)`) or be an arrow function in the class body
to avoid `this` loss.

Note: `@injectable()` is not required when the class has no constructor
dependencies and is bound with `.toSelf()`.

```typescript
import type { KubernetesObject, V1Foo } from '@kubernetes/client-node';
import type { FooUI } from './FooUI';

export class FooHelper {
  getFooUI(o: KubernetesObject): FooUI {
    const obj = o as V1Foo;
    return {
      kind: 'Foo',
      uid: obj.metadata?.uid ?? '',
      name: obj.metadata?.name ?? '',
      namespace: obj.metadata?.namespace ?? '', // omit for non-namespaced
      status: 'RUNNING', // compute from obj.status as needed
      selected: false,
      created: obj.metadata?.creationTimestamp,
    };
  }
}
```

### 5. Create the DI module

**File**: `packages/webview/src/component/<plural>/_<plural>-module.ts`

```typescript
import { ContainerModule } from 'inversify';
import { FooHelper } from './foo-helper';

const foosModule = new ContainerModule(options => {
  options.bind<FooHelper>(FooHelper).toSelf().inSingletonScope();
});

export { foosModule };
```

### 6. Register the DI module

**File**: `packages/webview/src/inject/inversify-binding.ts`

Add an import and a `container.load()` call:

```typescript
import { foosModule } from '/@/component/foos/_foos-module';

// in initBindings():
await this.#container.load(foosModule);
```

### 7. Create the List component

**File**: `packages/webview/src/component/<plural>/<Kind>sList.svelte`

```svelte
<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow } from '@podman-desktop/ui-svelte';
import moment from 'moment';
import { getContext } from 'svelte';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { icon } from '/@/component/icons/icon';
import type { FooUI } from './FooUI';
import { FooHelper } from './foo-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const fooHelper = dependencyAccessor.get<FooHelper>(FooHelper);

let nameColumn = new TableColumn<FooUI>('Name', {
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let statusColumn = new TableColumn<FooUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let ageColumn = new TableColumn<FooUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [statusColumn, nameColumn, ageColumn];
const row = new TableRow<FooUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[{ resource: 'foos', transformer: fooHelper.getFooUI.bind(fooHelper) }]}
  singular="foo"
  plural="foos"
  isNamespaced={true}
  icon={icon['Foo']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['Foo']} resources={['foos']} />
  {/snippet}
</KubernetesObjectsList>
```

The `icon` map in `packages/webview/src/component/icons/icon.ts` is keyed by
`kind` string. Add a new entry there if a dedicated icon SVG component exists,
or reuse an existing one for similar resource shapes.

#### Column components

**Shared columns** in `packages/webview/src/component/objects/columns/`:

| Component              | Purpose                                         | Props interface                              |
| ---------------------- | ----------------------------------------------- | -------------------------------------------- |
| `Name.svelte`          | Renders resource name as a link to details page | `ObjectProps` (`object: KubernetesObjectUI`) |
| `Status.svelte`        | Renders status icon based on `object.status`    | `ObjectProps`                                |
| `DeleteAction.svelte`  | Delete button with confirmation dialog          | `ObjectProps`                                |
| `RestartAction.svelte` | Restart button (for Pods, Jobs)                 | `ObjectProps`                                |

**Built-in renderers** from `@podman-desktop/ui-svelte`:

| Renderer              | Purpose                        | `renderMapping` returns |
| --------------------- | ------------------------------ | ----------------------- |
| `TableSimpleColumn`   | Plain text display             | `string`                |
| `TableDurationColumn` | Relative time (e.g., "5m ago") | `Date \| undefined`     |

**When to create a resource-specific column** in `<plural>/columns/`:

1. **Custom rendering logic** — the column needs icons, colors, badges, or formatting
   not covered by `TableSimpleColumn` (e.g., Phase with status icons, Ready counts)
2. **Resource-specific actions** — an Actions column combining delete/restart/custom
   buttons specific to this resource type
3. **Accessing typed fields** — the column needs fields from `FooUI` that don't exist
   on `KubernetesObjectUI`, so it needs a typed `Props` interface

**Structure for resource-specific columns:**

```
packages/webview/src/component/<plural>/columns/
├── props.ts           # Props interface with typed object: FooUI
├── Actions.svelte     # Actions column (delete, restart, custom actions)
├── Phase.svelte       # Example: custom status rendering with icons
└── Ready.svelte       # Example: ready/total count display
```

**props.ts pattern:**

```typescript
import type { FooUI } from '/@/component/<plural>/FooUI';

export interface Props {
  object: FooUI;
}
```

**Custom column pattern:**

```svelte
<script lang="ts">
import type { Props } from './props';
let { object }: Props = $props();
</script>

<span class="text-(--pd-table-body-text)">{object.customField}</span>
```

**Actions column pattern:**

```svelte
<script lang="ts">
import DeleteAction from '/@/component/objects/columns/DeleteAction.svelte';
import RestartAction from '/@/component/objects/columns/RestartAction.svelte';
import type { Props } from './props';

let { object }: Props = $props();
</script>

<RestartAction object={object} />
<DeleteAction object={object} />
```

### 8. Create the Details component

**File**: `packages/webview/src/component/<plural>/<Kind>Details.svelte`

```svelte
<script lang="ts">
import type { V1Foo } from '@kubernetes/client-node';
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { FooHelper } from './foo-helper';
import type { FooUI } from './FooUI';
import FooDetailsSummary from './FooDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
} // omit namespace for non-namespaced
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const fooHelper = dependencyAccessor.get<FooHelper>(FooHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Foo}
  typedUI={{} as FooUI}
  kind="Foo"
  resourceName="foos"
  listName="Foos"
  name={name}
  namespace={namespace}
  transformer={fooHelper.getFooUI.bind(fooHelper)}
  SummaryComponent={FooDetailsSummary} />
```

**File**: `packages/webview/src/component/<plural>/<Kind>DetailsSummary.svelte`

At minimum, render object metadata and events (both already provided by the
generic infrastructure):

```svelte
<script lang="ts">
import type { V1Foo } from '@kubernetes/client-node';
import type { EventUI } from '/@/component/objects/EventUI';
import Table from '/@/component/details/Table.svelte';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import EventsDetails from '/@/component/objects/details/EventsDetails.svelte';

interface Props {
  object: V1Foo;
  events: readonly EventUI[];
}
let { object, events }: Props = $props();
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  <EventsDetails events={events} />
</Table>
```

Add resource-specific spec/status sub-components in `details/` subdirectory as
needed (see `packages/webview/src/component/deployments/details/` for examples).

### 9. Register routes

**File**: `packages/webview/src/AppWithContext.svelte`

Add imports at the top and routes in the route block:

```svelte
<!-- Namespaced resource — standard pattern -->
<Route path="/foos">
  <FoosList />
</Route>
<Route path="/foos/:name/:namespace/*" let:meta>
  <FooDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
</Route>

<!-- Non-namespaced resource — no namespace param -->
<Route path="/foos">
  <FoosList />
</Route>
<Route path="/foos/:name/*" let:meta>
  <FooDetails name={decodeURI(meta.params.name)} />
</Route>
```

### 10. Update the Navigator

**File**: `packages/webview/src/navigation/navigator.ts`

The `resourceKindToURL` method maps a `kind` string to a URL segment. The
default rule is `kind.toLowerCase() + 's'`. Override it only for grouped or
irregular plural forms:

```typescript
protected resourceKindToURL(kind: string): string {
  if (kind === 'Ingress' || kind === 'Route') return 'ingressesRoutes';
  if (kind === 'ConfigMap' || kind === 'Secret') return 'configmapsSecrets';
  // For a new resource with a standard plural, nothing to add here.
  return kind.toLowerCase() + 's';
}
```

For grouped resources where the details URL embeds a kind discriminator
(e.g. `/ingressesRoutes/ingress/:name/:namespace/summary`), also update
`kubernetesResourceURL`:

```typescript
public kubernetesResourceURL(kind: string, name: string, namespace?: string): string {
  if (namespace) {
    if (kind === 'Ingress') return `/${this.resourceKindToURL(kind)}/ingress/${name}/${namespace}/summary`;
    if (kind === 'Route')   return `/${this.resourceKindToURL(kind)}/route/${name}/${namespace}/summary`;
    // ... add similar entry for new grouped kind
    return `/${this.resourceKindToURL(kind)}/${name}/${namespace}/summary`;
  }
  return `/${this.resourceKindToURL(kind)}/${name}/summary`;
}
```

### 11. Add to the Navigation sidebar

**File**: `packages/webview/src/Navigation.svelte`

Place the new link in the appropriate section (`workloadUrls`, `configUrls`,
`networkUrls`, `storageUrls`) or add a new section:

```svelte
<!-- Add URL to the matching section array for auto-expand -->
const workloadUrls = [ // ...existing... navigator.kubernetesResourcesURL('Foo'), ];

<!-- Add NavItem in the corresponding {#if} block -->
{#if workloadsExpanded}
  <NavItem title="Foos" child={true} href={navigator.kubernetesResourcesURL('Foo')} />
{/if}
```

---

## Grouped Resources (two kinds in one list page)

Use this pattern when two closely related resource types should share a single
list route and a unified UI type. Reference:
`packages/webview/src/component/configmaps-secrets/` (ConfigMap + Secret) and
`packages/webview/src/component/ingresses-routes/` (Ingress + Route).

### Key differences from the single-resource pattern

**Backend**: each kind gets its own factory — no changes to the factory pattern.

**Webview UI type**: create a single shared interface. Include a `type` field
to distinguish the kinds:

```typescript
export interface FooBarUI extends KubernetesNamespacedObjectUI {
  type: string; // e.g. 'Foo' | 'Bar'
  created?: Date;
}
```

**Helper**: one helper class with separate transformer methods (or one method
that inspects the raw object):

```typescript
getFooUI(o: KubernetesObject): FooBarUI { /* ... */ }
getBarUI(o: KubernetesObject): FooBarUI { /* ... */ }
```

**List component**: pass multiple entries to `kinds`:

```typescript
kinds={[
  { resource: 'foos', transformer: helper.getFooUI.bind(helper) },
  { resource: 'bars', transformer: helper.getBarUI.bind(helper) },
]}
```

**Routes**: single list route, but separate details routes per kind:

```svelte
<Route path="/fooBars">
  <FooBarList />
</Route>
<Route path="/fooBars/foo/:name/:namespace/*" let:meta>
  <FooDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
</Route>
<Route path="/fooBars/bar/:name/:namespace/*" let:meta>
  <BarDetails name={decodeURI(meta.params.name)} namespace={decodeURI(meta.params.namespace)} />
</Route>
```

**Navigator**: override `resourceKindToURL` for both kinds to the shared segment,
and override `kubernetesResourceURL` to embed the kind discriminator in the
details URL:

```typescript
if (kind === 'Foo' || kind === 'Bar') return 'fooBars';

// in kubernetesResourceURL:
if (kind === 'Foo') return `/fooBars/foo/${name}/${namespace}/summary`;
if (kind === 'Bar') return `/fooBars/bar/${name}/${namespace}/summary`;
```

**Navigation**: one nav item pointing to `navigator.kubernetesResourcesURL('Foo')`
(either kind resolves to the same URL).

---

## Testing

### Backend: resource factory test

**File**: `packages/extension/src/resources/<plural>-resource-factory.spec.ts`

Test `isActive` logic if implemented; test that inform path and list function
use correct API client and namespace:

```typescript
import { expect, test } from 'vitest';
import { FoosResourceFactory } from './foos-resource-factory.js';

test('factory has correct resource name and kind', () => {
  const factory = new FoosResourceFactory();
  expect(factory.resource).toBe('foos');
  expect(factory.kind).toBe('Foo');
});

// If setIsActive was called:
test('active condition logic', () => {
  const factory = new FoosResourceFactory();
  expect(factory.isActive).toBeDefined();
  expect(factory.isActive!({ status: {/* ready */} } as V1Foo)).toBeTruthy();
  expect(factory.isActive!({ status: {/* not ready */} } as V1Foo)).toBeFalsy();
});
```

### Webview: helper test

**File**: `packages/webview/src/component/<plural>/<kind>-helper.spec.ts`

```typescript
import { beforeEach, expect, test } from 'vitest';
import { FooHelper } from './foo-helper';
import type { V1Foo } from '@kubernetes/client-node';

let helper: FooHelper;
beforeEach(() => {
  helper = new FooHelper();
});

test('basic UI conversion', () => {
  const foo = {
    metadata: { name: 'my-foo', namespace: 'test-ns', uid: 'abc' },
    status: {/* ... */},
  } as V1Foo;
  const ui = helper.getFooUI(foo);
  expect(ui.kind).toBe('Foo');
  expect(ui.name).toBe('my-foo');
  expect(ui.namespace).toBe('test-ns');
  expect(ui.status).toBe('RUNNING');
});

test('status transitions', () => {
  // test RUNNING, DEGRADED, STOPPED variants
});
```

---

## Review Checklist

When reviewing a PR that adds a new resource, verify each item:

### Backend

- [ ] Factory file follows the `<plural>-resource-factory.ts` naming convention
- [ ] `isNamespaced` matches the actual Kubernetes resource scope
- [ ] Informer `path` matches the correct API group path (core `/api/v1/...` vs extension `/apis/<group>/<version>/...`)
- [ ] Namespaced resources use `listNamespaced*` / `deleteNamespaced*`; non-namespaced use `list*` / `delete*` with no namespace arg
- [ ] `setEagerStart()` is called if the resource appears on the Dashboard home page or is needed for port-forwarding (see "When to use setEagerStart" above)
- [ ] `permissionsRequests` includes both the wildcard entry and the specific resource entry
- [ ] Factory is added to `getResourceFactories()` in `contexts-manager.ts`
- [ ] Factory import added to `contexts-manager.ts`
- [ ] Factory unit test exists and covers `isActive` logic (if applicable)
- [ ] `setDeleteObject` is defined only if the UI will expose a delete action; omit for admin resources (Nodes, StorageClasses) and system resources (Events, EndpointSlices)

### Webview

- [ ] UI type extends the right base: `KubernetesNamespacedObjectUI` (namespaced) or `KubernetesObjectUI` (non-namespaced)
- [ ] `kind` field in `getFooUI()` matches the factory's `kind` string exactly (used by `icon` map and navigator)
- [ ] Helper class is a plain class (no `@injectable()` needed when bound with `.toSelf()` and no constructor dependencies)
- [ ] DI module file created and named `_<plural>-module.ts`
- [ ] DI module loaded in `inversify-binding.ts`
- [ ] List component uses `KubernetesObjectsList` with correct `isNamespaced` prop
- [ ] Details component passes `resourceName` matching the factory's `resource` string
- [ ] Details `kind` prop matches the factory's `kind` string
- [ ] `AppWithContext.svelte` has both list and details routes; details route has `:namespace` param for namespaced resources, omits it for non-namespaced
- [ ] `navigator.ts` — `resourceKindToURL` handles the new kind if irregular plural or grouped; `kubernetesResourceURL` handles details URL if grouped
- [ ] `Navigation.svelte` — new `NavItem` added in correct section; URL array for that section includes the new kind URL
- [ ] Helper unit test exists and covers status field computation
- [ ] `icon` map in `icon.ts` has an entry for the new `kind` string
- [ ] List component has Actions column with delete if factory defines `setDeleteObject`; omit Actions column if factory omits it
- [ ] `TableRow` has `selectable: true` for consistency with other resource lists

### Grouped resources (additional checks)

- [ ] Both kind strings map to the same URL segment in `resourceKindToURL`
- [ ] `kubernetesResourceURL` embeds a kind discriminator in the details path for each kind
- [ ] Details routes are separate per kind (not shared)
- [ ] Single nav item covers both kinds (one URL is sufficient)
- [ ] `KubernetesEmptyScreen` receives both resource names in its `resources` prop
