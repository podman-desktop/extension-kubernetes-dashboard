<script lang="ts">
import type { V1DaemonSet } from '@kubernetes/client-node';
import { getContext } from 'svelte';

import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';

import { DaemonSetHelper } from './daemonset-helper';
import type { DaemonSetUI } from './DaemonSetUI';
import DaemonSetDetailsSummary from './DaemonSetDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const daemonSetHelper = dependencyAccessor.get<DaemonSetHelper>(DaemonSetHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1DaemonSet}
  typedUI={{} as DaemonSetUI}
  kind="DaemonSet"
  resourceName="daemonsets"
  listName="DaemonSets"
  name={name}
  namespace={namespace}
  transformer={daemonSetHelper.getDaemonSetUI.bind(daemonSetHelper)}
  SummaryComponent={DaemonSetDetailsSummary} />
