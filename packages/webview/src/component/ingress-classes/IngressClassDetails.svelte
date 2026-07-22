<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { IngressClassHelper } from './ingress-class-helper';
import type { IngressClassUI } from './IngressClassUI';
import type { V1IngressClass } from '@kubernetes/client-node';
import IngressClassDetailsSummary from './IngressClassDetailsSummary.svelte';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const ingressClassHelper = dependencyAccessor.get<IngressClassHelper>(IngressClassHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1IngressClass}
  typedUI={{} as IngressClassUI}
  kind="IngressClass"
  resourceName="ingressclasses"
  listName="Ingress Classes"
  name={name}
  transformer={ingressClassHelper.getIngressClassUI.bind(ingressClassHelper)}
  SummaryComponent={IngressClassDetailsSummary} />
