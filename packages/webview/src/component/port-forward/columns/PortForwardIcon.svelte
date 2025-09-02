<script lang="ts">
import { StatusIcon } from '@podman-desktop/ui-svelte';

import EthernetIcon from './EthernetIcon.svelte';
import type { ForwardConfig } from '/@common/model/port-forward';

interface Props {
  object: ForwardConfig;
}
let { object }: Props = $props();
</script>

<StatusIcon status="RUNNING" icon={EthernetIcon} />
