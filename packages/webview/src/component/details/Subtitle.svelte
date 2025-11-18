<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  style?: string;
  children: Snippet;
}
let { style, children }: Props = $props();
</script>

<td class="pl-2 text-md font-semibold text-(--pd-table-body-text-sub-secondary) {style}">
  {@render children?.()}
</td>
