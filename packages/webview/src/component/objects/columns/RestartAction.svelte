<script lang="ts">
import { faRotate } from '@fortawesome/free-solid-svg-icons';

import IconButton from '/@/component/button/IconButton.svelte';

import type { ObjectProps } from './object-props';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';
import { API_CONTEXTS } from '/@common/index';
import { type KubernetesNamespacedObjectUI } from '/@/component/objects/KubernetesObjectUI';

let { object }: ObjectProps = $props();

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

async function restartKubernetesObject(obj: KubernetesNamespacedObjectUI): Promise<void> {
  await contextsApi.restartObject(obj.kind, obj.name, obj.namespace);
}
</script>

<IconButton
  enabled={object.status !== 'DELETING'}
  title={`Restart ${object.kind}`}
  onClick={(): Promise<void> => restartKubernetesObject(object as KubernetesNamespacedObjectUI)}
  icon={faRotate} />
