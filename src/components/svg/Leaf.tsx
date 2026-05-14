import { useId, type ComponentProps } from "react"

type LeafProps = ComponentProps<"svg">

function Leaf(props: LeafProps) {
  const instanceId = useId().replace(/:/g, "")
  const gradientId = `leaf-gradient-${instanceId}`

  return (
    <svg viewBox="0 0 11.617161 11.871554" fill="none" {...props}>
      <defs>
        <linearGradient
          id={gradientId}
          x1="125.06909"
          y1="37.259777"
          x2="134.55991"
          y2="45.075741"
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(0.60755398,0,0,0.60755398,14.849311,-124.71386)"
        >
          <stop offset="0" stopColor="#3e7400" />
          <stop offset="1" stopColor="#86c241" />
        </linearGradient>
      </defs>
      <g transform="translate(-87.496054,105.64747)">
        <path
          d="m 99.113205,-105.64747 c 0,0 -4.28223,0.57238 -5.37399,0.90097 -1.09176,0.32858 -2.80889,1.68533 -3.61446,2.74529 -0.80558,1.05996 -1.67474,3.497871 -1.83374,4.653228 -0.15899,1.155357 -0.79497,3.572067 -0.79497,3.572067 0,0 3.41308,-0.148395 4.82283,-0.773771 1.40974,-0.625377 4.37764,-2.321313 4.84402,-2.872493 0.46638,-0.551177 1.69592,-2.395508 1.70653,-3.508471 0.0106,-1.11296 0.24378,-4.71682 0.24378,-4.71682 z"
          fill={`url(#${gradientId})`}
        />
      </g>
    </svg>
  )
}

export { Leaf }
