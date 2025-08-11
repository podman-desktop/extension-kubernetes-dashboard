<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  style?: string;
  class?: string;
  onClick?: () => void;
  children?: Snippet;
}
let { style, class: className, onClick, children }: Props = $props();
</script>

<td class="pt-1 pl-3 {style} {className}" onclick={onClick}>
  {@render children?.()}
</td>
