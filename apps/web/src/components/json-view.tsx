import JsonView from "react18-json-view";

import "react18-json-view/src/style.css";

export const JSONView: React.FC<{ data: any }> = ({ data }) => {
  return <JsonView src={data} displaySize collapsed={1} />;
};
