<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { NamespaceHelper } from '/@/component/namespaces/namespace-helper';
import type { V1Namespace } from '@kubernetes/client-node';
import type { NamespaceUI } from '/@/component/namespaces/NamespaceUI';
import NamespaceDetailsSummary from '/@/component/namespaces/NamespaceDetailsSummary.svelte';
import Actions from '/@/component/namespaces/columns/Actions.svelte';

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
  listName="Namespaces"
  SummaryComponent={NamespaceDetailsSummary}
  ActionsComponent={Actions}
  name={name}
  transformer={namespaceHelper.getNamespaceUI.bind(namespaceHelper)} />
