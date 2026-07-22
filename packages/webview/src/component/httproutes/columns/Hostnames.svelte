<script lang="ts">
import { Link } from '@podman-desktop/ui-svelte';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_SYSTEM } from '@kubernetes-dashboard/channels';

import type { Props } from './props';

let { object }: Props = $props();

const remote = getContext<Remote>(Remote);
const systemApi = remote.getProxy(API_SYSTEM);

async function openExternal(hostname: string): Promise<void> {
  await systemApi.openExternal(`https://${hostname}`);
}
</script>

<div class="flex flex-col gap-0.5">
  {#each object.hostnames as hostname (hostname)}
    <div class="text-(--pd-table-body-text) overflow-hidden text-ellipsis">
      <Link aria-label={hostname} on:click={openExternal.bind(undefined, hostname)}>
        {hostname}
      </Link>
    </div>
  {/each}
</div>
