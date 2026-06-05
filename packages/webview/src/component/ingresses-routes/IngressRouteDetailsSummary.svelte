<script lang="ts">
import type { V1Ingress } from '@kubernetes/client-node';
import type { V1HTTPRoute, V1Route } from '@kubernetes-dashboard/channels';
import Table from '/@/component/details/Table.svelte';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import HTTPRouteSpecDetails from './details/HTTPRouteSpecDetails.svelte';
import IngressStatusDetails from './details/IngressStatusDetails.svelte';
import IngressSpecDetails from './details/IngressSpecDetails.svelte';
import RouteSpecDetails from './details/RouteSpecDetails.svelte';

type IngressRouteDetailsObject = V1Ingress | V1Route | V1HTTPRoute;

interface Props {
  object: IngressRouteDetailsObject;
}
let { object }: Props = $props();

function isIngress(object: IngressRouteDetailsObject): object is V1Ingress {
  return object.kind === 'Ingress';
}

function isHTTPRoute(object: IngressRouteDetailsObject): object is V1HTTPRoute {
  return object.kind === 'HTTPRoute';
}
</script>

<Table>
  {#if object.metadata}
    <ObjectMetaDetails artifact={object.metadata} />
  {/if}
  {#if isIngress(object)}
    {#if object.status}
      <IngressStatusDetails status={object.status} />
    {/if}
    {#if object.spec}
      <IngressSpecDetails spec={object.spec} />
    {/if}
  {:else if isHTTPRoute(object)}
    {#if object.spec}
      <HTTPRouteSpecDetails spec={object.spec} />
    {/if}
  {:else}
    <!-- Routes are shown / structured quite differently than Kubernetes, so we will show these separate. -->
    {#if object.spec}
      <RouteSpecDetails spec={object.spec} />
    {/if}
  {/if}
</Table>
