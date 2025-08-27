<script lang="ts">
import type { V1PodSpec } from '@kubernetes/client-node';

import Cell from '/@/component/details/Cell.svelte';
import Subtitle from '/@/component/details/Subtitle.svelte';
import Title from '/@/component/details/Title.svelte';

import { WorkloadKind } from '/@/component/deployments/details/workload-kind';
import ContainerDetails from '/@/component/deployments/details/ContainerDetails.svelte';
import VolumeDetails from './VolumeDetails.svelte';

interface Props {
  spec: V1PodSpec;
  podName?: string;
  namespace?: string;
}
let { spec: spec, podName, namespace }: Props = $props();
</script>

{#if spec}
  <tr>
    <Title>Details</Title>
  </tr>
  <tr>
    <Cell>Node Name</Cell>
    <Cell>{spec?.nodeName}</Cell>
  </tr>
  <tr>
    <Cell>Service Account</Cell>
    <Cell>{spec?.serviceAccountName}</Cell>
  </tr>
  <tr>
    <Cell>Restart Policy</Cell>
    <Cell>{spec?.restartPolicy}</Cell>
  </tr>
  <tr>
    <Cell>Containers</Cell>
    <Cell>{spec?.containers.map(c => c.name).join(', ')}</Cell>
  </tr>

  {#if spec.containers}
    <tr>
      <Title>Containers</Title>
    </tr>
    {#each spec.containers as container (container.name)}
      <tr>
        <Subtitle>{container.name}</Subtitle>
      </tr>
      <ContainerDetails kind={WorkloadKind.POD} namespace={namespace} resourceName={podName} artifact={container} />
    {/each}
  {/if}

  {#if spec.volumes}
    <tr>
      <Title>Volumes</Title>
    </tr>
    {#each spec.volumes as volume (volume.name)}
      <VolumeDetails volume={volume} />
    {/each}
  {/if}
{/if}
