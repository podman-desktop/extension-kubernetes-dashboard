<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { LeaseHelper } from './lease-helper';
import type { LeaseUI } from './LeaseUI';
import type { V1Lease } from '@kubernetes/client-node';
import LeaseDetailsSummary from './LeaseDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const leaseHelper = dependencyAccessor.get<LeaseHelper>(LeaseHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Lease}
  typedUI={{} as LeaseUI}
  kind="Lease"
  resourceName="leases"
  listName="Leases"
  name={name}
  namespace={namespace}
  transformer={leaseHelper.getLeaseUI.bind(leaseHelper)}
  SummaryComponent={LeaseDetailsSummary} />
