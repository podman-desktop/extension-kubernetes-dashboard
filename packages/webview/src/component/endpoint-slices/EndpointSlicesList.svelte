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
import type { EndpointSliceUI } from './EndpointSliceUI';
import { EndpointSliceHelper } from './endpoint-slice-helper';
import ActionsColumn from './columns/Actions.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const endpointSliceHelper = dependencyAccessor.get<EndpointSliceHelper>(EndpointSliceHelper);

let statusColumn = new TableColumn<EndpointSliceUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<EndpointSliceUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let addressTypeColumn = new TableColumn<EndpointSliceUI, string>('Address Type', {
  renderMapping: (obj): string => obj.addressType,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.addressType.localeCompare(b.addressType),
});

let portsColumn = new TableColumn<EndpointSliceUI, string>('Ports', {
  width: '2fr',
  renderMapping: (obj): string => obj.ports,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.ports.localeCompare(b.ports),
});

let endpointsColumn = new TableColumn<EndpointSliceUI, string>('Endpoints', {
  renderMapping: (obj): string => String(obj.endpoints),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.endpoints - b.endpoints,
});

let ageColumn = new TableColumn<EndpointSliceUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  addressTypeColumn,
  portsColumn,
  endpointsColumn,
  ageColumn,
  new TableColumn<EndpointSliceUI>('Actions', {
    align: 'right',
    width: '150px',
    renderer: ActionsColumn,
    overflow: true,
  }),
];

const row = new TableRow<EndpointSliceUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'endpointslices',
      transformer: endpointSliceHelper.getEndpointSliceUI.bind(endpointSliceHelper),
    },
  ]}
  singular="endpoint slice"
  plural="endpoint slices"
  isNamespaced={true}
  icon={icon['EndpointSlice']}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['EndpointSlice']} resources={['endpointslices']} />
  {/snippet}
</KubernetesObjectsList>
