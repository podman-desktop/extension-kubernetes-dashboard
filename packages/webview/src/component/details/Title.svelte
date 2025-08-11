<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  children?: Snippet;
}
let { children }: Props = $props();
</script>

<td class="pt-1 text-lg font-semibold text-[var(--pd-table-body-text-sub-secondary)]">
  {@render children?.()}
</td>
