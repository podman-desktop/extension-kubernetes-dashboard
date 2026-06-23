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
import type { EndpointUI } from './EndpointUI';
import { EndpointHelper } from './endpoint-helper';
import ActionsColumn from './columns/Actions.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const endpointHelper = dependencyAccessor.get<EndpointHelper>(EndpointHelper);

let statusColumn = new TableColumn<EndpointUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<EndpointUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let endpointsColumn = new TableColumn<EndpointUI, string>('Endpoints', {
  width: '2fr',
  renderMapping: (obj): string => obj.endpoints,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.endpoints.localeCompare(b.endpoints),
});

let portsColumn = new TableColumn<EndpointUI, string>('Ports', {
  renderMapping: (obj): string => obj.ports,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.ports.localeCompare(b.ports),
});

let ageColumn = new TableColumn<EndpointUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  endpointsColumn,
  portsColumn,
  ageColumn,
  new TableColumn<EndpointUI>('Actions', { align: 'right', width: '150px', renderer: ActionsColumn, overflow: true }),
];

const row = new TableRow<EndpointUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'endpoints',
      transformer: endpointHelper.getEndpointUI,
    },
  ]}
  singular="endpoint"
  plural="endpoints"
  isNamespaced={true}
  icon={icon['Endpoints']}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['Endpoints']} resources={['endpoints']} />
  {/snippet}
</KubernetesObjectsList>
