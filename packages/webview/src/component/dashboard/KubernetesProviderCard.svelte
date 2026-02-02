<script lang="ts">
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { API_NAVIGATION, API_TELEMETRY, type KubernetesProvider } from '@kubernetes-dashboard/channels';
import { Button } from '@podman-desktop/ui-svelte';
import Fa from 'svelte-fa';
import IconImage from '/@/component/icons/IconImage.svelte';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import Markdown from '/@/markdown/Markdown.svelte';

interface Props {
  provider: KubernetesProvider;
}

let { provider }: Props = $props();

const remote = getContext<Remote>(Remote);
const navigationApi = remote.getProxy(API_NAVIGATION);
const telemetryApi = remote.getProxy(API_TELEMETRY);

async function createNew(): Promise<void> {
  telemetryApi.track('nocontext.createNew', { provider: provider.id }).catch(console.warn);
  return navigationApi.navigateToProviderNewConnection(provider.id);
}
</script>

<div class="rounded-xl p-5 text-left bg-(--pd-content-card-bg)">
  <div class="flex justify-left text-(--pd-details-empty-icon) py-2 mb-2">
    <IconImage image={provider?.images?.icon} class="mx-0 max-h-10" alt={provider.creationDisplayName}></IconImage>
  </div>
  <h1 class="text-lg font-semibold mb-4">
    {provider.creationDisplayName ?? 'Create'}
  </h1>

  <p class="text-sm text-(--pd-content-text) mb-6">
    <Markdown markdown={provider.emptyConnectionMarkdownDescription} />
  </p>

  <Button
    type="primary"
    on:click={createNew}
    class="flex items-center"
    aria-label={provider.creationButtonTitle ?? 'Create new'}>
    <Fa icon={faPlusCircle} size="1.2x" class="mr-1" />
    {provider.creationButtonTitle ?? 'Create new'}
  </Button>
</div>
