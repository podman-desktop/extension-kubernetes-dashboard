<script lang="ts">
import type { V1CronJobSpec } from '@kubernetes/client-node';

import Cell from '/@/component/details/Cell.svelte';
import Title from '/@/component/details/Title.svelte';
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const kubernetesObjectUIHelper = dependencyAccessor.get<KubernetesObjectUIHelper>(KubernetesObjectUIHelper);

interface Props {
  spec: V1CronJobSpec;
}

let { spec }: Props = $props();
</script>

<tr>
  <Title>Details</Title>
</tr>
{#if spec.schedule}
  <tr>
    <Cell>Schedule</Cell>
    <Cell>{spec.schedule}</Cell>
  </tr>
{/if}
{#if spec.concurrencyPolicy}
  <tr>
    <Cell>Concurrency Policy</Cell>
    <Cell>{spec.concurrencyPolicy}</Cell>
  </tr>
{/if}
{#if spec.failedJobsHistoryLimit !== undefined}
  <tr>
    <Cell>Failed Jobs History Limit</Cell>
    <Cell>{spec.failedJobsHistoryLimit}</Cell>
  </tr>
{/if}
{#if spec.successfulJobsHistoryLimit !== undefined}
  <tr>
    <Cell>Successful Jobs History Limit</Cell>
    <Cell>{spec.successfulJobsHistoryLimit}</Cell>
  </tr>
{/if}
{#if spec.startingDeadlineSeconds !== undefined}
  <tr>
    <Cell>Starting Deadline Seconds</Cell>
    <Cell>{spec.startingDeadlineSeconds}</Cell>
  </tr>
{/if}
{#if spec.suspend !== undefined}
  <tr>
    <Cell>Suspend</Cell>
    <Cell>{kubernetesObjectUIHelper.capitalize(spec.suspend.toString())}</Cell>
  </tr>
{/if}
{#if spec.timeZone}
  <tr>
    <Cell>Time Zone</Cell>
    <Cell>{spec.timeZone}</Cell>
  </tr>
{/if}
