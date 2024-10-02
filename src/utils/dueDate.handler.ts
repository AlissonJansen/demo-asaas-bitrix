export function dueDateHandler(days: number, brasilFormat?: boolean) {
  const currentDate = new Date();
  const dueDate = new Date(currentDate);

  dueDate.setDate(currentDate.getDate() + days);

  const americanFormat = dueDate.toISOString().split("T")[0];
  const brasilianFormat = dueDate.toISOString().split("T")[0].split("-").reverse().join("/").replace(",", "");

  if(brasilFormat) {
    return brasilianFormat;
  }

  return americanFormat;
}
