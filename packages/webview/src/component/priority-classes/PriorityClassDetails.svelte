<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { PriorityClassHelper } from './priority-class-helper';
import type { PriorityClassUI } from './PriorityClassUI';
import type { V1PriorityClass } from '@kubernetes/client-node';
import PriorityClassDetailsSummary from './PriorityClassDetailsSummary.svelte';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const priorityClassHelper = dependencyAccessor.get<PriorityClassHelper>(PriorityClassHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1PriorityClass}
  typedUI={{} as PriorityClassUI}
  kind="PriorityClass"
  resourceName="priorityclasses"
  listName="Priority Classes"
  name={name}
  transformer={priorityClassHelper.getPriorityClassUI.bind(priorityClassHelper)}
  SummaryComponent={PriorityClassDetailsSummary} />
