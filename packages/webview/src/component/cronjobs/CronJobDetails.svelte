<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import type { V1CronJob } from '@kubernetes/client-node';
import Actions from './columns/Actions.svelte';
import type { CronJobUI } from './CronJobUI';
import { CronJobHelper } from './cronjob-helper';
import CronJobDetailsSummary from './CronJobDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const cronjobHelper = dependencyAccessor.get<CronJobHelper>(CronJobHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1CronJob}
  typedUI={{} as CronJobUI}
  kind="CronJob"
  resourceName="cronjobs"
  listName="CronJobs"
  name={name}
  namespace={namespace}
  transformer={cronjobHelper.getCronJobUI.bind(cronjobHelper)}
  ActionsComponent={Actions}
  SummaryComponent={CronJobDetailsSummary} />
