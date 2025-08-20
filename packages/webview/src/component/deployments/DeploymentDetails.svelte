<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import type { V1Deployment } from '@kubernetes/client-node';
import { DeploymentHelper } from './deployment-helper';
import type { DeploymentUI } from './DeploymentUI';
import DeploymentDetailsSummary from './DeploymentDetailsSummary.svelte';
import Actions from './columns/Actions.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const deploymentHelper = dependencyAccessor.get<DeploymentHelper>(DeploymentHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Deployment}
  typedUI={{} as DeploymentUI}
  kind="Deployment"
  resourceName="deployments"
  listName="Deployments"
  SummaryComponent={DeploymentDetailsSummary}
  ActionsComponent={Actions}
  name={name}
  namespace={namespace}
  transformer={deploymentHelper.getDeploymentUI.bind(deploymentHelper)} />
