<script lang="ts">
import { TableColumn, TableDurationColumn, TableRow } from '@podman-desktop/ui-svelte';
import moment from 'moment';
import NameColumn from '/@/component/objects/columns/Name.svelte';
import StatusColumn from '/@/component/objects/columns/Status.svelte';
import KubernetesObjectsList from '../objects/KubernetesObjectsList.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesEmptyScreen from '../objects/KubernetesEmptyScreen.svelte';
import type { DeploymentUI } from './DeploymentUI';
import { DeploymentHelper } from './deployment-helper';
import DeploymentIcon from '../icons/DeploymentIcon.svelte';
import ConditionsColumn from './columns/Conditions.svelte';
import PodsColumn from './columns/Pods.svelte';
import ActionsColumn from './columns/Actions.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const deploymenttHelper = dependencyAccessor.get<DeploymentHelper>(DeploymentHelper);

let statusColumn = new TableColumn<DeploymentUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<DeploymentUI>('Name', {
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let conditionsColumn = new TableColumn<DeploymentUI>('Conditions', {
  width: '2fr',
  overflow: true,
  renderer: ConditionsColumn,
});

let podsColumn = new TableColumn<DeploymentUI>('Pods', {
  renderer: PodsColumn,
});

let ageColumn = new TableColumn<DeploymentUI, Date | undefined>('Age', {
  renderMapping: (deployment): Date | undefined => deployment.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  conditionsColumn,
  podsColumn,
  ageColumn,
  new TableColumn<DeploymentUI>('Actions', { align: 'right', renderer: ActionsColumn }),
];

const row = new TableRow<DeploymentUI>({ selectable: (_deployment): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'deployments',
      transformer: deploymenttHelper.getDeploymentUI,
    },
  ]}
  singular="deployment"
  plural="deployments"
  isNamespaced={true}
  icon={DeploymentIcon}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={DeploymentIcon} resources={['deployments']} />
  {/snippet}
</KubernetesObjectsList>
