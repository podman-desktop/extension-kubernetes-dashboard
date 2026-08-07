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
import type { GatewayUI } from './GatewayUI';
import { GatewayHelper } from './gateway-helper';
import ActionsColumn from './columns/Actions.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const gatewayHelper = dependencyAccessor.get<GatewayHelper>(GatewayHelper);

let statusColumn = new TableColumn<GatewayUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<GatewayUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let classColumn = new TableColumn<GatewayUI, string>('Gateway Class', {
  renderMapping: (obj): string => obj.gatewayClassName,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.gatewayClassName.localeCompare(b.gatewayClassName),
});

let listenersColumn = new TableColumn<GatewayUI, string>('Listeners', {
  width: '1.5fr',
  renderMapping: (obj): string => obj.listeners,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.listeners.localeCompare(b.listeners),
});

let addressesColumn = new TableColumn<GatewayUI, string>('Addresses', {
  renderMapping: (obj): string => obj.addresses,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.addresses.localeCompare(b.addresses),
});

let ageColumn = new TableColumn<GatewayUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  classColumn,
  listenersColumn,
  addressesColumn,
  ageColumn,
  new TableColumn<GatewayUI>('Actions', { align: 'right', width: '150px', renderer: ActionsColumn, overflow: true }),
];

const row = new TableRow<GatewayUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'gateways',
      transformer: gatewayHelper.getGatewayUI,
    },
  ]}
  singular="gateway"
  plural="gateways"
  isNamespaced={true}
  icon={icon['Gateway']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['Gateway']} resources={['gateways']} />
  {/snippet}
</KubernetesObjectsList>
