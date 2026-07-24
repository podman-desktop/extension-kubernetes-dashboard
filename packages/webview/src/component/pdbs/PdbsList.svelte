<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import moment from 'moment';

import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import ActionsColumn from './columns/Actions.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import { icon } from '/@/component/icons/icon';
import type { PdbUI } from './PdbUI';
import { PdbHelper } from './pdb-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const pdbHelper = dependencyAccessor.get<PdbHelper>(PdbHelper);

let statusColumn = new TableColumn<PdbUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<PdbUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let minAvailableColumn = new TableColumn<PdbUI, string>('Min Available', {
  renderMapping: (obj): string => obj.minAvailable,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.minAvailable.localeCompare(b.minAvailable),
});

let maxUnavailableColumn = new TableColumn<PdbUI, string>('Max Unavailable', {
  renderMapping: (obj): string => obj.maxUnavailable,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.maxUnavailable.localeCompare(b.maxUnavailable),
});

let currentHealthyColumn = new TableColumn<PdbUI, string>('Current Healthy', {
  renderMapping: (obj): string => String(obj.currentHealthy),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.currentHealthy - b.currentHealthy,
});

let desiredHealthyColumn = new TableColumn<PdbUI, string>('Desired Healthy', {
  renderMapping: (obj): string => String(obj.desiredHealthy),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.desiredHealthy - b.desiredHealthy,
});

let allowedDisruptionsColumn = new TableColumn<PdbUI, string>('Allowed Disruptions', {
  renderMapping: (obj): string => String(obj.allowedDisruptions),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.allowedDisruptions - b.allowedDisruptions,
});

let expectedPodsColumn = new TableColumn<PdbUI, string>('Expected Pods', {
  renderMapping: (obj): string => String(obj.expectedPods),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.expectedPods - b.expectedPods,
});

let ageColumn = new TableColumn<PdbUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  minAvailableColumn,
  maxUnavailableColumn,
  currentHealthyColumn,
  desiredHealthyColumn,
  allowedDisruptionsColumn,
  expectedPodsColumn,
  ageColumn,
  new TableColumn<PdbUI>('Actions', { align: 'right', width: '150px', renderer: ActionsColumn, overflow: true }),
];

const row = new TableRow<PdbUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'poddisruptionbudgets',
      transformer: pdbHelper.getPdbUI,
    },
  ]}
  singular="pod disruption budget"
  plural="pod disruption budgets"
  isNamespaced={true}
  icon={icon['PodDisruptionBudget']}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['PodDisruptionBudget']} resources={['poddisruptionbudgets']} />
  {/snippet}
</KubernetesObjectsList>
