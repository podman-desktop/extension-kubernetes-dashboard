<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ServiceHelper } from './service-helper';
import type { ServiceUI } from './ServiceUI';
import type { V1Service } from '@kubernetes/client-node';
import ServiceDetailsSummary from './ServiceDetailsSummary.svelte';
import Actions from './columns/Actions.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const serviceHelper = dependencyAccessor.get<ServiceHelper>(ServiceHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Service}
  typedUI={{} as ServiceUI}
  kind="Service"
  resourceName="services"
  listName="Services"
  name={name}
  namespace={namespace}
  transformer={serviceHelper.getServiceUI.bind(serviceHelper)}
  ActionsComponent={Actions}
  SummaryComponent={ServiceDetailsSummary} />
