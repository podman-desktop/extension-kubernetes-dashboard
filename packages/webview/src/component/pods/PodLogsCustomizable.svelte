<script lang="ts">
import type { V1Pod } from '@kubernetes/client-node';
import { Dropdown, EmptyScreen } from '@podman-desktop/ui-svelte';
import NoLogIcon from '/@/component/icons/NoLogIcon.svelte';
import PodLogs from '/@/component/pods/PodLogs.svelte';

interface Props {
  object: V1Pod;
}
let { object }: Props = $props();

const runningContainers = $derived(object.status?.containerStatuses?.filter(status => status.state?.running) ?? []);

// If no container is selected, logs for all containers are displayed
let selectedContainerName = $state<string>('');

let containerSelection = $derived([
  { label: 'All containers', value: '' },
  ...runningContainers.map(container => ({
    label: container.name,
    value: container.name,
  })),
]);
</script>

{#if runningContainers.length > 0}
  <div class="flex grow flex-col h-full w-full">
    {#if runningContainers.length > 1}
      <div class="flex p-2 h-[40px] w-full">
        <div class="w-full">
          <Dropdown
            ariaLabel="Select container"
            class="w-48"
            name="container"
            bind:value={selectedContainerName}
            options={containerSelection}>
          </Dropdown>
        </div>
      </div>
    {/if}

    <div class="flex w-full h-full min-h-0">
      {#key selectedContainerName}
        {#if selectedContainerName !== undefined}
          <PodLogs object={object} containerName={selectedContainerName} />
        {/if}
      {/key}
    </div>
  </div>
{:else}
  <EmptyScreen icon={NoLogIcon} title="No Logs" message="No container running" />
{/if}
