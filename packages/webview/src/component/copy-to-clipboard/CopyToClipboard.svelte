<script lang="ts">
import { faPaste } from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from '@podman-desktop/ui-svelte';
import { getContext } from 'svelte';
import Fa from 'svelte-fa';
import { Remote } from '/@/remote/remote';
import { API_SYSTEM } from '@kubernetes-dashboard/channels';

export let clipboardData: string;
export let title: string;

const remote = getContext<Remote>(Remote);
const systemApi = remote.getProxy(API_SYSTEM);

async function copyTextToClipboard(): Promise<void> {
  await systemApi.clipboardWriteText(clipboardData);
}
</script>

<div class="float-right">
  <Tooltip bottom tip="Copy to Clipboard">
    <button
      title="Copy To Clipboard"
      class="ml-5 {$$props.class ?? ''}"
      aria-label="Copy To Clipboard"
      on:click={copyTextToClipboard}>
      <Fa icon={faPaste} />
    </button>
  </Tooltip>
</div>
<div class="mt-1 my-auto text-xs truncate {$$props.class ?? ''}" aria-label="{title} copy to clipboard" title={title}>
  {title}
</div>
