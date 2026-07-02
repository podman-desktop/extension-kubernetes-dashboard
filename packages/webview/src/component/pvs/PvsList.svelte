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
import ActionsColumn from './columns/Actions.svelte';
import PhaseColumn from './columns/Phase.svelte';
import type { PvUI } from './PvUI';
import { PvHelper } from './pv-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const pvHelper = dependencyAccessor.get<PvHelper>(PvHelper);

let statusColumn = new TableColumn<PvUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<PvUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let storageClassColumn = new TableColumn<PvUI, string>('Storage Class', {
  renderMapping: (obj): string => obj.storageClass,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.storageClass.localeCompare(b.storageClass),
});

let capacityColumn = new TableColumn<PvUI, string>('Capacity', {
  renderMapping: (obj): string => obj.capacity,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.capacity.localeCompare(b.capacity),
});

let claimColumn = new TableColumn<PvUI, string>('Claim', {
  width: '1.5fr',
  renderMapping: (obj): string => obj.claim,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.claim.localeCompare(b.claim),
});

let pvStatusColumn = new TableColumn<PvUI>('Phase', {
  renderer: PhaseColumn,
  comparator: (a, b): number => a.pvStatus.localeCompare(b.pvStatus),
});

let accessModesColumn = new TableColumn<PvUI, string>('Access Modes', {
  renderMapping: (obj): string => obj.accessModes,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.accessModes.localeCompare(b.accessModes),
});

let reclaimPolicyColumn = new TableColumn<PvUI, string>('Reclaim Policy', {
  renderMapping: (obj): string => obj.reclaimPolicy,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.reclaimPolicy.localeCompare(b.reclaimPolicy),
});

let ageColumn = new TableColumn<PvUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

let actionsColumn = new TableColumn<PvUI>('Actions', {
  align: 'right',
  width: '150px',
  renderer: ActionsColumn,
  overflow: true,
});

const columns = [
  statusColumn,
  nameColumn,
  pvStatusColumn,
  storageClassColumn,
  capacityColumn,
  claimColumn,
  accessModesColumn,
  reclaimPolicyColumn,
  ageColumn,
  actionsColumn,
];

const row = new TableRow<PvUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'persistentvolumes',
      transformer: pvHelper.getPvUI.bind(pvHelper),
    },
  ]}
  singular="persistent volume"
  plural="persistent volumes"
  isNamespaced={false}
  icon={icon['PersistentVolume']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['PersistentVolume']} resources={['persistentvolumes']} />
  {/snippet}
</KubernetesObjectsList>
