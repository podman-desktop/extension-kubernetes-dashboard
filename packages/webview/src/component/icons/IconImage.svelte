<script lang="ts">
import type { Snippet } from 'svelte';

type Image = string | { light: string; dark: string };

interface Props {
  image?: Image;
  alt?: string;
  class?: string;
  children?: Snippet;
}
let { image, alt, class: className, children }: Props = $props();

let imgSrc = $state<string>();

$effect(() => {
  image;
  getImgSrc(image);
});

function getImage(icon?: Image): string | undefined {
  if (!icon) {
    return undefined;
  }

  if (typeof icon === 'string') {
    return icon;
  }

  // TODO: add light/dark mode support (https://github.com/podman-desktop/extension-kubernetes-dashboard/issues/369)
  if (/*isDarkTheme &&*/ icon.dark) {
    return icon.dark;
  } else if (/*!isDarkTheme &&*/ icon.light) {
    return icon.light;
  }
  return undefined;
}

function getImgSrc(image: string | { light: string; dark: string } | undefined): void {
  imgSrc = getImage(image);
}
</script>

{#if imgSrc}
  <img src={imgSrc} alt={alt} class={className} />
{:else}
  {@render children?.()}
{/if}
