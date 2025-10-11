<script lang="ts">
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import IconButton from '/@/component/button/IconButton.svelte';

import type { ObjectProps } from './object-props';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_CONTEXTS } from '@kubernetes-dashboard/channels';
import type { KubernetesObjectUI } from '/@/component/objects/KubernetesObjectUI';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { KubernetesObjectUIHelper } from '/@/component/objects/kubernetes-object-ui-helper';

let { object }: ObjectProps = $props();

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const objectHelper = dependencyAccessor.get<KubernetesObjectUIHelper>(KubernetesObjectUIHelper);

async function deleteKubernetesObject(obj: KubernetesObjectUI): Promise<void> {
  obj.status = 'DELETING';
  if (objectHelper.isNamespaced(obj)) {
    await contextsApi.deleteObject(obj.kind, obj.name, obj.namespace);
  } else {
    await contextsApi.deleteObject(obj.kind, obj.name);
  }
}
</script>

<IconButton
  enabled={object.status !== 'DELETING'}
  title={`Delete ${object.kind}`}
  onClick={(): Promise<void> => deleteKubernetesObject(object)}
  icon={faTrash} />
