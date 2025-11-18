<script lang="ts">
import type { Props } from './props';

let { object }: Props = $props();
</script>

<div class="text-(--pd-table-body-text)">
  {object.ready} / {object.replicas}
</div>
