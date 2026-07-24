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
import type { ResourceQuotaUI } from './ResourceQuotaUI';
import { ResourceQuotaHelper } from './resource-quota-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const resourceQuotaHelper = dependencyAccessor.get<ResourceQuotaHelper>(ResourceQuotaHelper);

let statusColumn = new TableColumn<ResourceQuotaUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<ResourceQuotaUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let requestCountColumn = new TableColumn<ResourceQuotaUI, string>('Request Count', {
  renderMapping: (obj): string => String(obj.requestCount),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.requestCount - b.requestCount,
});

let ageColumn = new TableColumn<ResourceQuotaUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  requestCountColumn,
  ageColumn,
  new TableColumn<ResourceQuotaUI>('Actions', {
    align: 'right',
    width: '150px',
    renderer: ActionsColumn,
    overflow: true,
  }),
];

const row = new TableRow<ResourceQuotaUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'resourcequotas',
      transformer: resourceQuotaHelper.getResourceQuotaUI,
    },
  ]}
  singular="resource quota"
  plural="resource quotas"
  isNamespaced={true}
  icon={icon['ResourceQuota']}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['ResourceQuota']} resources={['resourcequotas']} />
  {/snippet}
</KubernetesObjectsList>
