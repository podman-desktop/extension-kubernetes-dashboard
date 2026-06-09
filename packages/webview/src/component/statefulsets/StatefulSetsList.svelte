<script lang="ts">
import moment from 'moment';
import { getContext } from 'svelte';

import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';

import { icon } from '/@/component/icons/icon';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';

import type { StatefulSetUI } from './StatefulSetUI';
import { StatefulSetHelper } from './statefulset-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const statefulSetHelper = dependencyAccessor.get<StatefulSetHelper>(StatefulSetHelper);

let statusColumn = new TableColumn<StatefulSetUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<StatefulSetUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let readyColumn = new TableColumn<StatefulSetUI, string>('Ready', {
  renderMapping: (obj): string => `${obj.ready}/${obj.replicas}`,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.ready - b.ready,
});

let upToDateColumn = new TableColumn<StatefulSetUI, string>('Up-to-date', {
  renderMapping: (obj): string => String(obj.upToDate),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.upToDate - b.upToDate,
});

let ageColumn = new TableColumn<StatefulSetUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [statusColumn, nameColumn, readyColumn, upToDateColumn, ageColumn];

const row = new TableRow<StatefulSetUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'statefulsets',
      transformer: statefulSetHelper.getStatefulSetUI,
    },
  ]}
  singular="statefulset"
  plural="statefulsets"
  isNamespaced={true}
  icon={icon['StatefulSet']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['StatefulSet']} resources={['statefulsets']} />
  {/snippet}
</KubernetesObjectsList>
