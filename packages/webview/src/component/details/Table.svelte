<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  children?: Snippet;
}
let { children }: Props = $props();
</script>

<div class="flex px-5 py-4 flex-col items-start h-full overflow-auto text-[var(--pd-table-body-text)]">
  <table class="w-full">
    <tbody>
      {@render children?.()}
    </tbody>
  </table>
</div>
