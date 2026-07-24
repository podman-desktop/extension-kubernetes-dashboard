<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ResourceQuotaHelper } from './resource-quota-helper';
import type { ResourceQuotaUI } from './ResourceQuotaUI';
import type { V1ResourceQuota } from '@kubernetes/client-node';
import ResourceQuotaDetailsSummary from './ResourceQuotaDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const resourceQuotaHelper = dependencyAccessor.get<ResourceQuotaHelper>(ResourceQuotaHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1ResourceQuota}
  typedUI={{} as ResourceQuotaUI}
  kind="ResourceQuota"
  resourceName="resourcequotas"
  listName="Resource Quotas"
  name={name}
  namespace={namespace}
  transformer={resourceQuotaHelper.getResourceQuotaUI.bind(resourceQuotaHelper)}
  SummaryComponent={ResourceQuotaDetailsSummary} />
