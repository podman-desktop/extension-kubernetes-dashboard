<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import type { V1Pod } from '@kubernetes/client-node';
import Actions from './columns/Actions.svelte';
import type { PodUI } from './PodUI';
import { PodHelper } from './pod-helper';
import PodDetailsSummary from './PodDetailsSummary.svelte';
import PodTerminalBrowser from './PodTerminalBrowser.svelte';
import PodLogsCustomizable from '/@/component/pods/PodLogsCustomizable.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const podHelper = dependencyAccessor.get<PodHelper>(PodHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Pod}
  typedUI={{} as PodUI}
  kind="Pod"
  resourceName="pods"
  listName="Pods"
  name={name}
  namespace={namespace}
  transformer={podHelper.getPodUI.bind(podHelper)}
  tabs={[
    {
      title: 'Logs',
      url: 'logs',
      component: PodLogsCustomizable,
    },
    {
      title: 'Terminal',
      url: 'terminal',
      component: PodTerminalBrowser,
    },
  ]}
  ActionsComponent={Actions}
  SummaryComponent={PodDetailsSummary} />
