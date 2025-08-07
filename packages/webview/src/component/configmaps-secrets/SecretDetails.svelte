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
  kind="Secret"
  resourceName="secrets"
  name={name}
  namespace={namespace}
  transformer={configMapSecretHelper.getConfigMapSecretUI.bind(configMapSecretHelper)}>
  {#snippet content({ objectUI: secretUI, object: secret, events })}
    <div>
      <h1>Secret Details</h1>
      <p>Namespace: {secretUI.namespace} / {secret.metadata?.namespace}</p>
      <p>Name: {secretUI.name} / {secret.metadata?.name}</p>
      <p>Events: {events?.length}</p>
    </div>
  {/snippet}
</KubernetesNamespacedObjectDetails>
