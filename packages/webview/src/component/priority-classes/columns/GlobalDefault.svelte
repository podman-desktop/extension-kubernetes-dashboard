<script lang="ts">
import { faStar } from '@fortawesome/free-solid-svg-icons';
import Fa from 'svelte-fa';

import type { Props } from './props';
import Label from '/@/component/label/Label.svelte';

let { object }: Props = $props();
</script>

{#if object.globalDefault === 'true'}
  <Label name="true">
    <Fa size="1x" icon={faStar} class="text-(--pd-status-running)" />
  </Label>
{:else}
  <span class="text-(--pd-table-body-text)">false</span>
{/if}
