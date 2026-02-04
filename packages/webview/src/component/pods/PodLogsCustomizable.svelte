<script lang="ts">
import type { V1Pod } from '@kubernetes/client-node';
import { Checkbox, Dropdown, EmptyScreen, Input } from '@podman-desktop/ui-svelte';
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

const DEBOUNCE_DELAY = 1000;

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const podLogsHelper = dependencyAccessor.get<PodLogsHelper>(PodLogsHelper);
const annotations = dependencyAccessor.get<Annotations>(Annotations);

const runningContainers = $derived(object.status?.containerStatuses?.filter(status => status.state?.running) ?? []);

const colorsAnnotations = $derived(annotations.getAnnotations(object.metadata, { key: 'logs-colors' }));
const timestampsAnnotations = $derived(annotations.getAnnotations(object.metadata, { key: 'logs-timestamps' }));
const tailLinesAnnotations = $derived(annotations.getAnnotations(object.metadata, { key: 'logs-tail-lines' }));
const sinceSecondsAnnotations = $derived(annotations.getAnnotations(object.metadata, { key: 'logs-since-seconds' }));

// If no container is selected, logs for all containers are displayed
let selectedContainerName = $state<string>('');
let selectedTimestamps = $derived<boolean>(timestampsAnnotations['logs-timestamps'] === 'true');
let selectedPrevious = $state<boolean>(false);
let tailLines = $derived<string>(tailLinesAnnotations['logs-tail-lines']);
let sinceSeconds = $derived<string>(sinceSecondsAnnotations['logs-since-seconds']);

let containerSelection = $derived([
  { label: 'All containers', value: '' },
  ...runningContainers.map(container => ({
    label: container.name,
    value: container.name,
  })),
]);

let selectedColorizer = $derived<string>(podLogsHelper.resolveColorizer(colorsAnnotations['logs-colors']));
let colorizerSelection = podLogsHelper.getColorizers().map(colorizer => ({ label: colorizer, value: colorizer }));

function onTailLinesInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  tailLines = input.value;
}

function onSinceSecondsInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  sinceSeconds = input.value;
}

function debounce(func: (event: Event) => void, delay: number): (event: Event) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (event: Event) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(event), delay);
  };
}
</script>

{#if runningContainers.length > 0}
  <div class="flex grow flex-col h-full w-full">
    <div class="flex flex-wrap flex-row p-2 h-min-[40px] gap-x-4">
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
      <div>
        <Checkbox class="pt-2" name="timestamps" title="Show timestamps" bind:checked={selectedTimestamps}
          >Show timestamps</Checkbox>
      </div>
      <div>
        <Checkbox class="pt-2" name="previous" title="Previous logs" bind:checked={selectedPrevious}
          >Previous logs</Checkbox>
      </div>
      <div>
        <Input
          id="tailLines"
          type="number"
          placeholder="All"
          aria-label="Last lines"
          class="w-20 pt-1"
          value={tailLines}
          oninput={debounce(onTailLinesInput, DEBOUNCE_DELAY)}>
          {#snippet right()}<div>lines</div>{/snippet}
        </Input>
      </div>
      <div>
        <Input
          type="number"
          placeholder="All"
          aria-label="Last seconds"
          class="w-26 pt-1"
          value={sinceSeconds}
          oninput={debounce(onSinceSecondsInput, DEBOUNCE_DELAY)}>
          {#snippet right()}<div>seconds</div>{/snippet}
        </Input>
      </div>
    </div>

    <div class="flex w-full h-full min-h-0">
      {#key [selectedContainerName, selectedColorizer, selectedTimestamps, selectedPrevious, tailLines, sinceSeconds]}
        {#if selectedContainerName !== undefined}
          <PodLogs
            object={object}
            containerName={selectedContainerName}
            colorizer={selectedColorizer}
            timestamps={selectedTimestamps}
            previous={selectedPrevious}
            tailLines={tailLines}
            sinceSeconds={sinceSeconds} />
        {/if}
      {/key}
    </div>
  </div>
{:else}
  <EmptyScreen icon={NoLogIcon} title="No Logs" message="No container running" />
{/if}
