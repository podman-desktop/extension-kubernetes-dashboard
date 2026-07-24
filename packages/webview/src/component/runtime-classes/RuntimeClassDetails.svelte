<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { RuntimeClassHelper } from './runtime-class-helper';
import type { RuntimeClassUI } from './RuntimeClassUI';
import type { V1RuntimeClass } from '@kubernetes/client-node';
import RuntimeClassDetailsSummary from './RuntimeClassDetailsSummary.svelte';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const runtimeClassHelper = dependencyAccessor.get<RuntimeClassHelper>(RuntimeClassHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1RuntimeClass}
  typedUI={{} as RuntimeClassUI}
  kind="RuntimeClass"
  resourceName="runtimeclasses"
  listName="Runtime Classes"
  name={name}
  transformer={runtimeClassHelper.getRuntimeClassUI.bind(runtimeClassHelper)}
  SummaryComponent={RuntimeClassDetailsSummary} />
