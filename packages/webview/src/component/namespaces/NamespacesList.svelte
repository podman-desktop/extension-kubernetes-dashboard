<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow } from '@podman-desktop/ui-svelte';
import moment from 'moment';

import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import type { NamespaceUI } from './NamespaceUI';
import { NamespaceHelper } from './namespace-helper';
import KubernetesIcon from '../icons/KubernetesIcon.svelte';
import NamespaceEmptyScreen from './NamespaceEmptyScreen.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const namespaceHelper = dependencyAccessor.get<NamespaceHelper>(NamespaceHelper);

let statusColumn = new TableColumn<NamespaceUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<NamespaceUI>('Name', {
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let ageColumn = new TableColumn<NamespaceUI, Date | undefined>('Age', {
  renderMapping: (namespace): Date | undefined => namespace.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [statusColumn, nameColumn, ageColumn];

const row = new TableRow<NamespaceUI>({});
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'namespaces',
      transformer: namespaceHelper.getNamespaceUI.bind(namespaceHelper),
    },
  ]}
  singular="namespace"
  plural="namespaces"
  icon={KubernetesIcon}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <NamespaceEmptyScreen />
  {/snippet}
</KubernetesObjectsList>
