<script lang="ts">
import type { V1DeploymentSpec } from '@kubernetes/client-node';

import Title from '/@/component/details/Title.svelte';
import Cell from '/@/component/details/Cell.svelte';
import Subtitle from '/@/component/details/Subtitle.svelte';
import ContainerDetails from './ContainerDetails.svelte';
import { WorkloadKind } from '/@common/model/port-forward';

interface Props {
  spec: V1DeploymentSpec;
  name?: string;
  namespace?: string;
}
let { spec, name, namespace }: Props = $props();
</script>

<tr>
  <Title>Details</Title>
</tr>
<tr>
  <Cell>Replicas</Cell>
  <Cell>{spec.replicas}</Cell>
</tr>
{#if spec.selector.matchLabels}
  <tr>
    <Cell>Selector</Cell>
    <Cell>
      {#each Object.entries(spec.selector.matchLabels) as [key, value] (key)}
        <div>{key}: {value}</div>
      {/each}
    </Cell>
  </tr>
{/if}
{#if spec.strategy}
  <tr>
    <Cell>Strategy</Cell>
    <Cell>{spec.strategy.type}</Cell>
  </tr>
{/if}
{#if spec.template.spec?.containers}
  <tr>
    <Title>Containers</Title>
  </tr>
  {#each spec.template.spec?.containers as container (container.name)}
    <tr>
      <Subtitle>{container.name}</Subtitle>
    </tr>
    <ContainerDetails kind={WorkloadKind.DEPLOYMENT} namespace={namespace} resourceName={name} container={container} />
  {/each}
{/if}
