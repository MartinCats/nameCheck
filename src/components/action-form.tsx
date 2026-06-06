"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type FormAction = (formData: FormData) => Promise<void>;

const initialState: ActionState = { status: "idle", message: "" };

async function runAction(
  action: FormAction,
  successMessage: string,
  errorMessage: string,
  formData: FormData,
): Promise<ActionState> {
  try {
    await action(formData);
    return { status: "success", message: successMessage };
  } catch (error) {
    return { status: "error", message: friendlyError(error, errorMessage) };
  }
}

function friendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (!message) return fallback;
  if (message.includes("duplicate") || message.includes("already exists") || message.includes("unique")) {
    return "พบข้อมูลซ้ำ กรุณาตรวจสอบอีกครั้ง";
  }
  if (message.includes("violates row-level security") || message.includes("permission denied")) {
    return "คุณไม่มีสิทธิ์ทำรายการนี้";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่";
  }
  return message;
}

export function ActionForm({
  action,
  children,
  className,
  successMessage,
  errorMessage = "ทำรายการไม่สำเร็จ กรุณาลองใหม่",
  confirmMessage,
  confirmUncheckedName,
  confirmUncheckedMessage,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  successMessage: string;
  errorMessage?: string;
  confirmMessage?: string;
  confirmUncheckedName?: string;
  confirmUncheckedMessage?: string;
}) {
  const [state, formAction] = useActionState(
    async (_previous: ActionState, formData: FormData): Promise<ActionState> =>
      runAction(action, successMessage, errorMessage, formData),
    initialState,
  );

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirmUncheckedName && confirmUncheckedMessage) {
          const formData = new FormData(event.currentTarget);
          if (!formData.has(confirmUncheckedName) && !window.confirm(confirmUncheckedMessage)) {
            event.preventDefault();
            return;
          }
        }
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
      {state.status !== "idle" ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            state.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "กำลังบันทึก...",
  variant = "primary",
  className = "",
  disabled,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} className={className} disabled={disabled || pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
