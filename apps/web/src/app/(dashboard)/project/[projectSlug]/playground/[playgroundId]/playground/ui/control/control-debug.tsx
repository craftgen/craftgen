import { ClassicPreset } from "rete";

export class DebugControl extends ClassicPreset.Control {
  __type = "debug";
  constructor(public value: any) {
    super();
  }
}

export function DebugControlComponent(props: { data: DebugControl }) {
  return (
    <pre>
      <code>{JSON.stringify(props.data.value, null, 2)}</code>
    </pre>
  );
}
