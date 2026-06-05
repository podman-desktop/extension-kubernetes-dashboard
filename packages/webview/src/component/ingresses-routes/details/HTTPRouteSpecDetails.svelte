<script lang="ts">
import { Link } from '@podman-desktop/ui-svelte';
import { getContext } from 'svelte';

import { API_SYSTEM, type V1HTTPRouteSpec } from '@kubernetes-dashboard/channels';
import Cell from '/@/component/details/Cell.svelte';
import Title from '/@/component/details/Title.svelte';
import { Remote } from '/@/remote/remote';

interface Props {
  spec: V1HTTPRouteSpec;
}
let { spec }: Props = $props();

const remote = getContext<Remote>(Remote);
const systemApi = remote.getProxy(API_SYSTEM);

async function openExternal(link: string): Promise<boolean> {
  return systemApi.openExternal(link);
}

function getHostnames(): string[] {
  return spec.hostnames ?? [];
}

function getMatches(): NonNullable<V1HTTPRouteSpec['rules']>[number]['matches'] {
  return spec.rules?.flatMap(rule => rule.matches ?? []) ?? [];
}

function getBackendRefs(): NonNullable<V1HTTPRouteSpec['rules']>[number]['backendRefs'] {
  return spec.rules?.flatMap(rule => rule.backendRefs ?? []) ?? [];
}

function getParentRefs(): NonNullable<V1HTTPRouteSpec['parentRefs']> {
  return spec.parentRefs ?? [];
}

function getPaths(): string[] {
  return getMatches()
    .map(match => match.path?.value)
    .filter((path): path is string => path !== undefined && path !== '');
}

function getLinks(): string[] {
  const paths = getPaths();
  return getHostnames().flatMap(hostname => (paths.length ? paths : ['']).map(path => `http://${hostname}${path}`));
}
</script>

<tr>
  <Title>Details</Title>
</tr>
{#if getHostnames().length}
  <tr>
    <Cell>Hostnames</Cell>
    <Cell>{getHostnames().join(', ')}</Cell>
  </tr>
{/if}
{#if getPaths().length}
  <tr>
    <Cell>Paths</Cell>
    <Cell>{getPaths().join(', ')}</Cell>
  </tr>
{/if}
{#if getParentRefs().length}
  <tr>
    <Cell>Parents</Cell>
    <Cell>
      {getParentRefs()
        .map(
          parentRef =>
            `${parentRef.kind ?? 'Gateway'} ${parentRef.namespace ? `${parentRef.namespace}/` : ''}${parentRef.name ?? ''}`,
        )
        .join(', ')}
    </Cell>
  </tr>
{/if}
{#if getBackendRefs().length}
  <tr>
    <Cell>Backends</Cell>
    <Cell>
      {getBackendRefs()
        .map(
          backendRef =>
            `${backendRef.kind ?? 'Service'} ${backendRef.name ?? ''}${backendRef.port ? `:${backendRef.port}` : ''}`,
        )
        .join(', ')}
    </Cell>
  </tr>
{/if}
{#if getLinks().length}
  <tr>
    <Cell>Links</Cell>
    <Cell>
      {#each getLinks() as link (link)}
        <div>
          <Link on:click={openExternal.bind(undefined, link)}>{link}</Link>
        </div>
      {/each}
    </Cell>
  </tr>
{/if}
