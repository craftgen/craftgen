import JsonView from "react18-json-view";

import { JsonControl } from "@seocraft/core/src/controls/json";

export const JsonControlComponent = (props: { data: JsonControl }) => {
  return (
    <div>
      <JsonView src={props.data.value} editable collapsed={2} />
    </div>
  );
};
