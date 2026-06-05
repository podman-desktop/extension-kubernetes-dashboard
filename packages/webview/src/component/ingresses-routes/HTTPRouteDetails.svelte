<script lang="ts">
import { getContext } from 'svelte';

import type { V1HTTPRoute } from '@kubernetes-dashboard/channels';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import Actions from './columns/Actions.svelte';
import type { HTTPRouteUI } from './HTTPRouteUI';
import { IngressRouteHelper } from './ingress-route-helper';
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
  typed={{} as V1HTTPRoute}
  typedUI={{} as HTTPRouteUI}
  kind="HTTPRoute"
  resourceName="httproutes"
  listName="Ingresses, Routes, and HTTPRoutes"
  name={name}
  namespace={namespace}
  transformer={ingressRouteHelper.getHTTPRouteUI.bind(ingressRouteHelper)}
  ActionsComponent={Actions}
  SummaryComponent={IngressRouteDetailsSummary} />
