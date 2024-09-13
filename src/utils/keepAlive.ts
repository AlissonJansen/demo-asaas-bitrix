export async function keepAlive() {
  const url = "https://demo-asaas-bitrix.onrender.com";

  await fetch(url).catch((e) => console.log(e));
}
