<script lang="ts">
/* There are many types of volumes that need to be shown, all with different 'name' values, etc.

NOTE: There are eventual improvements we can do to show information regarding each volume.
But this may be outside of the scope of Podman Desktop. If you see any improvements needed below, feel
free to open a PR.

These are the ones which will be shown (see the V1 Volume spec)
'awsElasticBlockStore'?: V1AWSElasticBlockStoreVolumeSource;
'azureDisk'?: V1AzureDiskVolumeSource;
'azureFile'?: V1AzureFileVolumeSource;
'cephfs'?: V1CephFSVolumeSource;
'cinder'?: V1CinderVolumeSource;
'configMap'?: V1ConfigMapVolumeSource;
'csi'?: V1CSIVolumeSource;
'downwardAPI'?: V1DownwardAPIVolumeSource;
'emptyDir'?: V1EmptyDirVolumeSource;
'ephemeral'?: V1EphemeralVolumeSource;
'fc'?: V1FCVolumeSource;
'flexVolume'?: V1FlexVolumeSource;
'flocker'?: V1FlockerVolumeSource;
'gcePersistentDisk'?: V1GCEPersistentDiskVolumeSource;
'gitRepo'?: V1GitRepoVolumeSource;
'glusterfs'?: V1GlusterfsVolumeSource;
'hostPath'?: V1HostPathVolumeSource;
'iscsi'?: V1ISCSIVolumeSource;
'nfs'?: V1NFSVolumeSource;
'persistentVolumeClaim'?: V1PersistentVolumeClaimVolumeSource;
'photonPersistentDisk'?: V1PhotonPersistentDiskVolumeSource;
'portworxVolume'?: V1PortworxVolumeSource;
'projected'?: V1ProjectedVolumeSource;
'quobyte'?: V1QuobyteVolumeSource;
'rbd'?: V1RBDVolumeSource;
'scaleIO'?: V1ScaleIOVolumeSource;
'secret'?: V1SecretVolumeSource;
'storageos'?: V1StorageOSVolumeSource;
'vsphereVolume'?: V1VsphereVirtualDiskVolumeSource;
*/

import type { V1Volume } from '@kubernetes/client-node';

import Cell from '/@/component/details/Cell.svelte';
import Subtitle from '/@/component/details/Subtitle.svelte';

interface Props {
  volume: V1Volume;
}
let { volume }: Props = $props();
</script>

<tr>
  <Subtitle>{volume.name}</Subtitle>
</tr>

