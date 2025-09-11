<script lang="ts">
interface Props {
  size?: string;
  solid?: boolean;
}

let { size = '40', solid = true }: Props = $props();

let fill = solid ? 'currentColor' : 'none';
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill={fill} viewBox="-2 -4 31.89 31.86">
  <g>
    <path
      d="M 24 12 Z Z Z Z Z M 0 0 v 2.12 h 4.25 V 0 H 0 Z M 6.37 0 v 2.12 h 21.24 V 0 H 6.37 Z M 8.49 6.37 v 2.12 h 4.25 v -2.12 h -4.25 Z M 14.87 6.37 v 2.12 h 12.74 v -2.12 h -12.74 Z M 8.5 12.74 v 2.12 h 4.24 v -2.12 h -4.24 Z M 14.89 12.74 v 2.12 h 3.45 h 9.26 h 0 V 12.7 Z M 0 19.11 v 2.12 h 4.24 v -2.12 H 0 Z M 6.37 19.11 v 2.12 h 21.03 v -2.13 H 6.37 Z"
    ></path>
  </g>
</svg>
