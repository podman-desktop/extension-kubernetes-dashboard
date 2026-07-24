<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import moment from 'moment';

import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '/@/component/objects/KubernetesObjectsList.svelte';
import ActionsColumn from './columns/Actions.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '/@/component/objects/KubernetesEmptyScreen.svelte';
import { icon } from '/@/component/icons/icon';
import type { LeaseUI } from './LeaseUI';
import { LeaseHelper } from './lease-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const leaseHelper = dependencyAccessor.get<LeaseHelper>(LeaseHelper);

let statusColumn = new TableColumn<LeaseUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<LeaseUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let holderColumn = new TableColumn<LeaseUI, string>('Holder', {
  renderMapping: (obj): string => obj.holder,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.holder.localeCompare(b.holder),
});

let leaseDurationColumn = new TableColumn<LeaseUI, string>('Lease Duration', {
  renderMapping: (obj): string => obj.leaseDuration,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.leaseDuration.localeCompare(b.leaseDuration),
});

let renewTimeColumn = new TableColumn<LeaseUI, string>('Renew Time', {
  renderMapping: (obj): string => obj.renewTime,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.renewTime.localeCompare(b.renewTime),
});

let ageColumn = new TableColumn<LeaseUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  holderColumn,
  leaseDurationColumn,
  renewTimeColumn,
  ageColumn,
  new TableColumn<LeaseUI>('Actions', { align: 'right', width: '150px', renderer: ActionsColumn, overflow: true }),
];

const row = new TableRow<LeaseUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'leases',
      transformer: leaseHelper.getLeaseUI,
    },
  ]}
  singular="lease"
  plural="leases"
  isNamespaced={true}
  icon={icon['Lease']}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['Lease']} resources={['leases']} />
  {/snippet}
</KubernetesObjectsList>
