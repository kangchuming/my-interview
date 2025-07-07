export async function getToken(appid: string, accessKey: string) {
  const response = await fetch('https://openspeech.bytedance.com/api/v1/sts/token', {
    method: 'POST',
    headers: {
      Authorization: `Bearer; ${accessKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appid,
      duration: 300,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`获取token失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.jwt_token;
}