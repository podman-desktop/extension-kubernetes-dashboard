<script lang="ts">
import type { V1ReplicaSet } from '@kubernetes/client-node';
import { getContext } from 'svelte';

import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';

import { ReplicaSetHelper } from './replicaset-helper';
import type { ReplicaSetUI } from './ReplicaSetUI';
import ReplicaSetDetailsSummary from './ReplicaSetDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const replicaSetHelper = dependencyAccessor.get<ReplicaSetHelper>(ReplicaSetHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1ReplicaSet}
  typedUI={{} as ReplicaSetUI}
  kind="ReplicaSet"
  resourceName="replicasets"
  listName="ReplicaSets"
  name={name}
  namespace={namespace}
  transformer={replicaSetHelper.getReplicaSetUI.bind(replicaSetHelper)}
  SummaryComponent={ReplicaSetDetailsSummary} />
