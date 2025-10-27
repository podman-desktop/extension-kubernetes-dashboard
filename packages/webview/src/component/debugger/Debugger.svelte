<script lang="ts">
import { getContext, onDestroy, onMount } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_CONTEXTS, type ContextsApi } from '@kubernetes-dashboard/channels';
import { NavPage } from '@podman-desktop/ui-svelte';
import { States } from '/@/state/states';
import type { Unsubscriber } from 'svelte/store';
import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import IconButton from '/@/component/button/IconButton.svelte';

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy<ContextsApi>(API_CONTEXTS);
const states = getContext<States>(States);
const debuggerInfo = states.stateDebuggerInfoUI;

let unsubscriber: Unsubscriber | undefined;

onMount(() => {
  unsubscriber = debuggerInfo.subscribe();
});

onDestroy(() => {
  unsubscriber?.();
  unsubscriber = undefined;
});
</script>

<NavPage searchEnabled={false} title="Debugger">
  {#snippet additionalActions()}
    <div class="flex grow justify-end">
      <IconButton
        enabled={!debuggerInfo.data?.active}
        title="Start debugger"
        onClick={async (): Promise<void> => {
          await contextsApi.setStepByStepMode(true);
        }}
        icon={faPlay} />
      <IconButton
        enabled={debuggerInfo.data?.active}
        title="Stop debugger"
        onClick={async (): Promise<void> => {
          await contextsApi.setStepByStepMode(false);
        }}
        icon={faStop} />
    </div>
  {/snippet}
</NavPage>
