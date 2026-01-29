<script lang="ts">
import type { V1Pod } from '@kubernetes/client-node';
import { Checkbox, Dropdown, EmptyScreen } from '@podman-desktop/ui-svelte';
import NoLogIcon from '/@/component/icons/NoLogIcon.svelte';
import PodLogs from '/@/component/pods/PodLogs.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { PodLogsHelper } from '/@/component/pods/pod-logs-helper';
import { Annotations } from '/@/annotations/annotations';

interface Props {
  object: V1Pod;
}
let { object }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const podLogsHelper = dependencyAccessor.get<PodLogsHelper>(PodLogsHelper);
const annotations = dependencyAccessor.get<Annotations>(Annotations);

const runningContainers = $derived(object.status?.containerStatuses?.filter(status => status.state?.running) ?? []);

const colorsAnnotations = $derived(annotations.getAnnotations(object.metadata, { key: 'logs-colors' }));

// If no container is selected, logs for all containers are displayed
let selectedContainerName = $state<string>('');
let selectedTimestamps = $state<boolean>(false);

let containerSelection = $derived([
  { label: 'All containers', value: '' },
  ...runningContainers.map(container => ({
    label: container.name,
    value: container.name,
  })),
]);

let selectedColorizer = $derived<string>(podLogsHelper.resolveColorizer(colorsAnnotations['logs-colors']));
let colorizerSelection = podLogsHelper.getColorizers().map(colorizer => ({ label: colorizer, value: colorizer }));
</script>

{#if runningContainers.length > 0}
  <div class="flex grow flex-col h-full w-full">
    <div class="flex flex-row p-2 h-[40px] gap-2">
      {#if runningContainers.length > 1}
        <div class="w-48">
          <Dropdown
            ariaLabel="Select container"
            name="container"
            bind:value={selectedContainerName}
            options={containerSelection}>
          </Dropdown>
        </div>
      {/if}
      <div class="w-48">
        <Dropdown
          ariaLabel="Select colorization"
          name="colorizer"
          bind:value={selectedColorizer}
          options={colorizerSelection}>
        </Dropdown>
      </div>
      <div class="w-48">
        <Checkbox class="pt-2" name="timestamps" title="Show timestamps" bind:checked={selectedTimestamps}
          >Show timestamps</Checkbox>
      </div>
    </div>

    <div class="flex w-full h-full min-h-0">
      {#key [selectedContainerName, selectedColorizer, selectedTimestamps]}
        {#if selectedContainerName !== undefined}
          <PodLogs
            object={object}
            containerName={selectedContainerName}
            colorizer={selectedColorizer}
            timestamps={selectedTimestamps} />
        {/if}
      {/key}
    </div>
  </div>
{:else}
  <EmptyScreen icon={NoLogIcon} title="No Logs" message="No container running" />
{/if}
