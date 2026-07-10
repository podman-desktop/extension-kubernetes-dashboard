<script lang="ts">
import Route from '/@/Route.svelte';
// import globally the monaco environment
import './monaco-environment';
import { getContext, onDestroy, onMount } from 'svelte';
import { States } from './state/states';
import NoSelectedContextPage from './component/dashboard/NoSelectedContextPage.svelte';
import NoContextPage from './component/dashboard/NoContextPage.svelte';
import type { Unsubscriber } from 'svelte/store';
import AppWithContext from './AppWithContext.svelte';
import { router } from 'tinro';
import type { RouterState } from '/@/models/router-state';
import type { WebviewApi } from '@podman-desktop/webview-api';

let isMounted = $state(false);

const webviewApi = getContext<WebviewApi>('WebviewApi');
const states = getContext<States>(States);
const currentContext = states.stateCurrentContextInfoUI;
const availableContexts = states.stateAvailableContextsInfoUI;
const currentContextName = $derived(currentContext.data?.contextName);

function getRouterState(): RouterState {
  const state = webviewApi.getState() as RouterState | undefined;
  if (state?.url) {
    return state;
  }
  return { url: '/' };
}

let unsubscribers: Unsubscriber[] = [];
onMount(() => {
  const state = getRouterState();
  router.goto(state.url);
  isMounted = true;

  unsubscribers.push(currentContext.subscribe());
});

onDestroy(() => {
  unsubscribers.forEach(unsubscriber => unsubscriber());
  unsubscribers = [];
});

function waitThrottleDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 500));
}
</script>

<Route path="/*" isAppMounted={isMounted} let:meta>
  <main class="flex flex-col w-screen h-screen overflow-hidden bg-(--pd-content-bg) text-base">
    <div class="flex flex-row w-full h-full overflow-hidden">
      {#if !currentContextName}
        {#await waitThrottleDelay() then _}
          <div class="flex flex-col w-full h-full overflow-hidden">
            {#if availableContexts.data?.contextNames && availableContexts.data.contextNames.length > 0}
              <NoSelectedContextPage availableContexts={availableContexts.data?.contextNames} />
            {:else}
              <NoContextPage />
            {/if}
          </div>
        {/await}
      {:else}
        <AppWithContext meta={meta} />
      {/if}
    </div>
  </main>
</Route>
