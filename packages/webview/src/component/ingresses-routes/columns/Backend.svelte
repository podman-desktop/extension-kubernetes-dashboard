<script lang="ts">
import { getContext } from 'svelte';
import { IngressRouteHelper } from '../ingress-route-helper';
import type { Props } from './props';
import { DependencyAccessor } from '/@/inject/dependency-accessor';

let { object }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const ingressRouteHelper = dependencyAccessor.get<IngressRouteHelper>(IngressRouteHelper);
</script>

{#each ingressRouteHelper.getBackends(object) as backend, index (index)}
  <div class="text-[var(--pd-table-body-text)]">{backend}</div>
{/each}
