import Swal from "sweetalert2";

const accentColor = "#2dd4bf";
const bgColor = "#08142b";
const textColor = "#f8fafc";

export function showSuccessAlert(title: string, text?: string) {
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
