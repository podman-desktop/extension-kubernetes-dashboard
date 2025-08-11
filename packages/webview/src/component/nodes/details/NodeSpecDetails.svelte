<script lang="ts">
import type { V1NodeSpec } from '@kubernetes/client-node';
import Title from '/@/component/details/Title.svelte';
import Cell from '/@/component/details/Cell.svelte';

interface Props {
  spec: V1NodeSpec;
}
let { spec }: Props = $props();
</script>

<tr>
  <Title>Details</Title>
</tr>
{#if spec.externalID}
  <tr>
    <Cell>External ID</Cell>
    <Cell>{spec.externalID}</Cell>
  </tr>
{/if}
{#if spec.podCIDRs}
  <tr>
    <Cell>Pod CIDRs</Cell>
    <Cell>
      {#each spec.podCIDRs as cidr, index (index)}
        <div>{cidr}</div>
      {/each}
    </Cell>
  </tr>
{/if}
{#if spec.providerID}
  <tr>
    <Cell>Provider ID</Cell>
    <Cell>{spec.providerID}</Cell>
  </tr>
{/if}
{#if spec.taints}
  <tr>
    <Title>Taints</Title>
    <Cell>
      <table>
        <tbody>
          {#each spec.taints as taint, index (index)}
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
  <Cell>{spec.unschedulable ? 'Yes' : 'No'}</Cell>
</tr>
