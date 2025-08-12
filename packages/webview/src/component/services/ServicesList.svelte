<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import moment from 'moment';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import TypeColumn from '/@/component/services/columns/Type.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import ActionsColumn from '/@/component/services/columns/Actions.svelte';
import type { ServiceUI } from './ServiceUI';
import ServiceIcon from '/@/component/icons/ServiceIcon.svelte';
import { ServiceHelper } from './service-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const serviceHelper = dependencyAccessor.get<ServiceHelper>(ServiceHelper);

let statusColumn = new TableColumn<ServiceUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<ServiceUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let typeColumn = new TableColumn<ServiceUI>('Type', {
  renderer: TypeColumn,
  overflow: true,
  comparator: (a, b): number => a.type.localeCompare(b.type),
});

let clusterIPColumn = new TableColumn<ServiceUI, string>('Cluster IP', {
  renderMapping: (service): string => service.clusterIP,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.clusterIP.localeCompare(b.clusterIP),
});

let portsColumn = new TableColumn<ServiceUI, string>('Ports', {
  width: '2fr',
  renderMapping: (service): string => service.ports,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.ports.localeCompare(b.ports),
});

let ageColumn = new TableColumn<ServiceUI, Date | undefined>('Age', {
  renderMapping: (service): Date | undefined => service.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  typeColumn,
  clusterIPColumn,
  portsColumn,
  ageColumn,
  new TableColumn<ServiceUI>('Actions', { align: 'right', renderer: ActionsColumn }),
];

const row = new TableRow<ServiceUI>({ selectable: (_service): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'services',
      transformer: serviceHelper.getServiceUI,
    },
  ]}
  singular="service"
  plural="services"
  isNamespaced={true}
  icon={ServiceIcon}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={ServiceIcon} resources={['services']} />
  {/snippet}
</KubernetesObjectsList>
