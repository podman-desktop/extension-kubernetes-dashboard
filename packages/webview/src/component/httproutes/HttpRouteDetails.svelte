<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { HttpRouteHelper } from './httproute-helper';
import type { HttpRouteUI } from './HttpRouteUI';
import type { KubernetesObject } from '@kubernetes/client-node';
import HttpRouteDetailsSummary from './HttpRouteDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const httpRouteHelper = dependencyAccessor.get<HttpRouteHelper>(HttpRouteHelper);
</script>

<KubernetesObjectDetails
  typed={{} as KubernetesObject}
  typedUI={{} as HttpRouteUI}
  kind="HTTPRoute"
  resourceName="httproutes"
  listName="HTTPRoutes"
  name={name}
  namespace={namespace}
  transformer={httpRouteHelper.getHttpRouteUI.bind(httpRouteHelper)}
  SummaryComponent={HttpRouteDetailsSummary} />
