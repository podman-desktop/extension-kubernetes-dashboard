<script lang="ts">
import { Link } from '@podman-desktop/ui-svelte';

import type { Props } from './props';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { IngressRouteHelper } from '/@/component/ingresses-routes/ingress-route-helper';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_SYSTEM } from '@kubernetes-dashboard/channels';

let { object }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const ingressRouteHelper = dependencyAccessor.get<IngressRouteHelper>(IngressRouteHelper);

const remote = getContext<Remote>(Remote);
const systemApi = remote.getProxy(API_SYSTEM);

async function openExternal(url: string | undefined): Promise<void> {
  if (url) {
    await systemApi.openExternal(url);
  }
}
</script>

{#each ingressRouteHelper.getHostPaths(object) as hostPath, index (index)}
  <div class="text-(--pd-table-body-text) overflow-hidden text-ellipsis">
    {#if hostPath.url}
      <Link aria-label={hostPath.label} on:click={openExternal.bind(undefined, hostPath.url)}>
        {hostPath.label}
      </Link>
    {:else}
      {hostPath.label}
    {/if}
  </div>
{/each}
