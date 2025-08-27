<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import Actions from './columns/Actions.svelte';
import type { PVCUI } from './PVCUI';
import type { V1PersistentVolumeClaim } from '@kubernetes/client-node';
import { PVCHelper } from './pvc-helper';
import PvcDetailsSummary from './PVCDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const pvcHelper = dependencyAccessor.get<PVCHelper>(PVCHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1PersistentVolumeClaim}
  typedUI={{} as PVCUI}
  kind="PersistentVolumeClaim"
  resourceName="persistentvolumeclaims"
  listName="Persistent Volume Claims"
  name={name}
  namespace={namespace}
  transformer={pvcHelper.getPVCUI.bind(pvcHelper)}
  ActionsComponent={Actions}
  SummaryComponent={PvcDetailsSummary} />
