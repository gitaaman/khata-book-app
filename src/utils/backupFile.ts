export function downloadBackupFile(
jsonData: string,
fileName = "KhataBook_Backup.json"
): void {
const blob = new Blob([jsonData], {
type: "application/json;charset=utf-8",
});

const url = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = url;
link.download = fileName;
link.style.display = "none";

document.body.appendChild(link);
link.click();
document.body.removeChild(link);

URL.revokeObjectURL(url);
}