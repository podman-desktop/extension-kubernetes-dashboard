<script lang="ts">
interface Props {
  size?: string;
  solid?: boolean;
}

let { size = '40', solid = false }: Props = $props();

let fill = solid ? 'currentColor' : 'none';
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill={fill} viewBox="0 0 36 32">
  <g>
    <rect
      width="34"
      height="30"
      x="1"
      y="1"
      stroke="currentColor"
      stroke-dasharray="2 3.5"
      stroke-linecap="round"
      stroke-width="2"
      rx="6"
      style="stroke:currentColor;stroke-opacity:1"></rect>
  </g>
</svg>
