import { useEffect, useState } from "react";

import type { FileControl } from "@seocraft/core/src/controls/file";

import { Input } from "@/components/ui/input";

export function FileControlComponent(props: { data: FileControl }) {
  const [value, setValue] = useState(props.data.value);

  useEffect(() => {
    setValue(props.data.value);
  }, [props.data.value]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    const base64 = await new Promise<string | ArrayBuffer | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    // Read the file into a buffer
    // Set MIME type for PNG image
    // const mimeType = "image/png";
    // // Create the data URI
    // const dataURI = `data:${mimeType};base64,${base64}`;

    setValue(base64 as any);
    props.data.setValue(base64 as any);
  };

  return (
    <>
      <Input
        id={props.data.id}
        type="file"
        // value={value}
        accept=".jpg, .png"
        onChange={(e) => {
          console.log(e);
          handleChange(e);
          // setValue(e.target.files ? e.target.files[0] : null);
          // props.data.setValue(e.target.value);
        }}
      />
      {value && <img src={`${value}`} />}
    </>
  );
}
