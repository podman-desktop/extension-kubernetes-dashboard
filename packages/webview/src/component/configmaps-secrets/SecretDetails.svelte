<script lang="ts">
import { getContext } from 'svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { ConfigMapSecretHelper } from './configmap-secret-helper';
import KubernetesObjectDetails from '../objects/KubernetesObjectDetails.svelte';
import type { V1Secret } from '@kubernetes/client-node';
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
  typed={{} as V1Secret}
  typedUI={{} as ConfigMapSecretUI}
  kind="Secret"
  resourceName="secrets"
  name={name}
  namespace={namespace}
  transformer={configMapSecretHelper.getConfigMapSecretUI.bind(configMapSecretHelper)}>
  {#snippet content({ objectUI: secretUI, object: secret })}
    <div>
      <h1>Secret Details</h1>
      <p>Namespace: {secretUI.namespace} / {secret.metadata?.namespace}</p>
      <p>Name: {secretUI.name} / {secret.metadata?.name}</p>
    </div>
  {/snippet}
</KubernetesObjectDetails>