{#if volume.awsElasticBlockStore}
  <tr>
    <Cell>AWS EBS</Cell>
    <Cell>{volume.awsElasticBlockStore.volumeID}</Cell>
  </tr>
{/if}
{#if volume.azureDisk}
  <tr>
    <Cell>Azure Disk</Cell>
    <Cell>{volume.azureDisk.diskName}</Cell>
  </tr>
{/if}
{#if volume.azureFile}
  <tr>
    <Cell>Azure File</Cell>
    <Cell>{volume.azureFile.shareName}</Cell>
  </tr>
{/if}
{#if volume.cephfs}
  <tr>
    <Cell>CephFS</Cell>
    <Cell>{volume.cephfs.monitors.join(', ')}</Cell>
  </tr>
{/if}
{#if volume.cinder}
  <tr>
    <Cell>Cinder</Cell>
    <Cell>{volume.cinder.volumeID}</Cell>
  </tr>
{/if}
{#if volume.configMap}
  <tr>
    <Cell>ConfigMap</Cell>
    <Cell>{volume.configMap.name}</Cell>
  </tr>
{/if}
{#if volume.csi}
  <tr>
    <Cell>CSI</Cell>
    <Cell>{volume.csi.driver}</Cell>
  </tr>
{/if}
{#if volume.downwardAPI}
  <tr>
    <Cell>Downward API</Cell>
  </tr>
{/if}
{#if volume.emptyDir}
  <tr>
    <Cell>Empty Directory</Cell>
    <Cell
      >Medium: {volume.emptyDir.medium ?? 'Default'}
      {#if volume.emptyDir.sizeLimit}
        • Size Limit: {volume.emptyDir.sizeLimit}
      {/if}
    </Cell>
  </tr>
{/if}
{#if volume.ephemeral}
  <tr>
    <Cell>Ephemeral</Cell>
  </tr>
{/if}
{#if volume.fc}
  <tr>
    <Cell>Fibre Channel</Cell>
    <!-- For fiber channels, it is always either wwids or combination of target WNS and lun are set, check that they exist and then display them,
      the comment from V1FCVolumeSource: * wwids Optional: FC volume world wide identifiers (wwids) Either wwids or combination of targetWWNs and lun must be set, but not both simultaneously. -->
    {#if volume.fc.wwids}
      <Cell>WWIDS: {volume.fc.wwids.join(', ')}</Cell>
    {:else if volume.fc.targetWWNs && volume.fc.lun}
      <Cell>WWWNs: {volume.fc.targetWWNs.join(', ')} LUN: {volume.fc.lun}</Cell>
    {/if}
  </tr>
{/if}
{#if volume.flexVolume}
  <tr>
    <Cell>Flex Volume</Cell>
    <Cell>{volume.flexVolume.driver}</Cell>
  </tr>
{/if}
{#if volume.flocker}
  <tr>
    <Cell>Flocker</Cell>
    <Cell>{volume.flocker.datasetName}</Cell>
  </tr>
{/if}
{#if volume.gcePersistentDisk}
  <tr>
    <Cell>GCE Persistent Disk</Cell>
    <Cell>{volume.gcePersistentDisk.pdName}</Cell>
  </tr>
{/if}
{#if volume.gitRepo}
  <tr>
    <Cell>Git Repository</Cell>
    <Cell>{volume.gitRepo.repository}</Cell>
  </tr>
{/if}
{#if volume.glusterfs}
  <tr>
    <Cell>GlusterFS</Cell>
    <Cell>{volume.glusterfs.path}</Cell>
  </tr>
{/if}
{#if volume.hostPath}
  <tr>
    <Cell>Host Path</Cell>
    <Cell>{volume.hostPath.path}</Cell>
  </tr>
{/if}
{#if volume.iscsi}
  <tr>
    <Cell>iSCSI</Cell>
    <Cell>{volume.iscsi.targetPortal}</Cell>
  </tr>
{/if}
{#if volume.nfs}
  <tr>
    <Cell>NFS (Network File System)</Cell>
    <Cell>{volume.nfs.path}</Cell>
  </tr>
{/if}
{#if volume.persistentVolumeClaim}
  <tr>
    <Cell>Persistent Volume Claim</Cell>
    <Cell>{volume.persistentVolumeClaim.claimName}</Cell>
  </tr>
{/if}
{#if volume.photonPersistentDisk}
  <tr>
    <Cell>Photon Persistent Disk</Cell>
    <Cell>{volume.photonPersistentDisk.pdID}</Cell>
  </tr>
{/if}
{#if volume.portworxVolume}
  <tr>
    <Cell>Portworx Volume</Cell>
    <Cell>{volume.portworxVolume.volumeID}</Cell>
  </tr>
{/if}
{#if volume.projected}
  <tr>
    <Cell>Projected</Cell>
  </tr>
{/if}
{#if volume.quobyte}
  <tr>
    <Cell>Quobyte</Cell>
    <Cell>{volume.quobyte.registry}</Cell>
  </tr>
{/if}
{#if volume.rbd}
  <tr>
    <Cell>RBD (RADOS Block Device)</Cell>
    <Cell>{volume.rbd.monitors.join(', ')}</Cell>
  </tr>
{/if}
{#if volume.scaleIO}
  <tr>
    <Cell>ScaleIO</Cell>
    <Cell>{volume.scaleIO.gateway}</Cell>
  </tr>
{/if}
{#if volume.secret}
  <tr>
    <Cell>Secret</Cell>
    <Cell>{volume.secret.secretName}</Cell>
  </tr>
{/if}
{#if volume.storageos}
  <tr>
    <Cell>StorageOS</Cell>
    <Cell>{volume.storageos.volumeName}</Cell>
  </tr>
{/if}
{#if volume.vsphereVolume}
  <tr>
    <Cell>vSphere Volume</Cell>
    <Cell>{volume.vsphereVolume.volumePath}</Cell>
  </tr>
{/if}
