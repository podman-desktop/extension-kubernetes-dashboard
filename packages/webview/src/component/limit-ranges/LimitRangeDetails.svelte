<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { LimitRangeHelper } from './limit-range-helper';
import type { LimitRangeUI } from './LimitRangeUI';
import type { V1LimitRange } from '@kubernetes/client-node';
import LimitRangeDetailsSummary from './LimitRangeDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const limitRangeHelper = dependencyAccessor.get<LimitRangeHelper>(LimitRangeHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1LimitRange}
  typedUI={{} as LimitRangeUI}
  kind="LimitRange"
  resourceName="limitranges"
  listName="Limit Ranges"
  name={name}
  namespace={namespace}
  transformer={limitRangeHelper.getLimitRangeUI.bind(limitRangeHelper)}
  SummaryComponent={LimitRangeDetailsSummary} />
