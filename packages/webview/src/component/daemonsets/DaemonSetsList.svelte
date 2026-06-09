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

import type { DaemonSetUI } from './DaemonSetUI';
import ReadyColumn from './columns/Ready.svelte';
import { DaemonSetHelper } from './daemonset-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const daemonSetHelper = dependencyAccessor.get<DaemonSetHelper>(DaemonSetHelper);

let statusColumn = new TableColumn<DaemonSetUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<DaemonSetUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let readyColumn = new TableColumn<DaemonSetUI>('Ready', {
  renderer: ReadyColumn,
  comparator: (a, b): number => a.ready - b.ready,
});

let upToDateColumn = new TableColumn<DaemonSetUI, string>('Up-to-date', {
  renderMapping: (obj): string => String(obj.upToDate),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.upToDate - b.upToDate,
});

let nodeSelectorColumn = new TableColumn<DaemonSetUI, string>('Node Selector', {
  renderMapping: (obj): string => obj.nodeSelector,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.nodeSelector.localeCompare(b.nodeSelector),
});

let ageColumn = new TableColumn<DaemonSetUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [statusColumn, nameColumn, readyColumn, upToDateColumn, nodeSelectorColumn, ageColumn];

const row = new TableRow<DaemonSetUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'daemonsets',
      transformer: daemonSetHelper.getDaemonSetUI,
    },
  ]}
  singular="daemonset"
  plural="daemonsets"
  isNamespaced={true}
  icon={icon['DaemonSet']}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['DaemonSet']} resources={['daemonsets']} />
  {/snippet}
</KubernetesObjectsList>
