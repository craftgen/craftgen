import { useSelector } from "@xstate/react";

import type { FileControl } from "@seocraft/core/src/controls/file";

import { Input } from "@craftgen/ui/components/input";
import { Label } from "@craftgen/ui/components/label";
import { cn } from "@/lib/utils";

export function FileControlComponent(props: { data: FileControl }) {
  const value = useSelector(props.data?.actor, props.data.selector);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    const base64 = await new Promise<string | ArrayBuffer | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

    props.data.setValue(base64 as any);
  };

  return (
    <div className="space-y-1">
      <Label htmlFor={props.data.id}>{props.data?.definition?.title}</Label>
      <Input
        id={props.data.id}
        type="file"
        // value={value}
        accept=".jpg, .png"
        onChange={handleChange}
      />
      {value && <img src={`${value}`} />}
      <p className={cn("text-muted-foreground text-[0.8rem]")}>
        {props.data?.definition?.description}
      </p>
    </div>
  );
}
