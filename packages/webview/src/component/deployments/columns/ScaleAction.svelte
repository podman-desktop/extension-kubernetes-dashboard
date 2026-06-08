<script lang="ts">
import { faScaleBalanced } from '@fortawesome/free-solid-svg-icons';

import IconButton from '/@/component/button/IconButton.svelte';

import { API_CONTEXTS } from '@kubernetes-dashboard/channels';
import { getContext } from 'svelte';
import { Remote } from '/@/remote/remote';

import type { Props } from './props';

let { object }: Props = $props();

const remote = getContext<Remote>(Remote);
const contextsApi = remote.getProxy(API_CONTEXTS);

async function scaleObject(): Promise<void> {
  await contextsApi.scaleObject(object.kind, object.name, object.namespace, object.replicas);
}
</script>

<IconButton
  enabled={object.status !== 'DELETING'}
  title={`Scale ${object.kind}`}
  onClick={scaleObject}
  icon={faScaleBalanced} />
