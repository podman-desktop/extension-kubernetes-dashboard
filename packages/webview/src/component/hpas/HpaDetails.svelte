<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { HpaHelper } from './hpa-helper';
import type { HpaUI } from './HpaUI';
import type { V2HorizontalPodAutoscaler } from '@kubernetes/client-node';
import HpaDetailsSummary from './HpaDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const hpaHelper = dependencyAccessor.get<HpaHelper>(HpaHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V2HorizontalPodAutoscaler}
  typedUI={{} as HpaUI}
  kind="HorizontalPodAutoscaler"
  resourceName="horizontalpodautoscalers"
  listName="Horizontal Pod Autoscalers"
  name={name}
  namespace={namespace}
  transformer={hpaHelper.getHpaUI.bind(hpaHelper)}
  SummaryComponent={HpaDetailsSummary} />
