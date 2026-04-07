import Swal from "sweetalert2";

const accentColor = "#2dd4bf";
const bgColor = "#08142b";
const textColor = "#f8fafc";

export function showSuccessAlert(title: string, text?: string) {
  // Short auto-closing success toast for completed user actions.
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: accentColor,
    background: bgColor,
    color: textColor,
    timer: 2200,
    timerProgressBar: true,
  });
}

export function showErrorAlert(title: string, text?: string) {
  // Persistent error alert that requires explicit user acknowledgment.
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#ef4444",
    background: bgColor,
    color: textColor,
  });
}

export function showInfoAlert(title: string, text?: string) {
  // Neutral informational prompt used for non-blocking guidance.
  return Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonColor: accentColor,
    background: bgColor,
    color: textColor,
  });
}

export async function showConfirmAlert(title: string, text: string) {
  // Confirmation modal used before potentially destructive actions.
  const result = await Swal.fire({
    icon: "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
    confirmButtonColor: accentColor,
    cancelButtonColor: "#64748b",
    background: bgColor,
    color: textColor,
  });

  return result.isConfirmed;
}
