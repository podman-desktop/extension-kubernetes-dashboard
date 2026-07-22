<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import moment from 'moment';

import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import { icon } from '/@/component/icons/icon';
import type { HttpRouteUI } from './HttpRouteUI';
import { HttpRouteHelper } from './httproute-helper';
import HostnamesColumn from './columns/Hostnames.svelte';
import ActionsColumn from './columns/Actions.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const httpRouteHelper = dependencyAccessor.get<HttpRouteHelper>(HttpRouteHelper);

let statusColumn = new TableColumn<HttpRouteUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<HttpRouteUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let hostnamesColumn = new TableColumn<HttpRouteUI>('Hostnames', {
  width: '1.5fr',
  renderer: HostnamesColumn,
  comparator: (a, b): number => a.hostnames.join(',').localeCompare(b.hostnames.join(',')),
});

let parentRefsColumn = new TableColumn<HttpRouteUI, string>('Parent Refs', {
  renderMapping: (obj): string => obj.parentRefs,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.parentRefs.localeCompare(b.parentRefs),
});

let backendRefsColumn = new TableColumn<HttpRouteUI, string>('Backend Refs', {
  renderMapping: (obj): string => obj.backendRefs,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.backendRefs.localeCompare(b.backendRefs),
});

let ageColumn = new TableColumn<HttpRouteUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  hostnamesColumn,
  parentRefsColumn,
  backendRefsColumn,
  ageColumn,
  new TableColumn<HttpRouteUI>('Actions', { align: 'right', width: '150px', renderer: ActionsColumn, overflow: true }),
];

const row = new TableRow<HttpRouteUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'httproutes',
      transformer: httpRouteHelper.getHttpRouteUI.bind(httpRouteHelper),
    },
  ]}
  singular="httproute"
  plural="httproutes"
  isNamespaced={true}
  icon={icon['HTTPRoute']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['HTTPRoute']} resources={['httproutes']} />
  {/snippet}
</KubernetesObjectsList>
