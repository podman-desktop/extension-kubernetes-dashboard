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
import type { ServiceAccountUI } from './ServiceAccountUI';
import { ServiceAccountHelper } from './service-account-helper';
import ActionsColumn from './columns/Actions.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const serviceAccountHelper = dependencyAccessor.get<ServiceAccountHelper>(ServiceAccountHelper);

let statusColumn = new TableColumn<ServiceAccountUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<ServiceAccountUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let secretsColumn = new TableColumn<ServiceAccountUI, string>('Secrets', {
  renderMapping: (obj): string => String(obj.secrets),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.secrets - b.secrets,
});

let ageColumn = new TableColumn<ServiceAccountUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  secretsColumn,
  ageColumn,
  new TableColumn<ServiceAccountUI>('Actions', {
    align: 'right',
    width: '150px',
    renderer: ActionsColumn,
    overflow: true,
  }),
];

const row = new TableRow<ServiceAccountUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'serviceaccounts',
      transformer: serviceAccountHelper.getServiceAccountUI,
    },
  ]}
  singular="service account"
  plural="service accounts"
  isNamespaced={true}
  icon={icon['ServiceAccount']}
  columns={columns}
  row={row}>
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['ServiceAccount']} resources={['serviceaccounts']} />
  {/snippet}
</KubernetesObjectsList>
