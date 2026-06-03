<script lang="ts">
import type { Component } from 'svelte';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '@podman-desktop/ui-svelte/icons';
import { icon } from './icon';
import KubeIcon from './KubeIcon.svelte';
import { isFontAwesomeIcon } from '@podman-desktop/ui-svelte';

interface Props {
  kind: string;
  size?: string;
}
let { kind, size = '1em' }: Props = $props();

const resolvedIcon: Component | IconDefinition = $derived.by(() => {
  return icon[kind] || KubeIcon;
});

const isFa = $derived(isFontAwesomeIcon(resolvedIcon));
</script>

{#if isFa}
  <Icon icon={resolvedIcon as IconDefinition} size={size} />
{:else}
  {@const SvelteIcon = resolvedIcon as Component<{ size?: string }>}
  <SvelteIcon size={size} />
{/if}
