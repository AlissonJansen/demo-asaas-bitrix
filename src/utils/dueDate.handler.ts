export function dueDateHandler(days: number) {
    const currentDate = new Date();
    const dueDate = new Date(currentDate);

    dueDate.setDate(currentDate.getDate() + days);

    return dueDate.toISOString().split("T")[0];
}