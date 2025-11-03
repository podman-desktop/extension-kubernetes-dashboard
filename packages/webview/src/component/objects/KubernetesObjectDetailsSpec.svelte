<script lang="ts">
import NodeDetailsSummary from '/@/component/nodes/NodeDetailsSummary.svelte';
import type { NodeUI } from '/@/component/nodes/NodeUI';
import KubernetesObjectDetails from './KubernetesObjectDetails.svelte';
import type { V1Node } from '@kubernetes/client-node';
</script>

<KubernetesObjectDetails
  listName="Nodes"
  typed={{} as V1Node}
  typedUI={{} as NodeUI}
  kind="Node"
  SummaryComponent={NodeDetailsSummary}
  resourceName="nodes"
  name="node1"
  transformer={(): NodeUI =>
    ({
      kind: 'Node',
      name: 'node1',
      status: 'RUNNING',
    }) as NodeUI}>
</KubernetesObjectDetails>
