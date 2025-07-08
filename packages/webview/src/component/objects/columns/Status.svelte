<script lang="ts">
import { StatusIcon } from '@podman-desktop/ui-svelte';
import { type Component } from 'svelte';

import type { ObjectProps } from './object-props';
import KubeIcon from '/@/component/icons/KubeIcon.svelte';
import { icon } from '/@/component/icons/icon';

let { object }: ObjectProps = $props();

const Icon: Component = $derived.by(() => icon[object?.kind ?? ''] ?? KubeIcon);
</script>

<StatusIcon icon={Icon} status={object.status} />
