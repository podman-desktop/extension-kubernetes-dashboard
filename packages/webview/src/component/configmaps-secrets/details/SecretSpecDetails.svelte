<script lang="ts">
import type { V1Secret } from '@kubernetes/client-node';
import Title from '/@/component/details/Title.svelte';
import Cell from '/@/component/details/Cell.svelte';
import Subtitle from '/@/component/details/Subtitle.svelte';

interface Props {
  object: V1Secret;
}
let { object }: Props = $props();
</script>

<tr>
  <Title>Details</Title>
</tr>
<tr>
  <Cell>Type</Cell>
  <Cell>{object.type}</Cell>
</tr>
<tr>
  <Cell>Immutable</Cell>
  <Cell>{object.immutable ? 'Yes' : 'No'}</Cell>
</tr>
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
