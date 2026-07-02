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
import type { StorageClassUI } from './StorageClassUI';
import { StorageClassHelper } from './storage-class-helper';
import DefaultColumn from './columns/Default.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const storageClassHelper = dependencyAccessor.get<StorageClassHelper>(StorageClassHelper);

let statusColumn = new TableColumn<StorageClassUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<StorageClassUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let provisionerColumn = new TableColumn<StorageClassUI, string>('Provisioner', {
  width: '1.5fr',
  renderMapping: (obj): string => obj.provisioner,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.provisioner.localeCompare(b.provisioner),
});

let reclaimPolicyColumn = new TableColumn<StorageClassUI, string>('Reclaim Policy', {
  renderMapping: (obj): string => obj.reclaimPolicy,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.reclaimPolicy.localeCompare(b.reclaimPolicy),
});

let isDefaultColumn = new TableColumn<StorageClassUI>('Default', {
  renderer: DefaultColumn,
  comparator: (a, b): number => a.isDefault.localeCompare(b.isDefault),
});

let volumeBindingModeColumn = new TableColumn<StorageClassUI, string>('Volume Binding Mode', {
  renderMapping: (obj): string => obj.volumeBindingMode,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.volumeBindingMode.localeCompare(b.volumeBindingMode),
});

let ageColumn = new TableColumn<StorageClassUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  provisionerColumn,
  reclaimPolicyColumn,
  isDefaultColumn,
  volumeBindingModeColumn,
  ageColumn,
];

const row = new TableRow<StorageClassUI>({});
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'storageclasses',
      transformer: storageClassHelper.getStorageClassUI.bind(storageClassHelper),
    },
  ]}
  singular="storage class"
  plural="storage classes"
  isNamespaced={false}
  icon={icon['StorageClass']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['StorageClass']} resources={['storageclasses']} />
  {/snippet}
</KubernetesObjectsList>
