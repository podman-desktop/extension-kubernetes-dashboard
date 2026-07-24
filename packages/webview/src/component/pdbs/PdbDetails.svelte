<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { PdbHelper } from './pdb-helper';
import type { PdbUI } from './PdbUI';
import type { V1PodDisruptionBudget } from '@kubernetes/client-node';
import PdbDetailsSummary from './PdbDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const pdbHelper = dependencyAccessor.get<PdbHelper>(PdbHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1PodDisruptionBudget}
  typedUI={{} as PdbUI}
  kind="PodDisruptionBudget"
  resourceName="poddisruptionbudgets"
  listName="Pod Disruption Budgets"
  name={name}
  namespace={namespace}
  transformer={pdbHelper.getPdbUI.bind(pdbHelper)}
  SummaryComponent={PdbDetailsSummary} />
