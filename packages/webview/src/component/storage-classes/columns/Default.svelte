<script lang="ts">
import type { Props } from './props';

let { object }: Props = $props();
</script>

<span class="text-(--pd-table-body-text)">{object.isDefault}</span>
