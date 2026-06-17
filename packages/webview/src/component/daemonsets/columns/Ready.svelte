<script lang="ts">
import type { Props } from './props';

let { object }: Props = $props();

let colorClass = $derived(
  object.ready === object.desired ? 'text-(--pd-status-running)' : 'text-(--pd-status-degraded)',
);
</script>

<div class={colorClass}>
  {object.ready} / {object.desired}
</div>
