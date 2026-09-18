<script lang="ts">
import { faPuzzlePiece } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@podman-desktop/ui-svelte';
import Fa from 'svelte-fa';
import NewProvider from '/@/component/icons/NewProvider.svelte';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_NAVIGATION, API_TELEMETRY } from '@kubernetes-dashboard/channels';
import Markdown from '/@/markdown/Markdown.svelte';
import product from '/@/../../../product.json' with { type: 'json' };

const remote = getContext<Remote>(Remote);
const navigationApi = remote.getProxy(API_NAVIGATION);
const telemetryApi = remote.getProxy(API_TELEMETRY);

const markdownText = product.providerMarkdownText;

async function navigateToExtensionsCatalog(): Promise<void> {
  telemetryApi.track('nocontext.extensionsCatalog').catch(console.warn);
  return navigationApi.navigateToExtensionsCatalog('category:kubernetes keyword:provider not:installed');
}
</script>

<div class="rounded-xl p-5 text-left border border-dotted border-(--pd-content-divider)">
  <div class="flex justify-left text-(--pd-details-empty-icon) py-2 mb-2">
    <NewProvider />
  </div>
  <h1 class="text-lg font-semibold mb-4">New provider</h1>

  <p class="text-sm text-(--pd-content-text) mb-6">
    {#if markdownText}
      <Markdown markdown={markdownText}></Markdown>
    {/if}
  </p>

  <Button
    type="secondary"
    on:click={navigateToExtensionsCatalog}
    class="flex items-center"
    aria-label="See available extensions">
    <Fa icon={faPuzzlePiece} size="1.2x" class="mr-1" />
    See available extensions
  </Button>
</div>
