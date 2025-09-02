<script lang="ts">
import { faEthernet } from '@fortawesome/free-solid-svg-icons';
import { EmptyScreen, NavPage, Table, TableColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';

import PortForwardIcon from './columns/PortForwardIcon.svelte';
import type { ForwardConfig, WorkloadKind } from '/@common/model/port-forward';
import { getContext, onDestroy, onMount } from 'svelte';
import { States } from '/@/state/states';
import type { Unsubscriber } from 'svelte/store';
import NameColumn from './columns/Name.svelte';
import ActionsColumn from './columns/Actions.svelte';

const portForwards = getContext<States>(States).statePortForwardsInfoUI;

let portForwardsUnsubscriber: Unsubscriber;

onMount(() => {
  portForwardsUnsubscriber = portForwards.subscribe();
});

onDestroy(() => {
  portForwardsUnsubscriber?.();
});

const columns = [
  new TableColumn<ForwardConfig>('Status', {
    align: 'center',
    width: '70px',
    renderer: PortForwardIcon,
  }),
  new TableColumn<ForwardConfig>('Name', {
    align: 'left',
    renderer: NameColumn,
    comparator: (a, b): number => a.name.localeCompare(b.name),
  }),
  new TableColumn<ForwardConfig, string>('Type', {
    align: 'left',
    renderer: TableSimpleColumn,
    renderMapping: (config): WorkloadKind => config.kind,
    comparator: (a, b): number => a.kind.localeCompare(b.kind),
  }),
  new TableColumn<ForwardConfig, string>('Local Port', {
    align: 'left',
    renderer: TableSimpleColumn,
    renderMapping: (config): string => String(config.forward.localPort),
    comparator: (a, b): number => a.forward.localPort - b.forward.localPort,
  }),
  new TableColumn<ForwardConfig, string>('Remote Port', {
    align: 'left',
    renderer: TableSimpleColumn,
    renderMapping: (config): string => String(config.forward.remotePort),
    comparator: (a, b): number => a.forward.remotePort - b.forward.remotePort,
  }),
  new TableColumn<ForwardConfig>('Actions', {
    align: 'right',
    renderer: ActionsColumn,
  }),
];

const row = new TableRow<ForwardConfig>({});
</script>

<NavPage searchEnabled={false} title="Port forwarding">
  {#snippet content()}
    <div class="flex min-w-full h-full">
      {#if portForwards.data?.portForwards && portForwards.data.portForwards.length > 0}
        <Table kind="port" data={portForwards.data?.portForwards} columns={columns} row={row} defaultSortColumn="Name">
        </Table>
      {:else}
        <EmptyScreen
          message="To forward ports, open the Summary tab on the relevant resource (Pod, Service, or Deployment)"
          icon={faEthernet}
          title="No port forwarding configured" />
      {/if}
    </div>
  {/snippet}
</NavPage>
