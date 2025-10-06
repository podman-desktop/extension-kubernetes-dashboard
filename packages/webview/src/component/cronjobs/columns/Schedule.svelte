<script lang="ts">
import cronstrue from 'cronstrue';

interface Props {
  object: string;
}

let { object }: Props = $props();

function getScheduleReadableText(schedule: string): string {
  try {
    return cronstrue.toString(schedule);
  } catch (error) {
    return schedule;
  }
}
</script>

<div class="text-[var(--pd-table-body-text)] max-w-full text-wrap line-clamp-2">
  <span>{getScheduleReadableText(object)}</span>
</div>
