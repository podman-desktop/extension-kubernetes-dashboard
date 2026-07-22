<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { NetworkPolicyHelper } from './network-policy-helper';
import type { NetworkPolicyUI } from './NetworkPolicyUI';
import type { V1NetworkPolicy } from '@kubernetes/client-node';
import NetworkPolicyDetailsSummary from './NetworkPolicyDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const networkPolicyHelper = dependencyAccessor.get<NetworkPolicyHelper>(NetworkPolicyHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1NetworkPolicy}
  typedUI={{} as NetworkPolicyUI}
  kind="NetworkPolicy"
  resourceName="networkpolicies"
  listName="Network Policies"
  name={name}
  namespace={namespace}
  transformer={networkPolicyHelper.getNetworkPolicyUI.bind(networkPolicyHelper)}
  SummaryComponent={NetworkPolicyDetailsSummary} />
