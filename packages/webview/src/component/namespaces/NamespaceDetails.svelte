<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '../objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { NamespaceHelper } from './namespace-helper';
import type { V1Namespace } from '@kubernetes/client-node';
import type { NamespaceUI } from './NamespaceUI';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const namespaceHelper = dependencyAccessor.get<NamespaceHelper>(NamespaceHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Namespace}
  typedUI={{} as NamespaceUI}
  kind="Namespace"
  resourceName="namespaces"
  name={name}
  transformer={namespaceHelper.getNamespaceUI.bind(namespaceHelper)}>
  {#snippet content({ objectUI: namespaceUI, object: namespace })}
    <div>
      <h1>Namespace Details</h1>
      <p>Name: {namespaceUI.name} / {namespace.metadata?.name}</p>
    </div>
  {/snippet}
</KubernetesObjectDetails>
