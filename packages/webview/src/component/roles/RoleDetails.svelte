<script lang="ts">
import { getContext } from 'svelte';
import KubernetesObjectDetails from '/@/component/objects/KubernetesObjectDetails.svelte';
import { DependencyAccessor } from '/@/inject/dependency-accessor';
import { RoleHelper } from './role-helper';
import type { RoleUI } from './RoleUI';
import type { V1Role } from '@kubernetes/client-node';
import RoleDetailsSummary from './RoleDetailsSummary.svelte';

interface Props {
  name: string;
  namespace: string;
}
let { name, namespace }: Props = $props();

const dependencyAccessor = getContext<DependencyAccessor>(DependencyAccessor);
const roleHelper = dependencyAccessor.get<RoleHelper>(RoleHelper);
</script>

<KubernetesObjectDetails
  typed={{} as V1Role}
  typedUI={{} as RoleUI}
  kind="Role"
  resourceName="roles"
  listName="Roles"
  name={name}
  namespace={namespace}
  transformer={roleHelper.getRoleUI.bind(roleHelper)}
  SummaryComponent={RoleDetailsSummary} />
