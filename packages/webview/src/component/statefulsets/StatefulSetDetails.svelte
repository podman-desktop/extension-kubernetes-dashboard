<script lang="ts">
import type { V1StatefulSet } from '@kubernetes/client-node';
import { getContext } from 'svelte';

import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';

import { StatefulSetHelper } from './statefulset-helper';
import type { StatefulSetUI } from './StatefulSetUI';
import StatefulSetDetailsSummary from './StatefulSetDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const statefulSetHelper = dependencyAccessor.get<StatefulSetHelper>(StatefulSetHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1StatefulSet}
  typedUI={{} as StatefulSetUI}
  kind="StatefulSet"
  resourceName="statefulsets"
  listName="StatefulSets"
  name={name}
  namespace={namespace}
  transformer={statefulSetHelper.getStatefulSetUI.bind(statefulSetHelper)}
  SummaryComponent={StatefulSetDetailsSummary} />
