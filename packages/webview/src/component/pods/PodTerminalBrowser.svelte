<script lang="ts">
import type { V1Pod } from '@kubernetes/client-node';
import { Dropdown, EmptyScreen } from '@podman-desktop/ui-svelte';
import NoLogIcon from '../icons/NoLogIcon.svelte';
import PodTerminal from './PodTerminal.svelte';
import { onMount } from 'svelte';

interface Props {
  object: V1Pod;
}
let { object }: Props = $props();

const runningContainers = $derived(object.status?.containerStatuses?.filter(status => status.state?.running) ?? []);

let selectedContainerName = $state('');

onMount(() => {
  selectedContainerName = runningContainers?.[0]?.name ?? '';
});
</script>

{#if runningContainers.length > 0}
  <div class="flex grow flex-col h-full w-full">
    {#if runningContainers.length > 1}
      <div class="flex p-2 h-[40px] w-full">
        <div class="w-full">
          <Dropdown
            class="w-48"
            name="container"
            bind:value={selectedContainerName}
            options={runningContainers.map(container => ({
              label: container.name,
              value: container.name,
            }))}>
          </Dropdown>
        </div>
      </div>
    {/if}

    <div class="flex w-full h-full min-h-0">
      {#key selectedContainerName}
        <PodTerminal object={object} containerName={selectedContainerName} />
      {/key}
    </div>
  </div>
{:else}
  <EmptyScreen icon={NoLogIcon} title="No Terminal" message="No container running" />
{/if}
