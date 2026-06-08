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

import type { ReplicaSetUI } from './ReplicaSetUI';
import { ReplicaSetHelper } from './replicaset-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const replicaSetHelper = dependencyAccessor.get<ReplicaSetHelper>(ReplicaSetHelper);

let statusColumn = new TableColumn<ReplicaSetUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<ReplicaSetUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let desiredColumn = new TableColumn<ReplicaSetUI, string>('Desired', {
  renderMapping: (obj): string => String(obj.desired),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.desired - b.desired,
});

let currentColumn = new TableColumn<ReplicaSetUI, string>('Current', {
  renderMapping: (obj): string => String(obj.current),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.current - b.current,
});

let readyColumn = new TableColumn<ReplicaSetUI, string>('Ready', {
  renderMapping: (obj): string => String(obj.ready),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.ready - b.ready,
});

let ownerColumn = new TableColumn<ReplicaSetUI, string>('Owner', {
  renderMapping: (obj): string => obj.owner,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.owner.localeCompare(b.owner),
});

let ageColumn = new TableColumn<ReplicaSetUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [statusColumn, nameColumn, desiredColumn, currentColumn, readyColumn, ownerColumn, ageColumn];

const row = new TableRow<ReplicaSetUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'replicasets',
      transformer: replicaSetHelper.getReplicaSetUI,
    },
  ]}
  singular="replicaset"
  plural="replicasets"
  isNamespaced={true}
  icon={icon['ReplicaSet']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['ReplicaSet']} resources={['replicasets']} />
  {/snippet}
</KubernetesObjectsList>
