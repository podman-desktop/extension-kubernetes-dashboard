<script lang="ts">
import { Expandable } from '@podman-desktop/ui-svelte';
import DashboardResources from './DashboardResources.svelte';
import CurrentContextConnectionBadge from '/@/component/connection/CurrentContextConnectionBadge.svelte';
</script>

<div class="flex flex-col w-full h-full pt-4">
  <!-- Details - collapsible -->
  <div class="flex flex-row w-full px-5 pb-2">
    <Expandable>
      <!-- eslint-disable-next-line sonarjs/no-unused-vars -->
      {#snippet title()}
        <div class="flex flex-row w-full items-center">
          <div class="text-xl font-bold capitalize text-[var(--pd-content-header)]">Dashboard</div>
          <div class="flex grow justify-end"><CurrentContextConnectionBadge /></div>
        </div>
      {/snippet}
      <div class="flex flex-col gap-4">
        <div>
          Here you can manage and interact with Kubernetes clusters with features like connecting to clusters, and
          viewing workloads like deployments and services.
        </div>
        <div>Get up and running by clicking one of the menu items!</div>
      </div>
    </Expandable>
  </div>

  <div class="flex w-full h-full overflow-auto">
    <div class="flex min-w-full h-full justify-center">
      <div class="flex flex-col space-y-4 min-w-full overflow-y-auto">
        <div class="flex flex-col gap-4 bg-[var(--pd-content-card-bg)] grow p-5">
          <!-- Metrics - non-collapsible -->
          <div class="flex flex-row">
            <div class="text-xl pt-2 grow">Metrics</div>
          </div>
          <DashboardResources />
        </div>
      </div>
    </div>
  </div>
</div>
