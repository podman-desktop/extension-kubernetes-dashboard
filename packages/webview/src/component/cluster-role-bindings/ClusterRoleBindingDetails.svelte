<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ClusterRoleBindingHelper } from './cluster-role-binding-helper';
import type { ClusterRoleBindingUI } from './ClusterRoleBindingUI';
import type { V1ClusterRoleBinding } from '@kubernetes/client-node';
import ClusterRoleBindingDetailsSummary from './ClusterRoleBindingDetailsSummary.svelte';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const clusterRoleBindingHelper = dependencyAccessor.get<ClusterRoleBindingHelper>(ClusterRoleBindingHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1ClusterRoleBinding}
  typedUI={{} as ClusterRoleBindingUI}
  kind="ClusterRoleBinding"
  resourceName="clusterrolebindings"
  listName="Cluster Role Bindings"
  name={name}
  transformer={clusterRoleBindingHelper.getClusterRoleBindingUI.bind(clusterRoleBindingHelper)}
  SummaryComponent={ClusterRoleBindingDetailsSummary} />
