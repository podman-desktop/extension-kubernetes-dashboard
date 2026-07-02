<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { PvHelper } from './pv-helper';
import type { PvUI } from './PvUI';
import type { V1PersistentVolume } from '@kubernetes/client-node';
import PvDetailsSummary from './PvDetailsSummary.svelte';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const pvHelper = dependencyAccessor.get<PvHelper>(PvHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1PersistentVolume}
  typedUI={{} as PvUI}
  kind="PersistentVolume"
  resourceName="persistentvolumes"
  listName="Persistent Volumes"
  name={name}
  transformer={pvHelper.getPvUI.bind(pvHelper)}
  SummaryComponent={PvDetailsSummary} />
