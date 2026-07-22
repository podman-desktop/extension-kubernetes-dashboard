<script lang="ts">
import { faArrowDown, faArrowUp, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import Fa from 'svelte-fa';

import type { Props } from './props';
import Label from '/@/component/label/Label.svelte';

let { object }: Props = $props();

function getTypeAttributes(type: string): { color: string; icon: IconDefinition } {
  switch (type.trim()) {
    case 'Ingress':
      return { color: 'text-(--pd-badge-sky)', icon: faArrowDown };
    case 'Egress':
      return { color: 'text-(--pd-badge-purple)', icon: faArrowUp };
    default:
      return { color: 'text-(--pd-badge-gray)', icon: faArrowDown };
  }
}
</script>

<div class="flex flex-row gap-1">
  {#each object.policyTypes.split(',').filter(Boolean) as type (type)}
    <Label name={type.trim()}>
      <Fa size="1x" icon={getTypeAttributes(type).icon} class={getTypeAttributes(type).color} />
    </Label>
  {/each}
</div>
