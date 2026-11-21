const BASE_URL = "http://localhost:5000/api/tasks";

export async function getTasks() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Faild to load task");
  return res.json();
}

export async function updateTaskStatus(id, status) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Faild to update status");
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Faild to delet task");
}