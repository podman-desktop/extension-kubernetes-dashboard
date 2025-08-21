<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import Actions from './columns/Actions.svelte';
import { IngressRouteHelper } from './ingress-route-helper';
import type { V1Ingress } from '@kubernetes/client-node';
import type { IngressUI } from './IngressUI';
import IngressRouteDetailsSummary from './IngressRouteDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const ingressRouteHelper = dependencyAccessor.get<IngressRouteHelper>(IngressRouteHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Ingress}
  typedUI={{} as IngressUI}
  kind="Ingress"
  resourceName="ingresses"
  listName="Ingresses and Routes"
  name={name}
  namespace={namespace}
  transformer={ingressRouteHelper.getIngressUI.bind(ingressRouteHelper)}
  ActionsComponent={Actions}
  SummaryComponent={IngressRouteDetailsSummary} />
