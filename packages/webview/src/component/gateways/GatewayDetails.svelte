<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { GatewayHelper } from './gateway-helper';
import type { GatewayUI } from './GatewayUI';
import type { KubernetesObject } from '@kubernetes/client-node';
import GatewayDetailsSummary from './GatewayDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const gatewayHelper = dependencyAccessor.get<GatewayHelper>(GatewayHelper);
</script>

<KubernetesObjectDetails
  typed={{} as KubernetesObject}
  typedUI={{} as GatewayUI}
  kind="Gateway"
  resourceName="gateways"
  listName="Gateways"
  name={name}
  namespace={namespace}
  transformer={gatewayHelper.getGatewayUI.bind(gatewayHelper)}
  SummaryComponent={GatewayDetailsSummary} />
