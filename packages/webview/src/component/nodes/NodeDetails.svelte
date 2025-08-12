<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { NodeHelper } from '/@/component/nodes/node-helper';
import type { NodeUI } from '/@/component/nodes/NodeUI';
import type { V1Node } from '@kubernetes/client-node';
import NodeDetailsSummary from '/@/component/nodes/NodeDetailsSummary.svelte';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const nodeHelper = dependencyAccessor.get<NodeHelper>(NodeHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Node}
  typedUI={{} as NodeUI}
  kind="Node"
  resourceName="nodes"
  listName="Nodes"
  name={name}
  transformer={nodeHelper.getNodeUI.bind(nodeHelper)}
  SummaryComponent={NodeDetailsSummary} />
