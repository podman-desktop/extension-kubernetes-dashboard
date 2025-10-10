<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import Actions from './columns/Actions.svelte';
import { IngressRouteHelper } from './ingress-route-helper';
import IngressRouteDetailsSummary from './IngressRouteDetailsSummary.svelte';
import type { V1Route } from '@kubernetes-dashboard/channels';
import type { RouteUI } from './RouteUI';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const ingressRouteHelper = dependencyAccessor.get<IngressRouteHelper>(IngressRouteHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Route}
  typedUI={{} as RouteUI}
  kind="Route"
  resourceName="routes"
  listName="Ingresses and Routes"
  name={name}
  namespace={namespace}
  transformer={ingressRouteHelper.getRouteUI.bind(ingressRouteHelper)}
  ActionsComponent={Actions}
  SummaryComponent={IngressRouteDetailsSummary} />
