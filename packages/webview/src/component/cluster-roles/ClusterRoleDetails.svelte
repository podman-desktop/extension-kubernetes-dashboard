<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ClusterRoleHelper } from './cluster-role-helper';
import type { ClusterRoleUI } from './ClusterRoleUI';
import type { V1ClusterRole } from '@kubernetes/client-node';
import ClusterRoleDetailsSummary from './ClusterRoleDetailsSummary.svelte';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const clusterRoleHelper = dependencyAccessor.get<ClusterRoleHelper>(ClusterRoleHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1ClusterRole}
  typedUI={{} as ClusterRoleUI}
  kind="ClusterRole"
  resourceName="clusterroles"
  listName="Cluster Roles"
  name={name}
  transformer={clusterRoleHelper.getClusterRoleUI.bind(clusterRoleHelper)}
  SummaryComponent={ClusterRoleDetailsSummary} />
