<script lang="ts">
import { getContext } from 'svelte';
import type { PodInfoContainerUI } from '/@/component/pods/PodUI';
import { organizeContainers } from './Dots';
import StatusDot from './StatusDot.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';

interface Props {
  containers: PodInfoContainerUI[];
}
let { containers }: Props = $props();

const organizedContainers = $derived(organizeContainers(containers));

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const kubernetesObjectUIHelper = dependencyAccessor.get<KubernetesObjectUIHelper>(KubernetesObjectUIHelper);
</script>

<!-- If containers is more than 10, we will group them and show the number of containers -->
{#if containers.length > 10}
  {#each Object.entries(organizedContainers) as [status, c] (status)}
    {#if c.length > 0}
      <StatusDot
        status={status}
        tooltip="{kubernetesObjectUIHelper.capitalize(status)}: {c.length}"
        number={c.length} />
    {/if}
  {/each}
{:else}
  {#each Object.entries(organizedContainers) as [status, c] (status)}
    {#each c as container, i (i)}
      <StatusDot status={status} name={container.Names} />
    {/each}
  {/each}
{/if}
