import type { ControllerRenderProps } from "react-hook-form";

import { Input } from "@craftgen/ui/components/input";

export const renderField = (type: string, field: ControllerRenderProps) => {
  switch (type) {
    case "string":
      return <Input defaultValue={""} placeholder="craftgen" {...field} />;
    case "number":
      return (
        <Input
          defaultValue={0}
          type="number"
          placeholder="123"
          {...field}
          onChange={(e) => field.onChange(Number(e.target.value))}
        />
      );
    case "boolean":
      return <Input type="checkbox" {...field} />; // TODO: Check this guy out
    default:
      return null;
  }
};
