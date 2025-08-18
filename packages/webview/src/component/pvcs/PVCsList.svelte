<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import moment from 'moment';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import type { PVCUI } from './PVCUI';
import { PVCHelper } from './pvc-helper';
import ModeColumn from './columns/Mode.svelte';
import ActionsColumn from './columns/Actions.svelte';
import PvcIcon from '../icons/PVCIcon.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const pvcHelper = dependencyAccessor.get<PVCHelper>(PVCHelper);

let statusColumn = new TableColumn<PVCUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<PVCUI>('Name', {
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let storageClassColumn = new TableColumn<PVCUI, string>('Storage', {
  renderMapping: (pvc): string => pvc.storageClass,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.storageClass.localeCompare(b.storageClass),
});

let accessModesColumn = new TableColumn<PVCUI>('Mode', {
  renderer: ModeColumn,
  overflow: true,
  comparator: (a, b): number => a.accessModes.join().localeCompare(b.accessModes.join()),
});

let sizeColumn = new TableColumn<PVCUI, string>('Size', {
  renderMapping: (pvc): string => pvc.size,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.size.localeCompare(b.size),
});

let ageColumn = new TableColumn<PVCUI, Date | undefined>('Age', {
  renderMapping: (pvc): Date | undefined => pvc.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  accessModesColumn,
  storageClassColumn,
  sizeColumn,
  ageColumn,
  new TableColumn<PVCUI>('Actions', { align: 'right', renderer: ActionsColumn }),
];

const row = new TableRow<PVCUI>({ selectable: (_pvc): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'persistentvolumeclaims',
      transformer: pvcHelper.getPVCUI,
    },
  ]}
  singular="PVC"
  plural="PVCs"
  isNamespaced={true}
  icon={PvcIcon}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={PvcIcon} resources={['persistentvolumeclaims']} />
  {/snippet}
</KubernetesObjectsList>
