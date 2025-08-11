<script lang="ts">
import type { V1ConfigMap } from '@kubernetes/client-node';
import Title from '/@/component/details/Title.svelte';
import Cell from '/@/component/details/Cell.svelte';
import Subtitle from '/@/component/details/Subtitle.svelte';

interface Props {
  object: V1ConfigMap;
}
let { object: object }: Props = $props();
</script>

<tr>
  <Title>Details</Title>
</tr>
<tr>
  <Cell>Immutable</Cell>
  <Cell>{object.immutable ? 'Yes' : 'No'}</Cell>
</tr>
{#if object.binaryData}
  <tr>
    <Cell>Binary Data</Cell>
    <Cell>
      {#each Object.entries(object.binaryData) as [key, value] (key)}
        <div>{key}: {value.length} bytes</div>
      {/each}
    </Cell>
  </tr>
{/if}
{#if object.data}
  <tr>
    <Subtitle>Data</Subtitle>
  </tr>
  {#each Object.entries(object.data) as [key, value] (key)}
    <tr>
      <Cell>{key}</Cell>
      <Cell>{value}</Cell>
    </tr>
  {/each}
{/if}
