<script lang="ts">
import { createRouteObject } from 'tinro/dist/tinro_lib';
import type { TinroRouteMeta } from 'tinro';
import type { RouterState } from './models/router-state';
import type { WebviewApi } from '@podman-desktop/webview-api';
import { getContext } from 'svelte';

export let path = '/*';
export let fallback = false;
export let redirect = false;
export let firstmatch = false;

export let isAppMounted: boolean = false;

let showContent = false;
let params: Record<string, string> = {};
let meta: TinroRouteMeta = {} as TinroRouteMeta;

const webviewApi = getContext<WebviewApi>('WebviewApi');

const route = createRouteObject({
  fallback,
  onShow() {
    showContent = true;
  },
  onHide() {
    showContent = false;
  },
  onMeta(newMeta: TinroRouteMeta) {
    meta = newMeta;
    params = meta.params;

    if (isAppMounted) {
      saveRouterState({ url: newMeta.url }).catch(console.error);
    }
  },
});

$: route.update({
  path,
  redirect,
  firstmatch,
});

async function saveRouterState(state: RouterState): Promise<void> {
  await webviewApi.setState(state);
}
</script>

{#if showContent}
  <slot params={params} meta={meta} />
{/if}
