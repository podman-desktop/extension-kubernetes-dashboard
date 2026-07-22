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
import type { NetworkPolicyUI } from './NetworkPolicyUI';
import { NetworkPolicyHelper } from './network-policy-helper';
import PolicyTypesColumn from './columns/PolicyTypes.svelte';
import ActionsColumn from './columns/Actions.svelte';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const networkPolicyHelper = dependencyAccessor.get<NetworkPolicyHelper>(NetworkPolicyHelper);

let statusColumn = new TableColumn<NetworkPolicyUI>('Status', {
  align: 'center',
  width: '70px',
  renderer: StatusColumn,
  comparator: (a, b): number => a.status.localeCompare(b.status),
});

let nameColumn = new TableColumn<NetworkPolicyUI>('Name', {
  width: '1.3fr',
  renderer: NameColumn,
  comparator: (a, b): number => a.name.localeCompare(b.name),
});

let policyTypesColumn = new TableColumn<NetworkPolicyUI>('Policy Types', {
  overflow: true,
  renderer: PolicyTypesColumn,
  comparator: (a, b): number => a.policyTypes.localeCompare(b.policyTypes),
});

let podSelectorColumn = new TableColumn<NetworkPolicyUI, string>('Pod Selector', {
  width: '1.5fr',
  renderMapping: (obj): string => obj.podSelector,
  renderer: TableSimpleColumn,
  comparator: (a, b): number => a.podSelector.localeCompare(b.podSelector),
});

let ageColumn = new TableColumn<NetworkPolicyUI, Date | undefined>('Age', {
  renderMapping: (obj): Date | undefined => obj.created,
  renderer: TableDurationColumn,
  comparator: (a, b): number => moment(b.created).diff(moment(a.created)),
});

const columns = [
  statusColumn,
  nameColumn,
  policyTypesColumn,
  podSelectorColumn,
  ageColumn,
  new TableColumn<NetworkPolicyUI>('Actions', {
    align: 'right',
    width: '150px',
    renderer: ActionsColumn,
    overflow: true,
  }),
];

const row = new TableRow<NetworkPolicyUI>({ selectable: (_obj): boolean => true });
</script>

<KubernetesObjectsList
  kinds={[
    {
      resource: 'networkpolicies',
      transformer: networkPolicyHelper.getNetworkPolicyUI.bind(networkPolicyHelper),
    },
  ]}
  singular="network policy"
  plural="network policies"
  isNamespaced={true}
  icon={icon['NetworkPolicy']}
  columns={columns}
  row={row}>
  <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
  {#snippet emptySnippet()}
    <KubernetesEmptyScreen icon={icon['NetworkPolicy']} resources={['networkpolicies']} />
  {/snippet}
</KubernetesObjectsList>
