<script lang="ts">
import { setContext } from 'svelte';

import type { MainContext } from './main';
import { States } from './state/states';
import App from './App.svelte';
import { Remote } from './remote/remote';
import { DependencyAccessor } from '/@//inject/dependency-accessor';

interface Props {
  context: MainContext;
}

const { context }: Props = $props();

let initialized = $state(false);

// Sets the value in the global svelte context
setContext(States, context.states);
setContext(Remote, context.remote);
setContext(DependencyAccessor, context.dependencyAccessor);

initialized = true;
</script>

{#if initialized}
  <App />
{/if}
