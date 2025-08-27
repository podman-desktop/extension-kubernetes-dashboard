<script lang="ts">
import type { V1JobSpec } from '@kubernetes/client-node';

import Cell from '/@/component/details/Cell.svelte';
import Title from '/@/component/details/Title.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const kubernetesObjectUIHelper = dependencyAccessor.get<KubernetesObjectUIHelper>(KubernetesObjectUIHelper);

interface Props {
  spec: V1JobSpec;
}

let { spec }: Props = $props();
</script>

<tr>
  <Title>Details</Title>
</tr>
{#if spec.parallelism !== undefined}
  <tr>
    <Cell>Parallelism</Cell>
    <Cell>{spec.parallelism}</Cell>
  </tr>
{/if}
{#if spec.completions !== undefined}
  <tr>
    <Cell>Completions</Cell>
    <Cell>{spec.completions}</Cell>
  </tr>
{/if}
{#if spec.backoffLimit !== undefined}
  <tr>
    <Cell>Backoff Limit</Cell>
    <Cell>{spec.backoffLimit}</Cell>
  </tr>
{/if}
{#if spec.activeDeadlineSeconds !== undefined}
  <tr>
    <Cell>Active Deadline Seconds</Cell>
    <Cell>{spec.activeDeadlineSeconds}</Cell>
  </tr>
{/if}
{#if spec.ttlSecondsAfterFinished !== undefined}
  <tr>
    <Cell>TTL Seconds After Finished</Cell>
    <Cell>{spec.ttlSecondsAfterFinished}</Cell>
  </tr>
{/if}
{#if spec.suspend !== undefined}
  <tr>
    <Cell>Suspend</Cell>
    <Cell>{kubernetesObjectUIHelper.capitalize(spec.suspend.toString())}</Cell>
  </tr>
{/if}
