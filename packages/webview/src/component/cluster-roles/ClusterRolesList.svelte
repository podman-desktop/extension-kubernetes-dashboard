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
import type { ClusterRoleUI } from './ClusterRoleUI';
import { ClusterRoleHelper } from './cluster-role-helper';
import ActionsColumn from './columns/Actions.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const clusterRoleHelper = dependencyAccessor.get<ClusterRoleHelper>(ClusterRoleHelper);

let statusColumn = new TableColumn<ClusterRoleUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<ClusterRoleUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let rulesColumn = new TableColumn<ClusterRoleUI, string>('Rules', {
  renderMapping: (obj): string => String(obj.rules),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.rules - b.rules,
});

let ageColumn = new TableColumn<ClusterRoleUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  rulesColumn,
  ageColumn,
  new TableColumn<ClusterRoleUI>('Actions', {
    align: 'right',
    width: '150px',
    renderer: ActionsColumn,
    overflow: true,
  }),
];

const row = new TableRow<ClusterRoleUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'clusterroles',
      transformer: clusterRoleHelper.getClusterRoleUI.bind(clusterRoleHelper),
    },
  ]}
  singular="cluster role"
  plural="cluster roles"
  isNamespaced={false}
  icon={icon['ClusterRole']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['ClusterRole']} resources={['clusterroles']} />
  {/snippet}
</KubernetesObjectsList>
