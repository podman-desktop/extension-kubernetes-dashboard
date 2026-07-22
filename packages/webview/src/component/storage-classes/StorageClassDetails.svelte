<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { StorageClassHelper } from './storage-class-helper';
import type { StorageClassUI } from './StorageClassUI';
import type { V1StorageClass } from '@kubernetes/client-node';
import StorageClassDetailsSummary from './StorageClassDetailsSummary.svelte';

interface Props {
  name: string;
}
let { name }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const storageClassHelper = dependencyAccessor.get<StorageClassHelper>(StorageClassHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1StorageClass}
  typedUI={{} as StorageClassUI}
  kind="StorageClass"
  resourceName="storageclasses"
  listName="Storage Classes"
  name={name}
  transformer={storageClassHelper.getStorageClassUI.bind(storageClassHelper)}
  SummaryComponent={StorageClassDetailsSummary} />
