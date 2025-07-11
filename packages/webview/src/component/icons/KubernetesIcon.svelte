<script lang="ts">
import type { Component } from 'svelte';
import { icon } from './icon';
import KubeIcon from './KubeIcon.svelte';

interface Props {
  kind: string;
  size?: string;
}
let { kind, size = '1em' }: Props = $props();

let Icon: Component = $derived.by(() => {
  return icon[kind] || KubeIcon;
});
</script>

<Icon size={size} />
