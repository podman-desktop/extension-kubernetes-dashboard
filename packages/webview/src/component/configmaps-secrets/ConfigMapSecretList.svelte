<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import moment from 'moment';
import type { ConfigMapSecretUI } from './ConfigMapSecretUI';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import TypeColumn from '/@/component/configmaps-secrets/columns/Type.svelte';
import KubernetesObjectsList from '../objects/KubernetesObjectsList.svelte';
import { ConfigMapSecretHelper } from './configmap-secret-helper';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import ConfigMapSecretIcon from '../icons/ConfigMapSecretIcon.svelte';
import KubernetesEmptyScreen from '../objects/KubernetesEmptyScreen.svelte';
import ActionsColumn from '/@/component/configmaps-secrets/columns/Actions.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const configmapSecretHelper = dependencyAccessor.get<ConfigMapSecretHelper>(ConfigMapSecretHelper);

let statusColumn = new TableColumn<ConfigMapSecretUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<ConfigMapSecretUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let ageColumn = new TableColumn<ConfigMapSecretUI, Date | undefined>('Age', {
  renderMapping: (configmapSecret): Date | undefined => configmapSecret.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

let keysColumn = new TableColumn<ConfigMapSecretUI, string>('Keys', {
  renderMapping: (config): string => config.keys.length.toString(),
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.keys.length - b.keys.length,
});

let typeColumn = new TableColumn<ConfigMapSecretUI>('Type', {
  overflow: true,
  width: '2fr',
  renderer: TypeColumn,
  comparator: (a, b): number => a.type.localeCompare(b.type),
});

const columns = [
  statusColumn,
  nameColumn,
  typeColumn,
  keysColumn,
  ageColumn,
  new TableColumn<ConfigMapSecretUI>('Actions', { align: 'right', renderer: ActionsColumn }),
];

const row = new TableRow<ConfigMapSecretUI>({ selectable: (_configmapSecret): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'configmaps',
      transformer: configmapSecretHelper.getConfigMapSecretUI,
    },
    {
      resource: 'secrets',
      transformer: configmapSecretHelper.getConfigMapSecretUI,
    },
  ]}
  singular="configmap and secret"
  plural="configmaps and secrets"
  isNamespaced={true}
  icon={ConfigMapSecretIcon}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={ConfigMapSecretIcon} resources={['configmaps', 'secrets']} />
  {/snippet}
</KubernetesObjectsList>
