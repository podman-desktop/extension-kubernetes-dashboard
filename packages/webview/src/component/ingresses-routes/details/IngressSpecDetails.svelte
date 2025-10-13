<script lang="ts">
import type { V1IngressSpec } from '@kubernetes/client-node';
import { Link } from '@podman-desktop/ui-svelte';

import Cell from '/@/component/details/Cell.svelte';
import Title from '/@/component/details/Title.svelte';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_SYSTEM, type SystemApi } from '@kubernetes-dashboard/channels';

interface Props {
  spec: V1IngressSpec;
}
let { spec }: Props = $props();

const remote = getContext<Remote>(Remote);
const systemApi = remote.getProxy<SystemApi>(API_SYSTEM);
</script>

<tr>
  <Title>Details</Title>
</tr>

{#if spec.defaultBackend}
  {#if spec.defaultBackend.service}
    <tr>
      <Cell>Default Backend Service</Cell>
      <Cell
        >{spec.defaultBackend.service?.name}
        {#if spec.defaultBackend.service?.port?.number}
          :{spec.defaultBackend.service?.port?.number}
        {/if}
        {#if spec.defaultBackend.service?.port?.name}
          ({spec.defaultBackend.service?.port?.name})
        {/if}
      </Cell>
    </tr>
  {/if}
  {#if spec.defaultBackend.resource}
    <tr>
      <Cell>Default Backend Resource</Cell>
      <Cell>{spec.defaultBackend.resource.name} ({spec.defaultBackend.resource.kind})</Cell>
    </tr>
  {/if}
{/if}

{#if spec.tls}
  <tr>
    <Title>TLS</Title>
  </tr>
  {#each spec.tls as tls, index (index)}
    <tr>
      <Cell>Secret Name</Cell>
      <Cell>{tls.secretName}</Cell>
    </tr>
    {#if tls.hosts}
      <tr>
        <Cell>Hosts</Cell>
        <Cell>{tls.hosts.join(', ')}</Cell>
      </tr>
    {/if}
  {/each}
{/if}

{#if spec.rules}
  <tr>
    <Cell>Rules</Cell>
    <Cell>
      {#each spec.rules || [] as rule, index (index)}
        <!-- Here we use || [] to ensure it's always an array -->
        {#if rule.http}
          {#each rule.http.paths as path, index (index)}
            Path: {path.path}
            {#if rule.host}
              • Link:
              {@const link = `${spec.tls && spec.tls.length > 0 ? 'https' : 'http'}://${rule.host}${path.path}`}
              <Link on:click={(): Promise<boolean> => systemApi.openExternal(link)}>
                {link}
              </Link>
            {/if}
            {#if path.backend.service}
              • Backend: {path.backend.service?.name}{path.backend.service?.port?.number ? ':' : ''}{path.backend
                .service?.port?.number}
            {:else if path.backend.resource}
              • Backend: {path.backend.resource?.name}
            {/if}
          {/each}
        {/if}
      {/each}
    </Cell>
  </tr>
{/if}
