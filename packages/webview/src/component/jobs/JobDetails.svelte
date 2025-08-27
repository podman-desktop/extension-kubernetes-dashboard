<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import type { V1Job } from '@kubernetes/client-node';
import Actions from './columns/Actions.svelte';
import type { JobUI } from './JobUI';
import { JobHelper } from './job-helper';
import JobDetailsSummary from './JobDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const jobHelper = dependencyAccessor.get<JobHelper>(JobHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Job}
  typedUI={{} as JobUI}
  kind="Job"
  resourceName="jobs"
  listName="Jobs"
  name={name}
  namespace={namespace}
  transformer={jobHelper.getJobUI.bind(jobHelper)}
  ActionsComponent={Actions}
  SummaryComponent={JobDetailsSummary} />
