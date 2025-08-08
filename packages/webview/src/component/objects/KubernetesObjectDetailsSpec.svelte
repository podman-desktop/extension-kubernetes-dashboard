<script lang="ts">
import type { vi } from 'vitest';
import type { NamespaceUI } from '../namespaces/NamespaceUI';
import KubernetesObjectDetails from './KubernetesObjectDetails.svelte';
import type { V1Namespace } from '@kubernetes/client-node';

type Props = {
  mock: ReturnType<typeof vi.fn>;
};
const { mock }: Props = $props();
</script>

<KubernetesObjectDetails
  typed={{} as V1Namespace}
  typedUI={{} as NamespaceUI}
  kind="Namespace"
  resourceName="namespaces"
  name="ns1"
  transformer={(): NamespaceUI => ({
    kind: 'Namespace',
    name: 'ns1',
    status: 'RUNNING',
  })}>
  {#snippet content({ objectUI: objectUI, object: object, events })}
    {mock(objectUI, object, events)}
  {/snippet}
</KubernetesObjectDetails>
