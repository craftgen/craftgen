import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { ClassicPreset } from "rete";

type SliderControlOptions = {
  max: number;
  step: number;
  change: (value: number) => void;
};

export class NumberControl extends ClassicPreset.Control {
  __type = "number";

  constructor(public value: number, public options: SliderControlOptions) {
    super();
  }

  setValue(value: number) {
    this.value = value;
    if (this.options?.change) this.options.change(value);
  }
}

export function SliderControlComponenet(props: { data: NumberControl }) {
  const [value, setValue] = useState<number>(props.data.value);
  const handleChange = (value: number) => {
    setValue(value);
    props.data.setValue(value);
  };
  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);
  return (
    <div>
      <Input type="number" value={value} onChange={handleChange} />
    </div>
  );
}
