<script lang="ts">
import humanizeDuration from 'humanize-duration';
import moment from 'moment';

interface Props {
  conditions: {
    type: string;
    status: string;
    lastTransitionTime?: Date;
    reason?: string;
    message?: string;
  }[];
}
let { conditions }: Props = $props();
</script>

<tr>
  <td colspan="2">
    <table class="w-full ml-2.5 border-separate border-spacing-x-3 border-spacing-y-1" aria-label="conditions">
      <tbody>
        <tr>
          <th scope="col" class="px-2 py-1 text-left">Type</th>
          <th scope="col" class="px-2 py-1 text-left">Status</th>
          <th scope="col" class="px-2 py-1 text-left">Updated</th>
          <th scope="col" class="px-2 py-1 text-left">Reason</th>
          <th scope="col" class="px-2 py-1 text-left">Message</th>
        </tr>
        {#each conditions as condition, index (index)}
          <tr>
            <td class="px-2 py-1 align-top">{condition.type}</td>
            <td class="px-2 py-1 align-top">{condition.status}</td>
            <td class="px-2 py-1 align-top">
              {humanizeDuration(moment().diff(condition.lastTransitionTime), { round: true, largest: 1 })}
            </td>
            <td class="px-2 py-1 align-top">{condition.reason}</td>
            <td class="px-2 py-1 align-top">{condition.message}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </td>
</tr>
