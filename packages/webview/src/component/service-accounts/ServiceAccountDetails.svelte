<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ServiceAccountHelper } from './service-account-helper';
import type { ServiceAccountUI } from './ServiceAccountUI';
import type { V1ServiceAccount } from '@kubernetes/client-node';
import ServiceAccountDetailsSummary from './ServiceAccountDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const serviceAccountHelper = dependencyAccessor.get<ServiceAccountHelper>(ServiceAccountHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1ServiceAccount}
  typedUI={{} as ServiceAccountUI}
  kind="ServiceAccount"
  resourceName="serviceaccounts"
  listName="Service Accounts"
  name={name}
  namespace={namespace}
  transformer={serviceAccountHelper.getServiceAccountUI.bind(serviceAccountHelper)}
  SummaryComponent={ServiceAccountDetailsSummary} />
