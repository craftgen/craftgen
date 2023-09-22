import * as React from "react";
import tw from "tailwind-styled-components";

import { ClassicScheme, Presets } from "rete-react-plugin";
const { useConnection } = Presets.classic;

const Svg = tw.svg`
w-screen h-screen overflow-visible pointer-events-none absolute
`;

const Path = tw.path<{ styles?: (props: any) => any }>`
fill-none stroke-[5px] pointer-events-auto stroke-primary 
`;

export function CustomConnection(props: {
  data: ClassicScheme["Connection"] & { isLoop?: boolean };
  styles?: () => any;
}) {
  const { path } = useConnection();
  if (!path) return null;

  // const config = React.useMemo(() => {
  //   return socketConfig[props.data.];
  // }, [props.data.name]);

  return (
    <Svg data-testid="connection">
      <Path d={path} />
    </Svg>
  );
}
