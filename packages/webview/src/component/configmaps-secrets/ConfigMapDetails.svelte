<script lang="ts">
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import KubernetesNamespacedObjectDetails from '../objects/KubernetesNamespacedObjectDetails.svelte';
import { ConfigMapSecretHelper } from './configmap-secret-helper';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const configMapSecretHelper = dependencyAccessor.get<ConfigMapSecretHelper>(ConfigMapSecretHelper);
</script>

<KubernetesNamespacedObjectDetails
  kind="ConfigMap"
  resourceName="configmaps"
  name={name}
  namespace={namespace}
  transformer={configMapSecretHelper.getConfigMapSecretUI.bind(configMapSecretHelper)}>
  {#snippet content({ objectUI: configmapUI, object: configmap, events })}
    <div>
      <h1>ConfigMap Details</h1>
      <p>Namespace: {configmapUI.namespace} / {configmap.metadata?.namespace}</p>
      <p>Name: {configmapUI.name} / {configmap.metadata?.name}</p>
      <p>Events: {events?.length}</p>
    </div>
  {/snippet}
</KubernetesNamespacedObjectDetails>
