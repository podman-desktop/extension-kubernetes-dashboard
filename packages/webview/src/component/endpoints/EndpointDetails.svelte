<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { EndpointHelper } from './endpoint-helper';
import type { EndpointUI } from './EndpointUI';
import type { V1Endpoints } from '@kubernetes/client-node';
import EndpointDetailsSummary from './EndpointDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const endpointHelper = dependencyAccessor.get<EndpointHelper>(EndpointHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Endpoints}
  typedUI={{} as EndpointUI}
  kind="Endpoints"
  resourceName="endpoints"
  listName="Endpoints"
  name={name}
  namespace={namespace}
  transformer={endpointHelper.getEndpointUI.bind(endpointHelper)}
  SummaryComponent={EndpointDetailsSummary} />
