<script lang="ts">
import { faSquareUpRight, faTrash } from '@fortawesome/free-solid-svg-icons';

import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_PORT_FORWARD, API_SYSTEM } from '@kubernetes-dashboard/channels';
import type { ForwardConfig } from '@kubernetes-dashboard/channels';
import IconButton from '/@/component/button/IconButton.svelte';
import { States } from '/@/state/states';

interface Props {
  object: ForwardConfig;
}
let { object }: Props = $props();

const remote = getContext<Remote>(Remote);
const portForwardApi = remote.getProxy(API_PORT_FORWARD);
const systemApi = remote.getProxy(API_SYSTEM);

const portForwards = getContext<States>(States).statePortForwardsInfoUI;

let userConfigForward: ForwardConfig | undefined = $derived(
  portForwards.data?.portForwards.find(
    (config: ForwardConfig) =>
      config.kind === object.kind &&
      config.name === object.name &&
      config.namespace === object.namespace &&
      config.forward.remotePort === object.forward.remotePort &&
      config.forward.localPort === object.forward.localPort,
  ),
);

async function deletePortForward(): Promise<void> {
  if (!userConfigForward) return;
  await portForwardApi.deletePortForward($state.snapshot(userConfigForward), { askConfirmation: true });
}

async function openExternal(): Promise<void> {
  await systemApi.openExternal(`http://localhost:${object.forward.localPort}`);
}
</script>

<IconButton title="Open forwarded port" onClick={openExternal} icon={faSquareUpRight} />
<IconButton title="Delete forwarded port" onClick={deletePortForward} icon={faTrash} />
