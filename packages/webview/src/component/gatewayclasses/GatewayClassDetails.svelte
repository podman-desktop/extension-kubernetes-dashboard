<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { GatewayClassHelper } from './gatewayclass-helper';
import type { GatewayClassUI } from './GatewayClassUI';
import type { KubernetesObject } from '@kubernetes/client-node';
import GatewayClassDetailsSummary from './GatewayClassDetailsSummary.svelte';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const gatewayClassHelper = dependencyAccessor.get<GatewayClassHelper>(GatewayClassHelper);
</script>

<KubernetesObjectDetails
  typed={{} as KubernetesObject}
  typedUI={{} as GatewayClassUI}
  kind="GatewayClass"
  resourceName="gatewayclasses"
  listName="Gateway Classes"
  name={name}
  transformer={gatewayClassHelper.getGatewayClassUI.bind(gatewayClassHelper)}
  SummaryComponent={GatewayClassDetailsSummary} />
