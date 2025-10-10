<script lang="ts">
import { getContext } from 'svelte';
import { WorkloadKind, type ForwardConfig } from '@kubernetes-dashboard/channels';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { Navigator } from '/@/navigation/navigator';

interface Props {
  object: ForwardConfig;
}

let { object }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const navigator = dependencyAccessor.get<Navigator>(Navigator);

async function openPodDetails(): Promise<void> {
  if (object.kind !== WorkloadKind.POD) {
    throw new Error(`invalid kind: expected ${WorkloadKind.POD} received ${object.kind}`);
  }
  navigator.navigateTo({ kind: 'Pod', name: object.name, namespace: object.namespace });
}

async function openResourceDetails(): Promise<void> {
  switch (object.kind) {
    case WorkloadKind.POD:
      return openPodDetails();
    case WorkloadKind.DEPLOYMENT:
      break;
    case WorkloadKind.SERVICE:
      break;
  }
}
</script>

<button
  title="Open pod details"
  class="hover:cursor-pointer flex flex-col max-w-full"
  disabled={object.kind !== WorkloadKind.POD}
  onclick={openResourceDetails}>
  <div class="text-[var(--pd-table-body-text-highlight)] max-w-full overflow-hidden text-ellipsis">
    {object.name}
  </div>
  <div class="flex flex-row text-sm gap-1">
    {#if object.namespace}
      <div class="font-extra-light text-[var(--pd-table-body-text)]">{object.namespace}</div>
    {/if}
  </div>
</button>
