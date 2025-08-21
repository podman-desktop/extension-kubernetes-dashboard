<script lang="ts">
import type { V1Ingress } from '@kubernetes/client-node';
import type { V1Route } from '/@common/model/openshift-types';
import Table from '/@/component/details/Table.svelte';
import ObjectMetaDetails from '/@/component/objects/details/ObjectMetaDetails.svelte';
import IngressStatusDetails from './details/IngressStatusDetails.svelte';
import IngressSpecDetails from './details/IngressSpecDetails.svelte';
import RouteSpecDetails from './details/RouteSpecDetails.svelte';

interface Props {
  object: V1Ingress | V1Route;
}
let { object }: Props = $props();

// Determine if the artifact is an Ingress or a Route
function isIngress(object: V1Ingress | V1Route): object is V1Ingress {
  return object.kind === 'Ingress';
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
  {:else}
    <!-- Routes are shown / structured quite differently than Kubernetes, so we will show these separate. -->
    {#if object.spec}
      <RouteSpecDetails spec={object.spec} />
    {/if}
  {/if}
</Table>
