<script lang="ts">
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ConfigMapSecretHelper } from './configmap-secret-helper';
import KubernetesObjectDetails from '../objects/KubernetesObjectDetails.svelte';
import type { V1ConfigMap } from '@kubernetes/client-node';
import type { ConfigMapSecretUI } from './ConfigMapSecretUI';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const configMapSecretHelper = dependencyAccessor.get<ConfigMapSecretHelper>(ConfigMapSecretHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1ConfigMap}
  typedUI={{} as ConfigMapSecretUI}
  kind="ConfigMap"
  resourceName="configmaps"
  name={name}
  namespace={namespace}
  transformer={configMapSecretHelper.getConfigMapSecretUI.bind(configMapSecretHelper)}>
  {#snippet content({ objectUI: configmapUI, object: configmap })}
    <div>
      <h1>ConfigMap Details</h1>
      <p>Namespace: {configmapUI.namespace} / {configmap.metadata?.namespace}</p>
      <p>Name: {configmapUI.name} / {configmap.metadata?.name}</p>
    </div>
  {/snippet}
</KubernetesObjectDetails>
