<script lang="ts">
import { setContext } from 'svelte';
import type { MainContext } from './main';
import type { RpcBrowser } from '/@common/rpc/rpc';
import ActiveResourceCount from './component/dashboard/ActiveResourceCount.svelte';

interface Props {
  context: MainContext;
}

const { context }: Props = $props();

let initialized = $state(false);
// Sets the value in the global svelte context
setContext<RpcBrowser>('RpcBrowser', context.rpcBrowser);
initialized = true;
</script>

{#if initialized}
  <h1>Kubernetes Dashboard</h1>

  <ActiveResourceCount />
{/if}
