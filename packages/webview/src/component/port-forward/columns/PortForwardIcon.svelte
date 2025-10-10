<script lang="ts">
import { StatusIcon } from '@podman-desktop/ui-svelte';

import EthernetIcon from './EthernetIcon.svelte';
import type { ForwardConfig } from '@kubernetes-dashboard/channels';

interface Props {
  object: ForwardConfig;
}
let { object }: Props = $props();
</script>

<StatusIcon status="RUNNING" icon={EthernetIcon} />
