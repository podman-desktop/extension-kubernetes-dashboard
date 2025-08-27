<script lang="ts">
import type { V1PersistentVolumeClaimSpec } from '@kubernetes/client-node';

import Cell from '/@/component/details/Cell.svelte';
import Title from '/@/component/details/Title.svelte';

interface Props {
  spec: V1PersistentVolumeClaimSpec;
}
let { spec }: Props = $props();
</script>

<tr>
  <Title>Details</Title>
</tr>
{#if spec.accessModes}
  <tr>
    <Cell>Access Modes</Cell>
    <Cell>
      {#each spec.accessModes as mode, index (index)}
        <div>{mode}</div>
      {/each}
    </Cell>
  </tr>
{/if}
{#if spec.storageClassName}
  <tr>
    <Cell>Storage Class Name</Cell>
    <Cell>{spec.storageClassName}</Cell>
  </tr>
{/if}
{#if spec.volumeMode}
  <tr>
    <Cell>Volume Mode</Cell>
    <Cell>{spec.volumeMode}</Cell>
  </tr>
{/if}
{#if spec.resources?.requests}
  <tr>
    <Cell>Requests</Cell>
    {#if spec.resources.requests}
      <Cell>
        <table>
          <tbody>
            {#each Object.entries(spec.resources.requests) as [resourceType, quantity] (resourceType)}
              <tr>
                <Cell>{resourceType}: {quantity}</Cell>
              </tr>
            {/each}
          </tbody>
        </table>
      </Cell>
    {/if}
  </tr>
{/if}
{#if spec.resources?.limits}
  <tr>
    <Cell>Limits</Cell>
    <Cell>
      <table>
        <tbody>
          {#each Object.entries(spec.resources.limits) as [resourceType, quantity] (resourceType)}
            <tr>
              <Cell>{resourceType}: {quantity}</Cell>
            </tr>
          {/each}
        </tbody>
      </table>
    </Cell>
  </tr><tr> </tr>{/if}

{#if spec.selector}
  <tr>
    <Title>Selector</Title>
    {#if spec.selector.matchLabels}
      <Cell>
        <table>
          <tbody>
            {#each Object.entries(spec.selector.matchLabels) as [label, value] (label)}
              <tr>
                <Cell>Match Label: {label}</Cell>
                <Cell>{value}</Cell>
              </tr>
            {/each}
          </tbody>
        </table>
      </Cell>
    {/if}
    {#if spec.selector.matchExpressions}
      <Cell>
        <table>
          <tbody>
            {#each spec.selector.matchExpressions as expression, index (index)}
              {#if expression.values}
                <tr>
                  <Cell>Expression: {expression.key} {expression.operator}</Cell>
                  <Cell>{expression.values.join(', ')}</Cell>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </Cell>
    {/if}
  </tr>
{/if}
