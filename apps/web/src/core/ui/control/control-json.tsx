import { useEffect, useState } from "react";
import JsonView from "react18-json-view";

import { JsonControl } from "@seocraft/core/src/controls/json";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const JsonControlComponent = (props: { data: JsonControl }) => {
  const [value, setValue] = useState(props.data.value);

  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);
  const handleChange = (val: { src: any }) => {
    console.log(val.src);
    setValue(val.src);
    props.data.setValue(val.src);
  };
  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>
        {props.data?.definition?.title || props.data?.definition?.name}
      </Label>
      <JsonView
        src={value}
        editable
        collapsed={2}
        onAdd={handleChange}
        onDelete={handleChange}
        onEdit={handleChange}
      />
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
};
