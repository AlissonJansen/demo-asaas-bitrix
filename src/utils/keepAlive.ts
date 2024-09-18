export async function keepAlive() {
  const url = "https://demo-asaas-bitrix-8b6q.onrender.com";

  await fetch(url).catch((e) => console.log(e));
}
