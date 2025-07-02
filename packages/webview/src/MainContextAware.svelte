<script lang="ts">
import { setContext } from 'svelte';

import type { MainContext } from './main';
import { States } from './state/states';
import App from './App.svelte';

interface Props {
  context: MainContext;
}

const { context }: Props = $props();

let initialized = $state(false);

// Sets the value in the global svelte context
setContext(States, context.states);

initialized = true;
</script>

{#if initialized}
  <App />
{/if}
