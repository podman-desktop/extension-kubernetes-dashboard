<script lang="ts">
import {
  faArrowDown,
  faArrowUp,
  faCheckCircle,
  faExclamationTriangle,
  faQuestionCircle,
  faSync,
  faTimesCircle,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import Fa from 'svelte-fa';

import type { DeploymentCondition } from '/@/component/deployments/DeploymentUI';
import type { Props } from './props';
import Label from '/@/component/label/Label.svelte';

let { object }: Props = $props();

// Determine both the icon and color based on the deployment condition
function getConditionAttributes(condition: DeploymentCondition): { name: string; color: string; icon: IconDefinition } {
  const defaults = {
    name: condition.type,
    color: 'text-(--pd-status-unknown)',
    icon: faQuestionCircle,
  };

  // Condition map for easier lookup
  const conditionMap: { [key: string]: { name: string; color: string; icon: IconDefinition } } = {
    'Available:MinimumReplicasAvailable': {
      color: 'text-(--pd-status-running)',
      name: 'Available',
      icon: faCheckCircle,
    },
    'Available:MinimumReplicasUnavailable': {
      color: 'text-(--pd-status-degraded)',
      name: 'Unavailable',
      icon: faTimesCircle,
    },
    'Progressing:ReplicaSetUpdated': {
      color: 'text-(--pd-status-updated)',
      name: 'Updated',
      icon: faSync,
    },
    'Progressing:NewReplicaSetCreated': {
      color: 'text-(--pd-status-updated)',
      name: 'New Replica Set',
      icon: faSync,
    },
    'Progressing:NewReplicaSetAvailable': {
      color: 'text-(--pd-status-running)',
      name: 'Progressed',
      icon: faSync,
    },
    'Progressing:ReplicaSetScaledUp': {
      color: 'text-(--pd-status-updated)',
      name: 'Scaled Up',
      icon: faArrowUp,
    },
    'Progressing:ReplicaSetScaledDown': {
      color: 'text-(--pd-status-updated)',
      name: 'Scaled Down',
      icon: faArrowDown,
    },
    'Progressing:ProgressDeadlineExceeded': {
      color: 'text-(--pd-status-dead)',
      name: 'Deadline Exceeded',
      icon: faTimesCircle,
    },
    'ReplicaFailure:ReplicaFailure': {
      color: 'text-(--pd-status-dead)',
      name: 'Replica Failure',
      icon: faExclamationTriangle,
    },
  };

  // Construct the key from type and reason
  const key = `${condition.type}:${condition.reason}`;

  // Return the corresponding attributes or default if not found
  return conditionMap[key] ?? defaults;
}
</script>

<div class="flex flex-row gap-1">
  {#each object.conditions as condition, index (index)}
    <Label tip={condition.message} name={getConditionAttributes(condition).name}>
      <Fa size="1x" icon={getConditionAttributes(condition).icon} class={getConditionAttributes(condition).color} />
    </Label>
  {/each}
</div>
