import Image from "next/image";

export function ChatAvatar() {
  return (
    <span className="chat-avatar" aria-hidden="true">
      <span className="chat-avatar-crop">
        <Image src="/logo-light.png" width={80} height={80} alt="" />
      </span>
    </span>
  );
}
