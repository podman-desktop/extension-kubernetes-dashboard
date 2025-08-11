<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '../objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { NodeHelper } from './node-helper';
import type { NodeUI } from './NodeUI';
import type { V1Node } from '@kubernetes/client-node';
import NodeDetailsSummary from './NodeDetailsSummary.svelte';

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
  name={name}
  transformer={nodeHelper.getNodeUI.bind(nodeHelper)}
  SummaryComponent={NodeDetailsSummary}>
  {#snippet content({ objectUI: nodeUI, object: node, events })}
    <div>
      <h1>Node Details</h1>
      <p>Name: {nodeUI.name} / {node.metadata?.name}</p>
      <p>Events: {events?.length}</p>
    </div>
  {/snippet}
</KubernetesObjectDetails>
