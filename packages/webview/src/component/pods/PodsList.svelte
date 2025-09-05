<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow } from '@podman-desktop/ui-svelte';
import moment from 'moment';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import { PodHelper } from './pod-helper';
import type { PodUI } from './PodUI';
import PodIcon from '/@/component/icons/PodIcon.svelte';
import ActionsColumn from './columns/Actions.svelte';
import ContainersColumn from './columns/Containers.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const podHelper = dependencyAccessor.get<PodHelper>(PodHelper);

let statusColumn = new TableColumn<PodUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => b.status.localeCompare(a.status),
});

let nameColumn = new TableColumn<PodUI>('Name', {
  width: '2fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let containersColumn = new TableColumn<PodUI>('Containers', {
  renderer: ContainersColumn,
  comparator: (a, b): number => a.containers.length - b.containers.length,
  initialOrder: 'descending',
  overflow: true,
});

let ageColumn = new TableColumn<PodUI, Date | undefined>('Age', {
  renderMapping: (pod): Date | undefined => pod.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  containersColumn,
  ageColumn,
  new TableColumn<PodUI>('Actions', { align: 'right', width: '150px', renderer: ActionsColumn, overflow: true }),
];

const row = new TableRow<PodUI>({ selectable: (_pod): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'pods',
      transformer: podHelper.getPodUI.bind(podHelper),
    },
  ]}
  singular="Pod"
  plural="Pods"
  isNamespaced={true}
  icon={PodIcon}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={PodIcon} resources={['pods']} />
  {/snippet}
</KubernetesObjectsList>
