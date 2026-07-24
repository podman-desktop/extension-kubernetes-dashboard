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
import type { PriorityClassUI } from './PriorityClassUI';
import { PriorityClassHelper } from './priority-class-helper';
import GlobalDefaultColumn from './columns/GlobalDefault.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const priorityClassHelper = dependencyAccessor.get<PriorityClassHelper>(PriorityClassHelper);

let statusColumn = new TableColumn<PriorityClassUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<PriorityClassUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let valueColumn = new TableColumn<PriorityClassUI, string>('Value', {
  renderMapping: (obj): string => String(obj.value),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.value - b.value,
});

let globalDefaultColumn = new TableColumn<PriorityClassUI>('Global Default', {
  renderer: GlobalDefaultColumn,
  comparator: (a, b): number => a.globalDefault.localeCompare(b.globalDefault),
});

let preemptionPolicyColumn = new TableColumn<PriorityClassUI, string>('Preemption Policy', {
  renderMapping: (obj): string => obj.preemptionPolicy,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.preemptionPolicy.localeCompare(b.preemptionPolicy),
});

let ageColumn = new TableColumn<PriorityClassUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [statusColumn, nameColumn, valueColumn, globalDefaultColumn, preemptionPolicyColumn, ageColumn];

const row = new TableRow<PriorityClassUI>({});
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'priorityclasses',
      transformer: priorityClassHelper.getPriorityClassUI.bind(priorityClassHelper),
    },
  ]}
  singular="priority class"
  plural="priority classes"
  isNamespaced={false}
  icon={icon['PriorityClass']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['PriorityClass']} resources={['priorityclasses']} />
  {/snippet}
</KubernetesObjectsList>
