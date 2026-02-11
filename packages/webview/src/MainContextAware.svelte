<script lang="ts">
import { setContext } from 'svelte';

import type { MainContext } from '/@/main';
import { States } from '/@/state/states';
import App from '/@/App.svelte';
import { Remote } from '/@/remote/remote';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { RpcBrowser } from '@kubernetes-dashboard/rpc';
import { Streams } from './stream/streams';

interface Props {
  context: MainContext;
}

const { context }: Props = $props();

// eslint-disable-next-line no-useless-assignment
let initialized = $state(false);

// Sets the value in the global svelte context
setContext(States, context.states);
setContext(Streams, context.streams);
setContext(Remote, context.remote);
setContext(DependencyAccessor, context.dependencyAccessor);
setContext(RpcBrowser, context.rpcBrowser);

initialized = true;
</script>

{#if initialized}
  <App />
{/if}
