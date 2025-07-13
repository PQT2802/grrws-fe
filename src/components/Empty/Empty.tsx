import { Inbox } from "lucide-react";

interface PropType {
  size: number;
  message?: string;
}

const Empty = (props: PropType) => {
  const { size, message } = props;

  return (
    <div className="w-full flex flex-col items-center gap-1">
      <Inbox size={size} />
      <h1 className="text-sm text-gray-400 dark:text-gray-500">{message ? message : "Nothing here"}</h1>
    </div>
  );
};

export default Empty;
