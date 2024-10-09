import { ButtonMessage, TextMessage } from "@/types/Message";

export default function ReceivedButtonTextMessageUI(props: {
  buttonMessage: ButtonMessage;
}) {
  const { buttonMessage } = props;
  return (
    <div className="bg-[#00000011] p-2 rounded-md flex flex-col gap-2">
      <span className="text-sm">{buttonMessage.button.text}</span>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-gray-500">
          payload: {buttonMessage.button.payload}
        </span>
      </div>
    </div>
  );
}
