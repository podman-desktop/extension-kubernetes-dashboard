<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import moment from 'moment';

import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import RolesColumn from './columns/Roles.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import NodeIcon from '/@/component/icons/NodeIcon.svelte';
import type { NodeUI } from './NodeUI';
import { NodeHelper } from './node-helper';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import NodeEmptyScreen from './NodeEmptyScreen.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const nodeHelper = dependencyAccessor.get<NodeHelper>(NodeHelper);

let statusColumn = new TableColumn<NodeUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<NodeUI>('Name', {
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let rolesColumn = new TableColumn<NodeUI>('Roles', {
  renderer: RolesColumn,
  overflow: true,
  comparator: (a, b): number => a.role.localeCompare(b.role),
});

let ageColumn = new TableColumn<NodeUI, Date | undefined>('Age', {
  renderMapping: (node): Date | undefined => node.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

let versionColumn = new TableColumn<NodeUI, string>('Version', {
  renderMapping: (node): string => node.version,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.version.localeCompare(b.version),
});

let osImageColumn = new TableColumn<NodeUI, string>('OS', {
  width: '1.5fr',
  renderMapping: (node): string => node.osImage,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.osImage.localeCompare(b.osImage),
});

let kernelVersionColumn = new TableColumn<NodeUI, string>('Kernel', {
  renderMapping: (node): string => node.kernelVersion,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.kernelVersion.localeCompare(b.kernelVersion),
});

const columns = [statusColumn, nameColumn, rolesColumn, versionColumn, osImageColumn, kernelVersionColumn, ageColumn];

const row = new TableRow<NodeUI>({});
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'nodes',
      transformer: nodeHelper.getNodeUI.bind(nodeHelper),
    },
  ]}
  singular="node"
  plural="nodes"
  icon={NodeIcon}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <NodeEmptyScreen />
  {/snippet}
</KubernetesObjectsList>
