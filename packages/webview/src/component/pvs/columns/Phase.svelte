<script lang="ts">
import {
  faCircle,
  faClock,
  faLink,
  faQuestionCircle,
  faTimesCircle,
  faUnlink,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import Fa from 'svelte-fa';

import type { Props } from './props';
import Label from '/@/component/label/Label.svelte';

let { object }: Props = $props();

function getPhaseAttributes(phase: string): { color: string; icon: IconDefinition } {
  switch (phase) {
    case 'Bound':
      return { color: 'text-(--pd-status-running)', icon: faLink };
    case 'Available':
      return { color: 'text-(--pd-status-updated)', icon: faCircle };
    case 'Released':
      return { color: 'text-(--pd-status-paused)', icon: faUnlink };
    case 'Failed':
      return { color: 'text-(--pd-status-dead)', icon: faTimesCircle };
    case 'Pending':
      return { color: 'text-(--pd-status-starting)', icon: faClock };
    default:
      return { color: 'text-(--pd-status-unknown)', icon: faQuestionCircle };
  }
}
</script>

<Label name={object.pvStatus}>
  <Fa size="1x" icon={getPhaseAttributes(object.pvStatus).icon} class={getPhaseAttributes(object.pvStatus).color} />
</Label>
