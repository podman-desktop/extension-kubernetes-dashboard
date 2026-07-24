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
import type { RuntimeClassUI } from './RuntimeClassUI';
import { RuntimeClassHelper } from './runtime-class-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const runtimeClassHelper = dependencyAccessor.get<RuntimeClassHelper>(RuntimeClassHelper);

let statusColumn = new TableColumn<RuntimeClassUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<RuntimeClassUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let handlerColumn = new TableColumn<RuntimeClassUI, string>('Handler', {
  renderMapping: (obj): string => obj.handler,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.handler.localeCompare(b.handler),
});

let ageColumn = new TableColumn<RuntimeClassUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [statusColumn, nameColumn, handlerColumn, ageColumn];

const row = new TableRow<RuntimeClassUI>({});
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'runtimeclasses',
      transformer: runtimeClassHelper.getRuntimeClassUI.bind(runtimeClassHelper),
    },
  ]}
  singular="runtime class"
  plural="runtime classes"
  isNamespaced={false}
  icon={icon['RuntimeClass']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['RuntimeClass']} resources={['runtimeclasses']} />
  {/snippet}
</KubernetesObjectsList>
