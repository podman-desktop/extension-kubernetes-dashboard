<script lang="ts">
import { StatusIcon, isFontAwesomeIcon } from '@podman-desktop/ui-svelte';
import { type Component } from 'svelte';

import type { ObjectProps } from './object-props';
import KubeIcon from '/@/component/icons/KubeIcon.svelte';
import { icon } from '/@/component/icons/icon';

let { object }: ObjectProps = $props();

const resolvedIcon: Component = $derived.by(() => {
  const mapped = icon[object?.kind ?? ''];
  if (!mapped || isFontAwesomeIcon(mapped)) return KubeIcon;
  return mapped as Component;
});
</script>

<StatusIcon icon={resolvedIcon} status={object.status} />
