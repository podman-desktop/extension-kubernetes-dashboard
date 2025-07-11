<script lang="ts">
import { NavPage } from '@podman-desktop/ui-svelte';
import DashboardResources from './DashboardResources.svelte';
</script>

<NavPage searchEnabled={false} title="Dashboard">
  {#snippet content()}
    <DashboardResources />
  {/snippet}
</NavPage>
