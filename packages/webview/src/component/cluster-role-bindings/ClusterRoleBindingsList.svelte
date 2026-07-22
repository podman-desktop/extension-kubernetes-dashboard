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
import type { ClusterRoleBindingUI } from './ClusterRoleBindingUI';
import { ClusterRoleBindingHelper } from './cluster-role-binding-helper';
import ActionsColumn from './columns/Actions.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const clusterRoleBindingHelper = dependencyAccessor.get<ClusterRoleBindingHelper>(ClusterRoleBindingHelper);

let statusColumn = new TableColumn<ClusterRoleBindingUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<ClusterRoleBindingUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let bindingsColumn = new TableColumn<ClusterRoleBindingUI, string>('Bindings', {
  width: '2fr',
  renderMapping: (obj): string => obj.bindings,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.bindings.localeCompare(b.bindings),
});

let roleColumn = new TableColumn<ClusterRoleBindingUI, string>('Role', {
  renderMapping: (obj): string => obj.role,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.role.localeCompare(b.role),
});

let ageColumn = new TableColumn<ClusterRoleBindingUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  bindingsColumn,
  roleColumn,
  ageColumn,
  new TableColumn<ClusterRoleBindingUI>('Actions', {
    align: 'right',
    width: '150px',
    renderer: ActionsColumn,
    overflow: true,
  }),
];

const row = new TableRow<ClusterRoleBindingUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'clusterrolebindings',
      transformer: clusterRoleBindingHelper.getClusterRoleBindingUI.bind(clusterRoleBindingHelper),
    },
  ]}
  singular="cluster role binding"
  plural="cluster role bindings"
  isNamespaced={false}
  icon={icon['ClusterRoleBinding']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['ClusterRoleBinding']} resources={['clusterrolebindings']} />
  {/snippet}
</KubernetesObjectsList>
