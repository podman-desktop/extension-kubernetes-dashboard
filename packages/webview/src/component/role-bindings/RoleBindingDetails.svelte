<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { RoleBindingHelper } from './role-binding-helper';
import type { RoleBindingUI } from './RoleBindingUI';
import type { V1RoleBinding } from '@kubernetes/client-node';
import RoleBindingDetailsSummary from './RoleBindingDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const roleBindingHelper = dependencyAccessor.get<RoleBindingHelper>(RoleBindingHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1RoleBinding}
  typedUI={{} as RoleBindingUI}
  kind="RoleBinding"
  resourceName="rolebindings"
  listName="Role Bindings"
  name={name}
  namespace={namespace}
  transformer={roleBindingHelper.getRoleBindingUI.bind(roleBindingHelper)}
  SummaryComponent={RoleBindingDetailsSummary} />
