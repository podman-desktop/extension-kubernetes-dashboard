<script lang="ts">
import { Link } from '@podman-desktop/ui-svelte';

import Cell from '/@/component/details/Cell.svelte';
import Title from '/@/component/details/Title.svelte';
import type { V1RouteSpec } from '@kubernetes-dashboard/channels';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_SYSTEM } from '@kubernetes-dashboard/channels';

interface Props {
  spec: V1RouteSpec;
}
let { spec }: Props = $props();

const remote = getContext<Remote>(Remote);
const systemApi = remote.getProxy(API_SYSTEM);
</script>

<tr>
  <Title>Details</Title>
</tr>
{#if spec.host}
  <tr>
    <Cell>Host</Cell>
    <Cell>
      {spec.host}
    </Cell>
  </tr>
{/if}
{#if spec.path}
  <tr>
    <Cell>Path</Cell>
    <Cell>
      {spec.path ?? 'N/A'}
    </Cell>
  </tr>
{/if}
{#if spec.port}
  <tr>
    <Cell>Port</Cell>
    <Cell>
      {spec.port ? spec.port.targetPort : 'N/A'}
    </Cell>
  </tr>
{/if}
{#if spec.tls}
  <tr>
    <Cell>TLS</Cell>
    <Cell>
      Termination: {spec.tls.termination} • Insecure Edge Policy: {spec.tls.insecureEdgeTerminationPolicy}
    </Cell>
  </tr>
{/if}
{#if spec.wildcardPolicy}
  <tr>
    <Cell>Wildcard Policy</Cell>
    <Cell>
      {spec.wildcardPolicy}
    </Cell>
  </tr>
{/if}
{#if spec.to}
  <tr>
    <Cell>Backend</Cell>
    <Cell>
      {spec.to.kind} / {spec.to.name} (Weight: {spec.to.weight})
    </Cell>
  </tr>
{/if}
{#if spec.host}
  <tr>
    <Cell>Link</Cell>
    <Cell>
      {@const link = `${spec.tls ? 'https' : 'http'}://${spec.host}${spec.path ?? ''}`}
      <Link on:click={(): Promise<boolean> => systemApi.openExternal(link)}>
        {link}
      </Link>
    </Cell>
  </tr>
{/if}
