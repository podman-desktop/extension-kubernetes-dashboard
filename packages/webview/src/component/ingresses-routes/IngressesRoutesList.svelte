<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow } from '@podman-desktop/ui-svelte';
import moment from 'moment';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import BackendColumn from '/@/component/ingresses-routes/columns/Backend.svelte';
import ActionsColumn from '/@/component/ingresses-routes/columns/Actions.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import IngressRouteIcon from '/@/component/icons/IngressRouteIcon.svelte';
import type { RouteUI } from './RouteUI';
import type { IngressUI } from './IngressUI';
import { IngressRouteHelper } from './ingress-route-helper';
import HostPathColumn from './columns/HostPath.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const ingressRouteHelper = dependencyAccessor.get<IngressRouteHelper>(IngressRouteHelper);

let statusColumn = new TableColumn<IngressUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<IngressUI | RouteUI>('Name', {
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let pathColumn = new TableColumn<IngressUI | RouteUI>('Host/Path', {
  width: '1.5fr',
  renderer: HostPathColumn,
  comparator: (a, b): number => compareHostPath(a, b),
});

let ageColumn = new TableColumn<IngressUI | RouteUI, Date | undefined>('Age', {
  renderMapping: (ingressRoute): Date | undefined => ingressRoute.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

function compareHostPath(object1: IngressUI | RouteUI, object2: IngressUI | RouteUI): number {
  const hostPathObject1 = ingressRouteHelper.getHostPaths(object1)[0] ?? '';
  const hostPathObject2 = ingressRouteHelper.getHostPaths(object2)[0] ?? '';
  return hostPathObject1.label.localeCompare(hostPathObject2.label);
}

let backendColumn = new TableColumn<IngressUI | RouteUI>('Backend', {
  width: '1.5fr',
  renderer: BackendColumn,
  comparator: (a, b): number => compareBackend(a, b),
});

function compareBackend(object1: IngressUI | RouteUI, object2: IngressUI | RouteUI): number {
  const backendObject1 = ingressRouteHelper.getBackends(object1)[0] ?? '';
  const backendObject2 = ingressRouteHelper.getBackends(object2)[0] ?? '';
  return backendObject1.localeCompare(backendObject2);
}

const columns = [
  statusColumn,
  nameColumn,
  pathColumn,
  backendColumn,
  ageColumn,
  new TableColumn<IngressUI | RouteUI>('Actions', { align: 'right', renderer: ActionsColumn }),
];

const row = new TableRow<IngressUI | RouteUI>({ selectable: (_ingressRoute): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'ingresses',
      transformer: ingressRouteHelper.getIngressUI,
    },
    {
      resource: 'routes',
      transformer: ingressRouteHelper.getRouteUI,
    },
  ]}
  singular="ingress and route"
  plural="ingresses and routes"
  isNamespaced={true}
  icon={IngressRouteIcon}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={IngressRouteIcon} resources={['ingresses', 'routes']} />
  {/snippet}
</KubernetesObjectsList>
