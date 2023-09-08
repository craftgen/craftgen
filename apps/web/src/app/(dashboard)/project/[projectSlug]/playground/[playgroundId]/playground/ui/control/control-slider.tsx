import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { ClassicPreset } from "rete";

type SliderControlOptions = {
  max: number;
  step: number;
  change: (value: number) => void;
};

export class SliderControl extends ClassicPreset.Control {
  __type = "slider";

  constructor(public value: number, public options: SliderControlOptions) {
    super();
  }

  setValue(value: number) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}

export function SliderControlComponenet(props: { data: SliderControl }) {
  const [value, setValue] = useState<number>(props.data.value);
  const handleChange = (value: number[]) => {
    setValue(value[0]);
    props.data.setValue(value[0]);
  };
  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);
  return (
    <div>
      <span>{value}</span>
      <Slider
        value={[value]}
        onValueChange={handleChange}
        max={props.data.options.max}
        step={props.data.options.step}
      />
    </div>
  );
}
