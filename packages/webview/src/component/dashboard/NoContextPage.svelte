<script lang="ts">
import KubeIcon from '/@/component/icons/KubeIcon.svelte';
</script>

<div class="mt-8 flex justify-center overflow-auto">
  <div class="max-w-[600px] flex flex-col text-center space-y-3">
    <div class="flex justify-center text-[var(--pd-details-empty-icon)] py-2">
      <KubeIcon size="80" />
    </div>
    <h1 class="text-xl text-[var(--pd-details-empty-header)]">No Kubernetes cluster</h1>
    <div class="text-[var(--pd-details-empty-sub-header)] text-pretty">
      A Kubernetes cluster is a group of nodes (virtual or physical) that run Kubernetes, a system for automating the
      deployment and management of containerized applications.
    </div>
  </div>
</div>
