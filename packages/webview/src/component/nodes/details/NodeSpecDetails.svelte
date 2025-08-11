<script lang="ts">
import type { V1NodeSpec } from '@kubernetes/client-node';
import Title from '/@/component/details/Title.svelte';
import Cell from '/@/component/details/Cell.svelte';

interface Props {
  artifact?: V1NodeSpec;
}
let { artifact }: Props = $props();
</script>

{#if artifact}
  <tr>
    <Title>Details</Title>
  </tr>
  {#if artifact.externalID}
    <tr>
      <Cell>External ID</Cell>
      <Cell>{artifact.externalID}</Cell>
    </tr>
  {/if}
  {#if artifact.podCIDRs}
    <tr>
      <Cell>Pod CIDRs</Cell>
      <Cell>
        {#each artifact.podCIDRs as cidr, index (index)}
          <div>{cidr}</div>
        {/each}
      </Cell>
    </tr>
  {/if}
  {#if artifact.providerID}
    <tr>
      <Cell>Provider ID</Cell>
      <Cell>{artifact.providerID}</Cell>
    </tr>
  {/if}
  {#if artifact.taints}
    <tr>
      <Title>Taints</Title>
      <Cell>
        <table>
          <tbody>
            {#each artifact.taints as taint, index (index)}
              <tr>
                <Cell>{taint.key}</Cell>
                <Cell>Effect: {taint.effect}, Value: {taint.value ?? 'N/A'}</Cell>
              </tr>
            {/each}
          </tbody>
        </table>
      </Cell>
    </tr>
  {/if}
  <tr>
    <Cell>Unschedulable</Cell>
    <Cell>{artifact.unschedulable ? 'Yes' : 'No'}</Cell>
  </tr>
{/if}
