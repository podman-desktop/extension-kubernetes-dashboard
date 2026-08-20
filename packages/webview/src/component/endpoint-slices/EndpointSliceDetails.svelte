<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { EndpointSliceHelper } from './endpoint-slice-helper';
import type { EndpointSliceUI } from './EndpointSliceUI';
import type { V1EndpointSlice } from '@kubernetes/client-node';
import EndpointSliceDetailsSummary from './EndpointSliceDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const endpointSliceHelper = dependencyAccessor.get<EndpointSliceHelper>(EndpointSliceHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1EndpointSlice}
  typedUI={{} as EndpointSliceUI}
  kind="EndpointSlice"
  resourceName="endpointslices"
  listName="Endpoint Slices"
  name={name}
  namespace={namespace}
  transformer={endpointSliceHelper.getEndpointSliceUI.bind(endpointSliceHelper)}
  SummaryComponent={EndpointSliceDetailsSummary} />
