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
</script>

{#each ingressRouteHelper.getHostPaths(object) as hostPath, index (index)}
  <div class="text-[var(--pd-table-body-text)] overflow-hidden text-ellipsis">
    {#if hostPath.url}
      <Link
        aria-label={hostPath.label}
        on:click={async (): Promise<void> => {
          if (hostPath.url) {
            await systemApi.openExternal(hostPath.url);
          }
        }}>
        {hostPath.label}
      </Link>
    {:else}
      {hostPath.label}
    {/if}
  </div>
{/each}
