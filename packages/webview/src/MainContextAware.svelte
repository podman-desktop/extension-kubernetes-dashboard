<script lang="ts">
import { setContext } from 'svelte';

import type { MainContext } from './main';
import { States } from './state/states';
import App from './App.svelte';
import { Remote } from './remote/remote';
import { Container } from 'inversify';
import { DependencyGetter } from './inject/dependency-getter';

interface Props {
  context: MainContext;
}

const { context }: Props = $props();

let initialized = $state(false);

// Sets the value in the global svelte context
setContext(States, context.states);
setContext(Remote, context.remote);
setContext(DependencyGetter, context.dependencyGetter);

initialized = true;
</script>

{#if initialized}
  <App />
{/if}
